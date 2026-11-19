-- Le Mie Spese V3.6 — schema completo per una nuova installazione Supabase
-- Per aggiornare un database esistente usare supabase/migrations/20261119_v3_6_multiuser.sql.

create extension if not exists pgcrypto;

create table public.profiles(
  user_id uuid primary key references auth.users(id) on delete cascade,
  display_name text,
  created_at timestamptz not null default now()
);
create table public.spaces(
  id uuid primary key default gen_random_uuid(), name text not null,
  type text not null check(type in ('personal','shared')),
  invite_code text unique, account_name text not null default 'Spese', created_by uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now()
);
create table public.space_members(
  space_id uuid not null references public.spaces(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role text not null default 'member' check(role in ('owner','member')),
  joined_at timestamptz not null default now(), primary key(space_id,user_id)
);
create table public.accounts(
  id uuid primary key default gen_random_uuid(), user_id uuid not null references auth.users(id) on delete cascade,
  name text not null, currency text not null default 'EUR', created_at timestamptz not null default now(), unique(user_id,name)
);
create table public.categories(
  id uuid primary key default gen_random_uuid(), user_id uuid not null references auth.users(id) on delete cascade,
  space_id uuid not null references public.spaces(id) on delete cascade, name text not null, parent_name text,
  icon text, color text, created_at timestamptz not null default now(), unique(space_id,name)
);
create table public.transactions(
  id uuid primary key default gen_random_uuid(), user_id uuid not null references auth.users(id) on delete cascade,
  space_id uuid not null references public.spaces(id) on delete cascade, created_by uuid references auth.users(id) on delete set null,
  source text, source_id text, date date not null, category_name text not null, amount numeric(14,2) not null,
  currency text not null default 'EUR', note text not null default '', account_name text not null default 'Spese',
  created_at timestamptz not null default now(), unique(user_id,source,source_id)
);
create table public.recurring_transactions(
  id uuid primary key default gen_random_uuid(), user_id uuid not null references auth.users(id) on delete cascade,
  space_id uuid not null references public.spaces(id) on delete cascade, created_by uuid references auth.users(id) on delete set null,
  note text not null default '', category_name text not null, amount numeric(14,2) not null, currency text not null default 'EUR',
  account_name text not null default 'Spese', frequency text not null check(frequency in ('weekly','monthly','yearly')),
  interval_count integer not null default 1, next_run date not null, last_generated date, active boolean not null default true,
  created_at timestamptz not null default now()
);
create table public.classifier_feedback(
  id uuid primary key default gen_random_uuid(), user_id uuid not null references auth.users(id) on delete cascade,
  note_normalized text not null, category_name text not null, created_at timestamptz not null default now()
);
create table public.space_delete_requests(
  id uuid primary key default gen_random_uuid(), space_id uuid not null references public.spaces(id) on delete cascade,
  requested_by uuid not null references auth.users(id) on delete cascade, status text not null default 'pending' check(status in ('pending','rejected','deleted')),
  created_at timestamptz not null default now()
);
create table public.space_delete_votes(
  request_id uuid not null references public.space_delete_requests(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade, vote text not null check(vote in ('approve','reject')),
  created_at timestamptz not null default now(), primary key(request_id,user_id)
);

create unique index spaces_one_personal_per_user on public.spaces(created_by) where type='personal';
create index transactions_space_date_idx on public.transactions(space_id,date desc);
create index transactions_space_author_idx on public.transactions(space_id,created_by);
create index recurring_space_next_idx on public.recurring_transactions(space_id,next_run) where active=true;

create or replace function public.stamp_transaction_scope()
returns trigger language plpgsql set search_path=public,pg_temp as $$
begin
  if tg_op='INSERT' then
    if auth.uid() is not null then new.user_id:=auth.uid(); new.created_by:=auth.uid(); end if;
  else
    new.user_id:=old.user_id; new.created_by:=old.created_by; new.space_id:=old.space_id;
  end if;
  select s.account_name into new.account_name from public.spaces s where s.id=new.space_id;
  return new;
end;$$;
create trigger transactions_scope_guard before insert or update on public.transactions
for each row execute function public.stamp_transaction_scope();

create or replace function public.stamp_recurring_scope()
returns trigger language plpgsql set search_path=public,pg_temp as $$
begin
  if tg_op='INSERT' then
    if auth.uid() is not null then new.user_id:=auth.uid(); new.created_by:=auth.uid(); end if;
  else
    new.user_id:=old.user_id; new.created_by:=old.created_by; new.space_id:=old.space_id;
  end if;
  select s.account_name into new.account_name from public.spaces s where s.id=new.space_id;
  return new;
end;$$;
create trigger recurring_scope_guard before insert or update on public.recurring_transactions
for each row execute function public.stamp_recurring_scope();

-- Helper RLS. SECURITY DEFINER evita ricorsione sulle policy di space_members.
-- Nessun DEFAULT su p_user_id: mantiene non ambigui eventuali helper legacy
-- public.is_space_member(uuid) / public.is_space_owner(uuid).
create or replace function public.is_space_member(
  p_space_id uuid,
  p_user_id uuid
) returns boolean
language sql
stable
security definer
set search_path=public,pg_temp
as $$
  select exists(
    select 1 from public.space_members sm
    where sm.space_id=p_space_id and sm.user_id=p_user_id
  );
$$;

create or replace function public.is_space_owner(
  p_space_id uuid,
  p_user_id uuid
) returns boolean
language sql
stable
security definer
set search_path=public,pg_temp
as $$
  select exists(
    select 1 from public.space_members sm
    where sm.space_id=p_space_id and sm.user_id=p_user_id and sm.role='owner'
  );
$$;

create or replace function public.guard_space_account_name()
returns trigger
language plpgsql
security definer
set search_path=public,pg_temp
as $$
begin
  if new.account_name is distinct from old.account_name and auth.uid() is not null then
    if auth.uid()<>old.created_by or not public.is_space_owner(old.id,auth.uid()) then
      raise exception 'Solo il creatore/owner può rinominare il Conto dello spazio';
    end if;
  end if;
  return new;
end;$$;
create trigger spaces_account_name_guard before update of account_name on public.spaces
for each row execute function public.guard_space_account_name();

-- Ingresso sicuro tramite codice: il codice non viene esposto da una SELECT pubblica.
create or replace function public.join_space_by_code(p_code text)
returns jsonb
language plpgsql
security definer
set search_path=public,pg_temp
as $$
declare
  v_user uuid:=auth.uid();
  v_space public.spaces%rowtype;
begin
  if v_user is null then raise exception 'Unauthorized'; end if;
  select * into v_space
  from public.spaces
  where type='shared' and invite_code=upper(trim(p_code))
  limit 1;
  if v_space.id is null then raise exception 'Codice invito non valido'; end if;
  insert into public.space_members(space_id,user_id,role)
  values(v_space.id,v_user,'member')
  on conflict (space_id,user_id) do nothing;
  return jsonb_build_object('id',v_space.id,'name',v_space.name,'type',v_space.type);
end;
$$;

-- Onboarding atomico: profilo, spazio personale, categorie iniziali e invito opzionale.
create or replace function public.complete_user_onboarding(
  p_display_name text,
  p_invite_code text default null
) returns jsonb
language plpgsql
security definer
set search_path=public,pg_temp
as $$
declare
  v_user uuid:=auth.uid();
  v_name text:=trim(p_display_name);
  v_personal uuid;
  v_shared jsonb;
begin
  if v_user is null then raise exception 'Unauthorized'; end if;
  if length(v_name)<2 then raise exception 'Il nome deve contenere almeno 2 caratteri'; end if;

  insert into public.profiles(user_id,display_name)
  values(v_user,v_name)
  on conflict (user_id) do update set display_name=excluded.display_name;

  select id into v_personal
  from public.spaces
  where created_by=v_user and type='personal'
  limit 1;

  if v_personal is null then
    insert into public.spaces(name,type,created_by)
    values('Personale','personal',v_user)
    returning id into v_personal;
  end if;

  insert into public.space_members(space_id,user_id,role)
  values(v_personal,v_user,'owner')
  on conflict (space_id,user_id) do update set role='owner';

  if not exists(select 1 from public.categories where space_id=v_personal) then
    insert into public.categories(user_id,space_id,name,icon,color) values
      (v_user,v_personal,'Cibo e bevande','food','#E8A023'),
      (v_user,v_personal,'Spesa Supermercato','cart','#6178F3'),
      (v_user,v_personal,'Casa','house','#5C8F72'),
      (v_user,v_personal,'Trasporti','car','#4F8AA8'),
      (v_user,v_personal,'Salute e benessere','health','#E35D78'),
      (v_user,v_personal,'Shopping','bag','#8957D8'),
      (v_user,v_personal,'Svago','play','#B45C9A'),
      (v_user,v_personal,'Viaggi','plane','#4B9BB5'),
      (v_user,v_personal,'Bollette','utilities','#D77B3F'),
      (v_user,v_personal,'Regali','gift','#D85B83'),
      (v_user,v_personal,'Stipendio','wallet','#2EAA7B'),
      (v_user,v_personal,'Altro','tag','#7C849D')
    on conflict (space_id,name) do nothing;
  end if;

  if nullif(trim(coalesce(p_invite_code,'')),'') is not null then
    v_shared:=public.join_space_by_code(p_invite_code);
  end if;

  return jsonb_build_object(
    'personalSpaceId',v_personal,
    'sharedSpace',v_shared,
    'displayName',v_name
  );
end;
$$;

-- Usata quando il proprietario crea uno spazio condiviso.
create or replace function public.copy_personal_categories_to_space(p_space_id uuid)
returns integer
language plpgsql
security definer
set search_path=public,pg_temp
as $$
declare
  v_user uuid:=auth.uid();
  v_personal uuid;
  v_count integer:=0;
begin
  if v_user is null or not public.is_space_member(p_space_id,v_user) then
    raise exception 'Accesso negato';
  end if;
  select id into v_personal from public.spaces
  where created_by=v_user and type='personal' limit 1;
  if v_personal is null then return 0; end if;
  insert into public.categories(user_id,space_id,name,icon,color)
  select v_user,p_space_id,name,icon,color
  from public.categories where space_id=v_personal
  on conflict (space_id,name) do nothing;
  get diagnostics v_count=row_count;
  return v_count;
end;
$$;

grant execute on function public.complete_user_onboarding(text,text) to authenticated;
grant execute on function public.join_space_by_code(text) to authenticated;
grant execute on function public.copy_personal_categories_to_space(uuid) to authenticated;
grant execute on function public.is_space_member(uuid,uuid) to authenticated;
grant execute on function public.is_space_owner(uuid,uuid) to authenticated;

alter table public.profiles enable row level security;
alter table public.spaces enable row level security;
alter table public.space_members enable row level security;
alter table public.categories enable row level security;
alter table public.transactions enable row level security;
alter table public.recurring_transactions enable row level security;

-- Policy V3.6: le vecchie policy possono coesistere; queste abilitano il modello per spazio.
drop policy if exists "v3.6 profiles select" on public.profiles;
create policy "v3.6 profiles select" on public.profiles for select to authenticated
using (
  user_id=auth.uid() or exists(
    select 1 from public.space_members mine
    join public.space_members theirs on theirs.space_id=mine.space_id
    where mine.user_id=auth.uid() and theirs.user_id=profiles.user_id
  )
);
drop policy if exists "v3.6 profiles insert" on public.profiles;
create policy "v3.6 profiles insert" on public.profiles for insert to authenticated
with check(user_id=auth.uid());
drop policy if exists "v3.6 profiles update" on public.profiles;
create policy "v3.6 profiles update" on public.profiles for update to authenticated
using(user_id=auth.uid()) with check(user_id=auth.uid());

drop policy if exists "v3.6 spaces select" on public.spaces;
create policy "v3.6 spaces select" on public.spaces for select to authenticated
using(created_by=auth.uid() or public.is_space_member(id,auth.uid()));
drop policy if exists "v3.6 spaces insert" on public.spaces;
create policy "v3.6 spaces insert" on public.spaces for insert to authenticated
with check(created_by=auth.uid());
drop policy if exists "v3.6 spaces update" on public.spaces;
create policy "v3.6 spaces update" on public.spaces for update to authenticated
using(created_by=auth.uid() and public.is_space_owner(id,auth.uid()))
with check(created_by=auth.uid() and public.is_space_owner(id,auth.uid()));
drop policy if exists "v3.6 spaces delete" on public.spaces;
create policy "v3.6 spaces delete" on public.spaces for delete to authenticated
using(public.is_space_owner(id,auth.uid()));

drop policy if exists "v3.6 members select" on public.space_members;
create policy "v3.6 members select" on public.space_members for select to authenticated
using(public.is_space_member(space_id,auth.uid()));
drop policy if exists "v3.6 members insert" on public.space_members;
create policy "v3.6 members insert" on public.space_members for insert to authenticated
with check(
  user_id=auth.uid() and (
    public.is_space_member(space_id,auth.uid()) or exists(
      select 1 from public.spaces s where s.id=space_id and s.created_by=auth.uid()
    )
  )
);
drop policy if exists "v3.6 members delete" on public.space_members;
create policy "v3.6 members delete" on public.space_members for delete to authenticated
using(user_id=auth.uid() or public.is_space_owner(space_id,auth.uid()));

drop policy if exists "v3.6 categories all" on public.categories;
create policy "v3.6 categories all" on public.categories for all to authenticated
using(public.is_space_member(space_id,auth.uid()))
with check(public.is_space_member(space_id,auth.uid()));

drop policy if exists "v3.6 transactions all" on public.transactions;
create policy "v3.6 transactions all" on public.transactions for all to authenticated
using(public.is_space_member(space_id,auth.uid()))
with check(public.is_space_member(space_id,auth.uid()));

drop policy if exists "v3.6 recurring all" on public.recurring_transactions;
create policy "v3.6 recurring all" on public.recurring_transactions for all to authenticated
using(public.is_space_member(space_id,auth.uid()))
with check(public.is_space_member(space_id,auth.uid()));


alter table public.accounts enable row level security;
alter table public.classifier_feedback enable row level security;
alter table public.space_delete_requests enable row level security;
alter table public.space_delete_votes enable row level security;
create policy "own accounts" on public.accounts for all to authenticated using(auth.uid()=user_id) with check(auth.uid()=user_id);
create policy "own feedback" on public.classifier_feedback for all to authenticated using(auth.uid()=user_id) with check(auth.uid()=user_id);
create policy "v3.6 delete requests" on public.space_delete_requests for all to authenticated
using(public.is_space_member(space_id,auth.uid())) with check(public.is_space_member(space_id,auth.uid()) and requested_by=auth.uid());
create policy "v3.6 delete votes" on public.space_delete_votes for all to authenticated
using(exists(select 1 from public.space_delete_requests r where r.id=request_id and public.is_space_member(r.space_id,auth.uid())))
with check(user_id=auth.uid() and exists(select 1 from public.space_delete_requests r where r.id=request_id and public.is_space_member(r.space_id,auth.uid())));

create or replace function public.finalize_space_delete(p_request_id uuid) returns jsonb
language plpgsql security definer set search_path=public,pg_temp as $$
declare v_space uuid; v_members integer; v_approvals integer; v_rejections integer;
begin
  select space_id into v_space from public.space_delete_requests where id=p_request_id and status='pending';
  if v_space is null or not public.is_space_member(v_space,auth.uid()) then raise exception 'Richiesta non valida'; end if;
  select count(*) into v_members from public.space_members where space_id=v_space;
  select count(*) filter(where vote='approve'),count(*) filter(where vote='reject')
    into v_approvals,v_rejections from public.space_delete_votes where request_id=p_request_id;
  if v_rejections>0 then
    update public.space_delete_requests set status='rejected' where id=p_request_id;
    return jsonb_build_object('status','rejected','approved',v_approvals,'members',v_members);
  end if;
  if v_members>0 and v_approvals>=v_members then
    delete from public.spaces where id=v_space and type='shared';
    return jsonb_build_object('status','deleted','approved',v_approvals,'members',v_members);
  end if;
  return jsonb_build_object('status','pending','approved',v_approvals,'members',v_members);
end;$$;
grant execute on function public.finalize_space_delete(uuid) to authenticated;
