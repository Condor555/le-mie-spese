-- Le Mie Spese V3.9.3 — Macro Budget, impegni programmati e rollover
-- Incrementale e idempotente. Eseguire dopo 20261119_v3_7_v3_9.sql.

create table if not exists public.budget_macro_categories(
  id uuid primary key default gen_random_uuid(),
  space_id uuid not null references public.spaces(id) on delete cascade,
  name text not null check(length(trim(name)) between 2 and 60),
  color text not null default '#68738C' check(color ~ '^#[0-9A-Fa-f]{6}$'),
  sort_order integer not null default 0 check(sort_order>=0),
  rollover_enabled boolean not null default false,
  created_by uuid not null references auth.users(id) on delete restrict default auth.uid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(space_id,name),
  unique(space_id,id)
);
create index if not exists budget_macro_categories_space_order_idx on public.budget_macro_categories(space_id,sort_order,id);

alter table public.categories add column if not exists kind text not null default 'expense';
do $$ begin
  if not exists(select 1 from pg_constraint where conname='categories_kind_check') then
    alter table public.categories add constraint categories_kind_check check(kind in ('expense','income'));
  end if;
end $$;
alter table public.categories add column if not exists macro_category_id uuid;
do $$ begin
  if not exists(select 1 from pg_constraint where conname='categories_macro_category_fk') then
    alter table public.categories add constraint categories_macro_category_fk
      foreign key(macro_category_id)
      references public.budget_macro_categories(id)
      on delete set null;
  end if;
end $$;
create index if not exists categories_space_macro_idx on public.categories(space_id,macro_category_id);

create table if not exists public.macro_budget_allocations(
  id uuid primary key default gen_random_uuid(),
  space_id uuid not null references public.spaces(id) on delete cascade,
  month date not null check(extract(day from month)=1),
  macro_category_id uuid not null,
  allocation_percent numeric(6,3) not null default 0 check(allocation_percent>=0 and allocation_percent<=100),
  base_amount numeric(14,2) not null default 0 check(base_amount>=0),
  rollover_amount numeric(14,2) not null default 0 check(rollover_amount>=0),
  created_by uuid not null references auth.users(id) on delete restrict default auth.uid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  foreign key(space_id,macro_category_id) references public.budget_macro_categories(space_id,id) on delete cascade,
  unique(space_id,month,macro_category_id)
);
create index if not exists macro_budget_allocations_space_month_idx on public.macro_budget_allocations(space_id,month);

create or replace function public.can_manage_space_budget(p_space_id uuid,p_user_id uuid)
returns boolean language sql stable security definer set search_path=public,pg_temp as $$
  select exists(select 1 from public.spaces s where s.id=p_space_id and s.created_by=p_user_id)
    or public.is_space_owner(p_space_id,p_user_id);
$$;
revoke all on function public.can_manage_space_budget(uuid,uuid) from public;
grant execute on function public.can_manage_space_budget(uuid,uuid) to authenticated;

create or replace function public.touch_macro_budget_updated_at()
returns trigger language plpgsql set search_path=public,pg_temp as $$
begin new.updated_at:=now(); return new; end;$$;
drop trigger if exists budget_macro_categories_touch on public.budget_macro_categories;
create trigger budget_macro_categories_touch before update on public.budget_macro_categories
for each row execute function public.touch_macro_budget_updated_at();
drop trigger if exists macro_budget_allocations_touch on public.macro_budget_allocations;
create trigger macro_budget_allocations_touch before update on public.macro_budget_allocations
for each row execute function public.touch_macro_budget_updated_at();

create or replace function public.ensure_default_budget_macros(p_space_id uuid,p_created_by uuid)
returns void language plpgsql security definer set search_path=public,pg_temp as $$
begin
  insert into public.budget_macro_categories(space_id,name,color,sort_order,rollover_enabled,created_by) values
    (p_space_id,'Casa & Utenze','#5BA88D',10,false,p_created_by),
    (p_space_id,'Alimentazione','#E99B35',20,false,p_created_by),
    (p_space_id,'Mobilità','#5B8DEF',30,false,p_created_by),
    (p_space_id,'Salute & Famiglia','#D55E80',40,false,p_created_by),
    (p_space_id,'Tempo libero','#8B6BC9',50,false,p_created_by),
    (p_space_id,'Shopping','#9655F0',60,false,p_created_by),
    (p_space_id,'Viaggi','#2E9BC6',70,false,p_created_by),
    (p_space_id,'Altro','#68738C',80,false,p_created_by)
  on conflict(space_id,name) do nothing;
