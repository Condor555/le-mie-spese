-- Qoomia V4.1 — Obiettivi di risparmio
-- Incrementale, idempotente e non distruttiva.
-- I contributi restano separati da public.transactions: non sono spese e non
-- entrano nei calcoli di Budget o Statistiche.

create table if not exists public.saving_goals(
  id uuid primary key default gen_random_uuid(),
  space_id uuid not null references public.spaces(id) on delete cascade,
  name text not null check(length(trim(name)) between 2 and 80),
  icon text not null default 'piggy-bank',
  color text not null default '#35A96B' check(color ~ '^#[0-9A-Fa-f]{6}$'),
  target_amount numeric(14,2) not null check(target_amount>0),
  target_date date,
  status text not null default 'active' check(status in ('active','completed')),
  linked_category_name text,
  created_by uuid not null references auth.users(id) on delete restrict default auth.uid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(space_id,id)
);

create index if not exists saving_goals_space_status_idx
  on public.saving_goals(space_id,status,created_at);

create table if not exists public.saving_goal_contributions(
  id uuid primary key default gen_random_uuid(),
  goal_id uuid not null,
  space_id uuid not null references public.spaces(id) on delete cascade,
  amount numeric(14,2) not null check(amount>0),
  contribution_date date not null default current_date,
  note text not null default '',
  contributed_by uuid not null references auth.users(id) on delete restrict default auth.uid(),
  created_at timestamptz not null default now(),
  foreign key(space_id,goal_id) references public.saving_goals(space_id,id) on delete cascade
);

create index if not exists saving_goal_contributions_goal_date_idx
  on public.saving_goal_contributions(goal_id,contribution_date desc,created_at desc);

create or replace function public.touch_saving_goal_updated_at()
returns trigger
language plpgsql
set search_path=public,pg_temp
as $$
begin
  new.updated_at:=now();
  return new;
end;
$$;

drop trigger if exists saving_goals_touch on public.saving_goals;
create trigger saving_goals_touch
before update on public.saving_goals
for each row execute function public.touch_saving_goal_updated_at();
revoke all on function public.touch_saving_goal_updated_at() from public;

create or replace function public.validate_saving_goal_category()
returns trigger
language plpgsql
security definer
set search_path=public,pg_temp
as $$
begin
  if new.linked_category_name is not null and not exists(
    select 1
    from public.categories
    where space_id=new.space_id
      and name=new.linked_category_name
      and kind='income'
  ) then
    raise exception 'La categoria collegata deve essere una categoria income dello spazio';
  end if;
  return new;
end;
$$;

drop trigger if exists saving_goals_category_guard on public.saving_goals;
create trigger saving_goals_category_guard
before insert or update of linked_category_name,space_id on public.saving_goals
for each row execute function public.validate_saving_goal_category();
revoke all on function public.validate_saving_goal_category() from public;

alter table public.saving_goals enable row level security;
alter table public.saving_goal_contributions enable row level security;

grant select,insert,update,delete on public.saving_goals to authenticated;
grant select,insert,update,delete on public.saving_goal_contributions to authenticated;

-- Tutti i membri leggono; solo owner/creatore configura gli obiettivi.
drop policy if exists "v4.1 saving goals select" on public.saving_goals;
create policy "v4.1 saving goals select"
on public.saving_goals for select to authenticated
using(public.is_space_member(space_id,auth.uid()));

drop policy if exists "v4.1 saving goals write" on public.saving_goals;
create policy "v4.1 saving goals write"
on public.saving_goals for all to authenticated
using(public.can_manage_space_budget(space_id,auth.uid()))
with check(public.can_manage_space_budget(space_id,auth.uid()));

-- I membri possono contribuire soltanto a obiettivi attivi dello spazio e
-- l'attribuzione del contributo deve coincidere con auth.uid().
drop policy if exists "v4.1 goal contributions select" on public.saving_goal_contributions;
create policy "v4.1 goal contributions select"
on public.saving_goal_contributions for select to authenticated
using(public.is_space_member(space_id,auth.uid()));

drop policy if exists "v4.1 goal contributions insert" on public.saving_goal_contributions;
create policy "v4.1 goal contributions insert"
on public.saving_goal_contributions for insert to authenticated
with check(
  public.is_space_member(space_id,auth.uid())
  and contributed_by=auth.uid()
  and exists(
    select 1 from public.saving_goals g
    where g.id=goal_id and g.space_id=space_id and g.status='active'
  )
);

drop policy if exists "v4.1 goal contributions update" on public.saving_goal_contributions;
create policy "v4.1 goal contributions update"
on public.saving_goal_contributions for update to authenticated
using(contributed_by=auth.uid() or public.can_manage_space_budget(space_id,auth.uid()))
with check(
  (
    contributed_by=auth.uid()
    and public.is_space_member(space_id,auth.uid())
    and exists(
      select 1 from public.saving_goals g
      where g.id=goal_id and g.space_id=space_id and g.status='active'
    )
  )
  or public.can_manage_space_budget(space_id,auth.uid())
);

drop policy if exists "v4.1 goal contributions delete" on public.saving_goal_contributions;
create policy "v4.1 goal contributions delete"
on public.saving_goal_contributions for delete to authenticated
using(contributed_by=auth.uid() or public.can_manage_space_budget(space_id,auth.uid()));

-- Rimuove soltanto le policy storiche equivalenti dopo aver creato quelle V4.1.
drop policy if exists "v3.9.3 saving goals select" on public.saving_goals;
drop policy if exists "v3.9.3 saving goals write" on public.saving_goals;
drop policy if exists "v3.9.3 goal contributions select" on public.saving_goal_contributions;
drop policy if exists "v3.9.3 goal contributions insert" on public.saving_goal_contributions;
drop policy if exists "v3.9.3 goal contributions update" on public.saving_goal_contributions;
drop policy if exists "v3.9.3 goal contributions delete" on public.saving_goal_contributions;
