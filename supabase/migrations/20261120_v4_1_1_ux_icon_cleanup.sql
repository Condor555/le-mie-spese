-- Qoomia V4.1.1 — UX follow-up, contributi e cleanup identificatori icona
-- Incrementale, idempotente e non distruttiva.
-- Eseguire dopo 20261120_v4_1_savings_goals.sql.
-- Prima dell'esecuzione usare QOOMIA-V4.1.1-ICON-INVENTORY-READONLY.sql.

-- Mantiene senza modifiche Mare, Matrimonio, Moglie e i brand dedicati.
-- Tutti gli altri id categoria non più presenti nel catalogo verificato passano
-- al fallback Phosphor Tag. Nessuna categoria, transazione o relazione è rimossa.
update public.categories
set icon=case
  when name ~* '(mare|spiaggia|lido|ombrellone|balneare)' then 'beach-umbrella'
  when name ~* '(matrimonio|nozze|fedi|wedding)' then 'wedding-rings'
  when name ~* '(moglie|compagna)' then 'woman'
  else 'tag'
end
where coalesce(nullif(trim(icon),''),'tag') not in (
  'tag','beach-umbrella','wedding-rings','woman',
  'brand:netflix','brand:apple','brand:spotify','brand:amazon',
  'brand:disney','brand:youtube','brand:playstation','brand:xbox',
  'brand:google','brand:uber','brand:airbnb','brand:paypal'
);

-- Riafferma la regola: modifica/eliminazione contributi consentita all'autore
-- del contributo oppure a owner/creatore dello spazio. Per l'autore, l'update
-- resta consentito soltanto mentre l'obiettivo è attivo.
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