end;$$;

create or replace function public.seed_budget_macros_for_new_space()
returns trigger language plpgsql security definer set search_path=public,pg_temp as $$
begin
  perform public.ensure_default_budget_macros(new.id,new.created_by);
  return new;
end;$$;
drop trigger if exists spaces_seed_budget_macros on public.spaces;
create trigger spaces_seed_budget_macros after insert on public.spaces
for each row execute function public.seed_budget_macros_for_new_space();
revoke all on function public.ensure_default_budget_macros(uuid,uuid) from public;
revoke all on function public.seed_budget_macros_for_new_space() from public;

-- Crea le otto macro-categorie per tutti gli spazi già presenti.
do $$ declare item record; begin
  for item in select id,created_by from public.spaces loop
    perform public.ensure_default_budget_macros(item.id,item.created_by);
  end loop;
end $$;

-- Materializza eventuali nomi categoria presenti solo nello storico/ricorrenze,
-- così restano assegnabili dal nuovo editor senza modificare i movimenti.
insert into public.categories(user_id,space_id,name)
select s.created_by,names.space_id,names.name
from (
  select distinct space_id,category_name as name from public.transactions where nullif(trim(category_name),'') is not null
  union
  select distinct space_id,category_name as name from public.recurring_transactions where nullif(trim(category_name),'') is not null
) names join public.spaces s on s.id=names.space_id
on conflict(space_id,name) do nothing;

-- Migra come entrate i nomi inequivocabili e le categorie usate esclusivamente
-- con importi positivi. Le categorie miste/ambigue restano expense per compatibilità.
update public.categories c set kind='income',macro_category_id=null
where c.name ~* '(altra entrata|altre entrate|other income|stipend|pensione|bonus|premi|regali ricevuti|rimbor|interess|rendit|vendit|trasferiment.*entrata|dividend|cedola)'
  and not exists(select 1 from public.transactions t where t.space_id=c.space_id and t.category_name=c.name and t.amount<0)
  and not exists(select 1 from public.recurring_transactions r where r.space_id=c.space_id and r.category_name=c.name and r.amount<0);
update public.categories c set kind='income',macro_category_id=null
where c.kind='expense'
  and (
    exists(select 1 from public.transactions t where t.space_id=c.space_id and t.category_name=c.name and t.amount>0)
    or exists(select 1 from public.recurring_transactions r where r.space_id=c.space_id and r.category_name=c.name and r.amount>0)
  )
  and not exists(select 1 from public.transactions t where t.space_id=c.space_id and t.category_name=c.name and t.amount<0)
  and not exists(select 1 from public.recurring_transactions r where r.space_id=c.space_id and r.category_name=c.name and r.amount<0);

-- Set iniziale personalizzabile di fonti di reddito per ogni spazio esistente.
insert into public.categories(user_id,space_id,name,kind,icon,color)
select s.created_by,s.id,seed.name,'income',seed.icon,seed.color
from public.spaces s cross join (values
  ('Stipendio','wallet','#2EAA7B'),('Pensione','bank','#438FDF'),('Bonus/Premi','gift','#E3AD16'),
  ('Regali ricevuti','gift','#DB4B8B'),('Rimborsi','refund','#3E9AA8'),('Interessi/Rendite','investment','#35A96B'),
  ('Vendite','store','#9655F0'),('Trasferimenti in entrata','other-income','#5B8DEF'),('Altra entrata','other-income','#68738C')
) as seed(name,icon,color)
on conflict(space_id,name) do nothing;

insert into public.categories(user_id,space_id,name,kind,icon,color)
select s.created_by,s.id,'Altro','expense','tag','#68738C' from public.spaces s
on conflict(space_id,name) do nothing;

-- Le ricorrenze devono poter generare nuovi movimenti coerenti: solo le regole
-- legacy ambigue vengono spostate sui fallback, senza riscrivere lo storico.
update public.recurring_transactions r set category_name='Altra entrata'
where r.amount>0 and exists(select 1 from public.categories c where c.space_id=r.space_id and c.name=r.category_name and c.kind<>'income');
update public.recurring_transactions r set category_name='Altro'
where r.amount<0 and exists(select 1 from public.categories c where c.space_id=r.space_id and c.name=r.category_name and c.kind<>'expense');

