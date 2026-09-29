begin;
-- Restrictive checks remain effective even alongside legacy permissive policies.
create policy sokile_leads_submission_guard on public.leads as restrictive
for insert to anon,authenticated with check (
 public.sokile_is_admin() or (
 status in ('alerte','telechargement','signalement')
 and coalesce(traite,false)=false and traite_le is null and note is null
 ));
create policy sokile_reports_submission_guard on public.reports as restrictive
for insert to anon,authenticated with check (
 public.sokile_is_admin() or (
 status='pending' and resolved_at is null and resolved_by is null
 and (reporter_id is null or reporter_id=auth.uid())
 ));
revoke truncate,references,trigger on public.leads,public.reports from public,anon,authenticated;
commit;