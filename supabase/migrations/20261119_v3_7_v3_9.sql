-- Le Mie Spese V3.7-V3.9 — Budget, Analytics 2.0, Ricorrenze/Abbonamenti
-- Incrementale e idempotente. Eseguire dopo 20261119_v3_6_multiuser.sql.

create table if not exists public.budgets(
  id uuid primary key default gen_random_uuid(),
  space_id uuid not null references public.spaces(id) on delete cascade,
  month date not null check(extract(day from month)=1),
  category_name text,
  category_key text generated always as (coalesce(category_name,'__TOTAL__')) stored,
  amount numeric(14,2) not null check(amount>=0),
  created_by uuid not null references auth.users(id) on delete restrict default auth.uid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(space_id,month,category_key)
);
create index if not exists budgets_space_month_idx on public.budgets(space_id,month);

alter table public.recurring_transactions add column if not exists kind text not null default 'recurring';
alter table public.recurring_transactions add column if not exists auto_post boolean not null default true;
do $$ begin
  if not exists(select 1 from pg_constraint where conname='recurring_transactions_kind_check') then
    alter table public.recurring_transactions add constraint recurring_transactions_kind_check check(kind in ('recurring','subscription'));
  end if;
end $$;

alter table public.transactions add column if not exists recurring_id uuid references public.recurring_transactions(id) on delete set null;
alter table public.transactions add column if not exists recurring_due_date date;
create unique index if not exists transactions_recurring_occurrence_uidx
  on public.transactions(recurring_id,recurring_due_date)
  where recurring_id is not null and recurring_due_date is not null;

create table if not exists public.recurring_payments(
  id uuid primary key default gen_random_uuid(),
  recurring_id uuid not null references public.recurring_transactions(id) on delete cascade,
  space_id uuid not null references public.spaces(id) on delete cascade,
  due_date date not null,
  amount numeric(14,2) not null,
  transaction_id uuid not null references public.transactions(id) on delete cascade,
  confirmed_by uuid not null references auth.users(id) on delete restrict default auth.uid(),
  confirmed_at timestamptz not null default now(),
  unique(recurring_id,due_date)
);
create index if not exists recurring_payments_space_due_idx on public.recurring_payments(space_id,due_date);

create or replace function public.touch_budget_updated_at()
returns trigger language plpgsql set search_path=public,pg_temp as $$
begin new.updated_at:=now(); return new; end;$$;
drop trigger if exists budgets_touch_updated_at on public.budgets;
create trigger budgets_touch_updated_at before update on public.budgets
for each row execute function public.touch_budget_updated_at();

create or replace function public.set_space_budget(
  p_space_id uuid,
  p_month date,
  p_category_name text,
  p_amount numeric
) returns public.budgets
language plpgsql
security definer
set search_path=public,pg_temp
as $$
declare v_budget public.budgets; v_category text:=nullif(trim(coalesce(p_category_name,'')),'');
begin
  if auth.uid() is null or not public.is_space_owner(p_space_id,auth.uid()) then
    raise exception 'Solo l’owner può modificare i budget dello spazio';
  end if;
  if extract(day from p_month)<>1 or p_amount<0 then raise exception 'Budget non valido'; end if;
  if v_category is not null and not exists(select 1 from public.categories where space_id=p_space_id and name=v_category) then
    raise exception 'Categoria non valida per lo spazio';
  end if;
  insert into public.budgets(space_id,month,category_name,amount,created_by)
  values(p_space_id,p_month,v_category,p_amount,auth.uid())
  on conflict(space_id,month,category_key)
  do update set amount=excluded.amount,updated_at=now()
  returning * into v_budget;
  return v_budget;
end;$$;

create or replace function public.advance_recurring_date(p_date date,p_frequency text,p_interval integer)
returns date language plpgsql immutable set search_path=public,pg_temp as $$
declare v_interval integer:=greatest(coalesce(p_interval,1),1); v_target date; v_last integer;
begin
  if p_frequency='weekly' then return p_date+(7*v_interval); end if;
  if p_frequency='yearly' then
    v_target:=make_date(extract(year from p_date)::integer+v_interval,extract(month from p_date)::integer,1);
  elsif p_frequency='monthly' then
    v_target:=(date_trunc('month',p_date)+(v_interval||' months')::interval)::date;
  else raise exception 'Frequenza non valida'; end if;
  v_last:=extract(day from (date_trunc('month',v_target)+interval '1 month - 1 day'))::integer;
  return make_date(extract(year from v_target)::integer,extract(month from v_target)::integer,least(extract(day from p_date)::integer,v_last));