create or replace function public.ensure_default_income_categories(p_space_id uuid)
returns integer language plpgsql security definer set search_path=public,pg_temp as $$
declare v_count integer;
begin
  if auth.uid() is null or not public.can_manage_space_budget(p_space_id,auth.uid()) then raise exception 'Accesso negato'; end if;
  insert into public.categories(user_id,space_id,name,kind,icon,color)
  select auth.uid(),p_space_id,seed.name,'income',seed.icon,seed.color from (values
    ('Stipendio','wallet','#2EAA7B'),('Pensione','bank','#438FDF'),('Bonus/Premi','gift','#E3AD16'),
    ('Regali ricevuti','gift','#DB4B8B'),('Rimborsi','refund','#3E9AA8'),('Interessi/Rendite','investment','#35A96B'),
    ('Vendite','store','#9655F0'),('Trasferimenti in entrata','other-income','#5B8DEF'),('Altra entrata','other-income','#68738C')
  ) as seed(name,icon,color)
  on conflict(space_id,name) do nothing;
  get diagnostics v_count=row_count;return v_count;
end;$$;
revoke all on function public.ensure_default_income_categories(uuid) from public;
grant execute on function public.ensure_default_income_categories(uuid) to authenticated;

-- Copia Personale → Condiviso preservando expense/income e riallineando le macro per nome.
create or replace function public.copy_personal_categories_to_space(p_space_id uuid)
returns integer language plpgsql security definer set search_path=public,pg_temp as $$
declare v_user uuid:=auth.uid();v_personal uuid;v_count integer:=0;
begin
  if v_user is null or not public.is_space_member(p_space_id,v_user) then raise exception 'Accesso negato'; end if;
  select id into v_personal from public.spaces where created_by=v_user and type='personal' limit 1;
  if v_personal is null then return 0; end if;
  insert into public.categories(user_id,space_id,name,kind,icon,color)
  select v_user,p_space_id,name,kind,icon,color from public.categories where space_id=v_personal
  on conflict(space_id,name) do update set icon=excluded.icon,color=excluded.color;
  get diagnostics v_count=row_count;
  update public.categories target set macro_category_id=target_macro.id
  from public.categories source
  join public.budget_macro_categories source_macro on source_macro.id=source.macro_category_id
  join public.budget_macro_categories target_macro on target_macro.space_id=p_space_id and target_macro.name=source_macro.name
  where source.space_id=v_personal and target.space_id=p_space_id and target.name=source.name and target.kind='expense';
  update public.categories set macro_category_id=null where space_id=p_space_id and kind='income';
  return v_count;
end;$$;
revoke all on function public.copy_personal_categories_to_space(uuid) from public;
grant execute on function public.copy_personal_categories_to_space(uuid) to authenticated;

-- Mapping iniziale non distruttivo: le categorie rimangono invariate e ricevono solo il riferimento macro.
update public.categories c
set macro_category_id=m.id
from public.budget_macro_categories m
where m.space_id=c.space_id
  and c.macro_category_id is null
  and c.kind='expense'
  and m.name=case
    when c.name ~* '(viagg|vacanz|ferie|mare|spiaggia|lido|hotel|aereo|volo|campeggio)' then 'Viaggi'
    when c.name ~* '(supermerc|aliment|spesa|cibo|bevande|ristor|pizza|bar|caff|pranzo|cena)' then 'Alimentazione'
    when c.name ~* '(auto|benzina|carbur|diesel|gpl|parchegg|trasport|treno|bus|taxi|moto|scooter|bici)' then 'Mobilità'
    when c.name ~* '(salute|farmac|medic|dott|visita|osped|dent|benessere|famigl|figli|bambin|moglie|marito|animali|veterin)' then 'Salute & Famiglia'
    when c.name ~* '(casa|affitto|mutuo|bollett|utenze|luce|gas|acqua|domestic|arred|pulizi|manutenz)' then 'Casa & Utenze'
    when c.name ~* '(cinema|film|musica|teatro|sport|calcio|palestra|hobby|svago|divert|evento|gaming|videogio)' then 'Tempo libero'
    when c.name ~* '(shopping|acquist|abbigli|vestit|scarpe|regal|elettron|ordini online|amazon)' then 'Shopping'
    else 'Altro'
  end;

