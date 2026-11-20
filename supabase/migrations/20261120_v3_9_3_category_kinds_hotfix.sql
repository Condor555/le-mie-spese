-- Le Mie Spese V3.9.3 — separazione categorie Entrata/Uscita
-- Incrementale, idempotente e non distruttiva. Eseguire dopo 20261120_v3_9_3_macro_budgets.sql.

alter table public.categories add column if not exists kind text not null default 'expense';
do $$ begin
  if not exists(select 1 from pg_constraint where conname='categories_kind_check') then
    alter table public.categories add constraint categories_kind_check check(kind in ('expense','income'));
  end if;
end $$;

-- Migra soltanto nomi inequivocabili privi di storico negativo.
update public.categories c set kind='income',macro_category_id=null
where c.name ~* '(altra entrata|altre entrate|other income|stipend|pensione|bonus([ /]| e )?premi|regali ricevuti|rimbor|interess([ /]| e )?rendit|vendit|trasferiment.*entrata|dividend|cedola)'
  and not exists(select 1 from public.transactions t where t.space_id=c.space_id and t.category_name=c.name and t.amount<0)
  and not exists(select 1 from public.recurring_transactions r where r.space_id=c.space_id and r.category_name=c.name and r.amount<0);

-- Una categoria usata esclusivamente con importi positivi è income.
update public.categories c set kind='income',macro_category_id=null
where c.kind='expense'
  and (
    exists(select 1 from public.transactions t where t.space_id=c.space_id and t.category_name=c.name and t.amount>0)
    or exists(select 1 from public.recurring_transactions r where r.space_id=c.space_id and r.category_name=c.name and r.amount>0)
  )
  and not exists(select 1 from public.transactions t where t.space_id=c.space_id and t.category_name=c.name and t.amount<0)
  and not exists(select 1 from public.recurring_transactions r where r.space_id=c.space_id and r.category_name=c.name and r.amount<0);

-- Nessuna categoria income può appartenere a una macro-categoria di spesa.
update public.categories set macro_category_id=null where kind='income' and macro_category_id is not null;

-- Canonicalizza due nomi legacy preservando tutte le associazioni storiche.
do $$ declare item record; begin
  for item in select * from (values ('Bonus/Premi','Bonus e premi'),('Interessi/Rendite','Interessi e rendite')) as aliases(old_name,new_name) loop
    insert into public.categories(user_id,space_id,name,kind,icon,color)
    select old.user_id,old.space_id,item.new_name,'income',old.icon,old.color
    from public.categories old
    where old.name=item.old_name
    on conflict(space_id,name) do nothing;

    update public.transactions set category_name=item.new_name where category_name=item.old_name;
    update public.recurring_transactions set category_name=item.new_name where category_name=item.old_name;
    update public.saving_goals set linked_category_name=item.new_name where linked_category_name=item.old_name;
    update public.classifier_feedback set category_name=item.new_name where category_name=item.old_name;
    delete from public.categories where name=item.old_name;
  end loop;
end $$;

-- Set iniziale income per spazi che non possiedono già il nome o un alias equivalente.
insert into public.categories(user_id,space_id,name,kind,icon,color)
select s.created_by,s.id,seed.name,'income',seed.icon,seed.color
from public.spaces s
cross join (values
  ('Stipendio','wallet','#2EAA7B'),
  ('Pensione','bank','#438FDF'),
  ('Bonus e premi','gift','#E3AD16'),
  ('Regali ricevuti','gift','#DB4B8B'),
  ('Rimborsi','refund','#3E9AA8'),
  ('Interessi e rendite','investment','#35A96B'),
  ('Vendite','store','#9655F0'),
  ('Trasferimenti in entrata','other-income','#5B8DEF'),
  ('Altra entrata','other-income','#68738C')
) as seed(name,icon,color)
where not exists(
  select 1 from public.categories c
  where c.space_id=s.id and (
    lower(c.name)=lower(seed.name)
    or (seed.name='Bonus e premi' and c.name ~* '^bonus[ /](premi)$')
    or (seed.name='Interessi e rendite' and c.name ~* '^interessi[ /](rendite)$')
  )
)
on conflict(space_id,name) do nothing;

-- Mantiene income anche gli alias già presenti, senza rinominare categorie o storico.
update public.categories set kind='income',macro_category_id=null
where name ~* '^(bonus/premi|interessi/rendite)$';

-- RLS e ruoli owner/member esistenti restano invariati.
