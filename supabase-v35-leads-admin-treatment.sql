-- Sokilé v35 — traitement des demandes réservé à l'administration.
-- Prérequis : public.leads (RLS active) et public.sokile_is_admin() existants.
-- Appliqué et testé en production le 22 septembre 2026.
-- Cette migration n'accorde aucun droit de lecture public, de suppression,
-- ni de modification des coordonnées. Elle ne change aucune demande.
-- Les politiques d'insertion et de lecture existantes restent inchangées.
begin;
set local lock_timeout = '5s';

grant update (traite, traite_le) on table public.leads to authenticated;

drop policy if exists sokile_admin_update_leads on public.leads;
create policy sokile_admin_update_leads
on public.leads for update to authenticated
using (public.sokile_is_admin())
with check (public.sokile_is_admin());

-- Une autre politique permissive ne doit pas autoriser un non-administrateur.
drop policy if exists sokile_admin_update_leads_guard on public.leads;
create policy sokile_admin_update_leads_guard
on public.leads as restrictive for update to authenticated
using (public.sokile_is_admin())
with check (public.sokile_is_admin());

commit;

-- Résultat attendu dans la configuration de production : true, true, false, false, false.
select
has_column_privilege('authenticated','public.leads','traite','UPDATE') as traitement_autorise,
has_column_privilege('authenticated','public.leads','traite_le','UPDATE') as date_autorisee,
has_column_privilege('authenticated','public.leads','email','UPDATE') as modification_email,
has_any_column_privilege('anon','public.leads','UPDATE') as modification_anonyme,
has_table_privilege('authenticated','public.leads','DELETE') as suppression_autorisee;

-- Recette réelle : marquer le signalement TEST comme traité, le retrouver dans
-- Traitées, le remettre à traiter, puis le clôturer à nouveau : OK.
-- Test SQL dans une transaction annulée, rôle authenticated sans identité admin :
-- public.sokile_is_admin() = false ; aucune demande modifiée : OK.