-- Le nuove categorie ricevono Altro automaticamente; la scelta esplicita resta riservata a owner/creatore.
create or replace function public.default_category_macro()
returns trigger language plpgsql security definer set search_path=public,pg_temp as $$
begin
  if new.kind='expense' and new.name ~* '(altra entrata|altre entrate|other income|stipend|pensione|bonus|premi|regali ricevuti|rimbor|interess|rendit|vendit|trasferiment.*entrata|dividend|cedola)' then
    new.kind:='income';
  end if;
  if new.kind='income' then
    new.macro_category_id:=null;
  elsif new.macro_category_id is null then
    select id into new.macro_category_id from public.budget_macro_categories
    where space_id=new.space_id and name='Altro' limit 1;
  end if;
  if new.macro_category_id is not null and not exists(
    select 1 from public.budget_macro_categories where id=new.macro_category_id and space_id=new.space_id
  ) then raise exception 'Macro-categoria non valida per lo spazio'; end if;
  return new;
end;$$;
drop trigger if exists categories_default_macro on public.categories;
create trigger categories_default_macro before insert on public.categories
for each row execute function public.default_category_macro();
revoke all on function public.default_category_macro() from public;

create or replace function public.guard_category_macro_assignment()
returns trigger language plpgsql security definer set search_path=public,pg_temp as $$
begin
  if new.kind='income' then new.macro_category_id:=null; end if;
  if new.macro_category_id is not null and not exists(
    select 1 from public.budget_macro_categories where id=new.macro_category_id and space_id=old.space_id
  ) then raise exception 'Macro-categoria non valida per lo spazio'; end if;
  if new.macro_category_id is distinct from old.macro_category_id and auth.uid() is not null
     and not public.can_manage_space_budget(old.space_id,auth.uid()) then
    raise exception 'Solo owner/creatore può assegnare le categorie alle macro-categorie';
  end if;
  return new;
end;$$;
drop trigger if exists categories_macro_owner_guard on public.categories;
create trigger categories_macro_owner_guard before update of macro_category_id on public.categories
for each row execute function public.guard_category_macro_assignment();
revoke all on function public.guard_category_macro_assignment() from public;

create or replace function public.guard_category_kind()
returns trigger language plpgsql security definer set search_path=public,pg_temp as $$
begin
  if new.kind is not distinct from old.kind then return new; end if;
  if new.kind='income' and (
    exists(select 1 from public.transactions where space_id=old.space_id and category_name=old.name and amount<0)
    or exists(select 1 from public.recurring_transactions where space_id=old.space_id and category_name=old.name and amount<0)
  ) then raise exception 'La categoria contiene movimenti di spesa'; end if;
  if new.kind='expense' and (
    exists(select 1 from public.transactions where space_id=old.space_id and category_name=old.name and amount>0)
    or exists(select 1 from public.recurring_transactions where space_id=old.space_id and category_name=old.name and amount>0)
  ) then raise exception 'La categoria contiene movimenti di entrata'; end if;
  if new.kind='income' then new.macro_category_id:=null; end if;
  return new;
end;$$;
drop trigger if exists categories_kind_guard on public.categories;
create trigger categories_kind_guard before update of kind on public.categories
for each row execute function public.guard_category_kind();
revoke all on function public.guard_category_kind() from public;

create or replace function public.validate_transaction_category_kind()
returns trigger language plpgsql security definer set search_path=public,pg_temp as $$
declare v_kind text;
begin
  select kind into v_kind from public.categories where space_id=new.space_id and name=new.category_name;
  if v_kind is null then raise exception 'Categoria non valida per lo spazio'; end if;
  if new.amount<0 and v_kind<>'expense' then raise exception 'Una spesa richiede una categoria expense'; end if;
  if new.amount>0 and v_kind<>'income' then raise exception 'Un’entrata richiede una categoria income'; end if;
  return new;
end;$$;
drop trigger if exists transactions_category_kind_guard on public.transactions;
create trigger transactions_category_kind_guard before insert on public.transactions
for each row execute function public.validate_transaction_category_kind();
drop trigger if exists recurring_category_kind_guard on public.recurring_transactions;
create trigger recurring_category_kind_guard before insert on public.recurring_transactions
for each row execute function public.validate_transaction_category_kind();
revoke all on function public.validate_transaction_category_kind() from public;

-- Converte i vecchi budget categoria in percentuali macro, senza cancellare i record legacy.
insert into public.budgets(space_id,month,category_name,amount,created_by)
select b.space_id,b.month,null,sum(b.amount),s.created_by
from public.budgets b join public.spaces s on s.id=b.space_id
where b.category_name is not null
  and not exists(select 1 from public.budgets total where total.space_id=b.space_id and total.month=b.month and total.category_name is null)