end;$$;

create or replace function public.confirm_recurring_payment(p_recurring_id uuid,p_due_date date)
returns jsonb
language plpgsql
security definer
set search_path=public,pg_temp
as $$
declare v_rule public.recurring_transactions%rowtype; v_transaction uuid; v_payment uuid; v_existing uuid; v_cursor date; v_last date; v_guard integer:=0;
begin
  if auth.uid() is null then raise exception 'Unauthorized'; end if;
  select * into v_rule from public.recurring_transactions where id=p_recurring_id and active=true for update;
  if v_rule.id is null or not public.is_space_member(v_rule.space_id,auth.uid()) then raise exception 'Ricorrenza non accessibile'; end if;
  v_cursor:=v_rule.next_run;
  while v_cursor<p_due_date and v_guard<120 loop
    v_cursor:=public.advance_recurring_date(v_cursor,v_rule.frequency,v_rule.interval_count); v_guard:=v_guard+1;
  end loop;
  if v_cursor<>p_due_date then raise exception 'La data non appartiene alla pianificazione'; end if;
  select id into v_existing from public.recurring_payments where recurring_id=p_recurring_id and due_date=p_due_date;
  if v_existing is not null then
    v_cursor:=v_rule.next_run; v_guard:=0;
    while exists(select 1 from public.recurring_payments where recurring_id=v_rule.id and due_date=v_cursor) and v_guard<120 loop
      v_last:=v_cursor; v_cursor:=public.advance_recurring_date(v_cursor,v_rule.frequency,v_rule.interval_count); v_guard:=v_guard+1;
    end loop;
    update public.recurring_transactions set last_generated=coalesce(v_last,last_generated),next_run=v_cursor where id=v_rule.id;
    return jsonb_build_object('status','already-confirmed','paymentId',v_existing);
  end if;
  insert into public.transactions(user_id,created_by,space_id,source,source_id,recurring_id,recurring_due_date,date,category_name,amount,currency,note,account_name)
  values(auth.uid(),auth.uid(),v_rule.space_id,'recurring',v_rule.id::text||':'||p_due_date::text,v_rule.id,p_due_date,p_due_date,v_rule.category_name,v_rule.amount,v_rule.currency,v_rule.note,v_rule.account_name)
  returning id into v_transaction;
  insert into public.recurring_payments(recurring_id,space_id,due_date,amount,transaction_id,confirmed_by)
  values(v_rule.id,v_rule.space_id,p_due_date,v_rule.amount,v_transaction,auth.uid()) returning id into v_payment;
  v_cursor:=v_rule.next_run; v_guard:=0; v_last:=null;
  while exists(select 1 from public.recurring_payments where recurring_id=v_rule.id and due_date=v_cursor) and v_guard<120 loop
    v_last:=v_cursor; v_cursor:=public.advance_recurring_date(v_cursor,v_rule.frequency,v_rule.interval_count); v_guard:=v_guard+1;
  end loop;
  update public.recurring_transactions set last_generated=coalesce(v_last,last_generated),next_run=v_cursor where id=v_rule.id;
  return jsonb_build_object('status','confirmed','paymentId',v_payment,'transactionId',v_transaction);
end;$$;

grant execute on function public.set_space_budget(uuid,date,text,numeric) to authenticated;
grant execute on function public.confirm_recurring_payment(uuid,date) to authenticated;
grant execute on function public.advance_recurring_date(date,text,integer) to authenticated;

alter table public.budgets enable row level security;
alter table public.recurring_payments enable row level security;
drop policy if exists "v3.7 budgets select" on public.budgets;
create policy "v3.7 budgets select" on public.budgets for select to authenticated using(public.is_space_member(space_id,auth.uid()));
drop policy if exists "v3.7 budgets write" on public.budgets;
create policy "v3.7 budgets write" on public.budgets for all to authenticated
using(public.is_space_owner(space_id,auth.uid())) with check(public.is_space_owner(space_id,auth.uid()) and created_by=auth.uid());
drop policy if exists "v3.9 recurring payments select" on public.recurring_payments;
create policy "v3.9 recurring payments select" on public.recurring_payments for select to authenticated using(public.is_space_member(space_id,auth.uid()));
-- Le scritture dei pagamenti passano esclusivamente dalla funzione atomica confirm_recurring_payment.