group by b.space_id,b.month,s.created_by
on conflict(space_id,month,category_key) do nothing;

with legacy as (
  select b.space_id,b.month,c.macro_category_id,sum(b.amount)::numeric as legacy_amount
  from public.budgets b
  join public.categories c on c.space_id=b.space_id and c.name=b.category_name
  where b.category_name is not null and c.kind='expense' and c.macro_category_id is not null
  group by b.space_id,b.month,c.macro_category_id
), totals as (
  select b.space_id,b.month,b.amount::numeric as total_amount
  from public.budgets b where b.category_name is null
), grouped as (
  select l.*,t.total_amount,sum(l.legacy_amount) over(partition by l.space_id,l.month) as legacy_sum
  from legacy l join totals t using(space_id,month)
)
insert into public.macro_budget_allocations(space_id,month,macro_category_id,allocation_percent,base_amount,rollover_amount,created_by)
select g.space_id,g.month,g.macro_category_id,
  case when g.total_amount<=0 then 0
       when g.legacy_sum<=g.total_amount then round(g.legacy_amount/g.total_amount*100,3)
       else round(g.legacy_amount/g.legacy_sum*100,3) end,
  case when g.total_amount<=0 then 0
       when g.legacy_sum<=g.total_amount then g.legacy_amount
       else round(g.total_amount*g.legacy_amount/g.legacy_sum,2) end,
  0,
  coalesce((select s.created_by from public.spaces s where s.id=g.space_id),auth.uid())
from grouped g
on conflict(space_id,month,macro_category_id) do nothing;

create or replace function public.save_macro_budget_plan(
  p_space_id uuid,
  p_month date,
  p_total_amount numeric,
  p_allocations jsonb
) returns jsonb
language plpgsql security definer set search_path=public,pg_temp as $$
declare v_sum numeric; v_count integer;
begin
  if auth.uid() is null or not public.can_manage_space_budget(p_space_id,auth.uid()) then
    raise exception 'Solo owner/creatore può modificare il piano budget';
  end if;
  if extract(day from p_month)<>1 or p_total_amount<0 then raise exception 'Budget totale non valido'; end if;
  if jsonb_typeof(coalesce(p_allocations,'[]'::jsonb))<>'array' then raise exception 'Allocazioni non valide'; end if;

  select coalesce(sum(allocation_percent),0),count(*) into v_sum,v_count
  from jsonb_to_recordset(coalesce(p_allocations,'[]'::jsonb))
    as x(macro_category_id uuid,allocation_percent numeric,base_amount numeric,rollover_amount numeric);
  if v_sum>100.001 then raise exception 'La somma delle percentuali supera il 100%%'; end if;
  if exists(
    select 1 from jsonb_to_recordset(coalesce(p_allocations,'[]'::jsonb))
      as x(macro_category_id uuid,allocation_percent numeric,base_amount numeric,rollover_amount numeric)
    where x.allocation_percent<0 or x.allocation_percent>100 or x.base_amount<0 or x.rollover_amount<0
      or not exists(select 1 from public.budget_macro_categories m where m.id=x.macro_category_id and m.space_id=p_space_id)
  ) then raise exception 'Allocazione macro non valida'; end if;

  insert into public.budgets(space_id,month,category_name,amount,created_by)
  values(p_space_id,p_month,null,p_total_amount,auth.uid())
  on conflict(space_id,month,category_key)
  do update set amount=excluded.amount,updated_at=now();

  delete from public.macro_budget_allocations where space_id=p_space_id and month=p_month;
  insert into public.macro_budget_allocations(space_id,month,macro_category_id,allocation_percent,base_amount,rollover_amount,created_by)
  select p_space_id,p_month,x.macro_category_id,round(x.allocation_percent,3),round(x.base_amount,2),round(x.rollover_amount,2),auth.uid()
  from jsonb_to_recordset(coalesce(p_allocations,'[]'::jsonb))
    as x(macro_category_id uuid,allocation_percent numeric,base_amount numeric,rollover_amount numeric)
  where x.allocation_percent>0 or x.base_amount>0 or x.rollover_amount>0;

  return jsonb_build_object('total',p_total_amount,'allocationPercent',v_sum,'allocations',v_count);
end;$$;

create or replace function public.assign_category_macro(p_space_id uuid,p_category_name text,p_macro_category_id uuid)
returns void language plpgsql security definer set search_path=public,pg_temp as $$
begin
  if auth.uid() is null or not public.can_manage_space_budget(p_space_id,auth.uid()) then raise exception 'Accesso negato'; end if;
  if not exists(select 1 from public.budget_macro_categories where id=p_macro_category_id and space_id=p_space_id) then raise exception 'Macro-categoria non valida'; end if;
  update public.categories set macro_category_id=p_macro_category_id where space_id=p_space_id and name=p_category_name and kind='expense';
  if not found then raise exception 'Categoria non trovata'; end if;
end;$$;

create or replace function public.reorder_budget_macros(p_space_id uuid,p_ids uuid[])
returns void language plpgsql security definer set search_path=public,pg_temp as $$
begin
  if auth.uid() is null or not public.can_manage_space_budget(p_space_id,auth.uid()) then raise exception 'Accesso negato'; end if;
  if coalesce(array_length(p_ids,1),0)<>(select count(*) from public.budget_macro_categories where space_id=p_space_id)
     or exists(select 1 from unnest(p_ids) id where not exists(select 1 from public.budget_macro_categories m where m.id=id and m.space_id=p_space_id)) then
    raise exception 'Ordinamento non valido';
  end if;
  update public.budget_macro_categories m set sort_order=x.ordinality*10
  from unnest(p_ids) with ordinality x(id,ordinality)
  where m.id=x.id and m.space_id=p_space_id;
end;$$;

create or replace function public.delete_budget_macro(p_space_id uuid,p_macro_id uuid,p_fallback_id uuid)
returns void language plpgsql security definer set search_path=public,pg_temp as $$
begin
  if auth.uid() is null or not public.can_manage_space_budget(p_space_id,auth.uid()) then raise exception 'Accesso negato'; end if;
  if p_macro_id=p_fallback_id then raise exception 'Scegli una macro-categoria di destinazione diversa'; end if;
  if not exists(select 1 from public.budget_macro_categories where id=p_fallback_id and space_id=p_space_id) then raise exception 'Destinazione non valida'; end if;
  update public.categories set macro_category_id=p_fallback_id where space_id=p_space_id and macro_category_id=p_macro_id;
  delete from public.budget_macro_categories where id=p_macro_id and space_id=p_space_id;
  if not found then raise exception 'Macro-categoria non trovata'; end if;
end;$$;

revoke all on function public.save_macro_budget_plan(uuid,date,numeric,jsonb) from public;
revoke all on function public.assign_category_macro(uuid,text,uuid) from public;
revoke all on function public.reorder_budget_macros(uuid,uuid[]) from public;
revoke all on function public.delete_budget_macro(uuid,uuid,uuid) from public;
grant execute on function public.save_macro_budget_plan(uuid,date,numeric,jsonb) to authenticated;
grant execute on function public.assign_category_macro(uuid,text,uuid) to authenticated;
grant execute on function public.reorder_budget_macros(uuid,uuid[]) to authenticated;
grant execute on function public.delete_budget_macro(uuid,uuid,uuid) to authenticated;

alter table public.budget_macro_categories enable row level security;
alter table public.macro_budget_allocations enable row level security;
grant select,insert,update,delete on public.budget_macro_categories to authenticated;
grant select,insert,update,delete on public.macro_budget_allocations to authenticated;
drop policy if exists "v3.9.3 macro categories select" on public.budget_macro_categories;
create policy "v3.9.3 macro categories select" on public.budget_macro_categories for select to authenticated
using(public.is_space_member(space_id,auth.uid()));
drop policy if exists "v3.9.3 macro categories write" on public.budget_macro_categories;
create policy "v3.9.3 macro categories write" on public.budget_macro_categories for all to authenticated
using(public.can_manage_space_budget(space_id,auth.uid()))
with check(public.can_manage_space_budget(space_id,auth.uid()));
drop policy if exists "v3.9.3 macro allocations select" on public.macro_budget_allocations;
create policy "v3.9.3 macro allocations select" on public.macro_budget_allocations for select to authenticated
using(public.is_space_member(space_id,auth.uid()));
drop policy if exists "v3.9.3 macro allocations write" on public.macro_budget_allocations;
create policy "v3.9.3 macro allocations write" on public.macro_budget_allocations for all to authenticated
using(public.can_manage_space_budget(space_id,auth.uid()))
with check(public.can_manage_space_budget(space_id,auth.uid()));
