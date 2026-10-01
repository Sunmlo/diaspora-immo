begin;
-- Service-only retention; Storage objects are removed through the Storage API.
create or replace function public.sokile_pro_retention(p_dry_run boolean default true)
returns jsonb language plpgsql security invoker set search_path='' as $$
declare dossiers bigint;audits bigint;paths jsonb;
begin
 perform pg_advisory_xact_lock(2061001);
 select count(*) into dossiers from public.pro_verifications where greatest(updated_at,valid_until)<now()-interval '12 months';
 select count(*) into audits from sokile_private.pro_verification_audit where changed_at<now()-interval '12 months';
 if not p_dry_run then
  delete from public.pro_verifications where greatest(updated_at,valid_until)<now()-interval '12 months';
  delete from sokile_private.pro_verification_audit where changed_at<now()-interval '12 months';
 end if;
 select coalesce(jsonb_agg(name),'[]') into paths from (
  select o.name from storage.objects o where o.bucket_id='pro-verification-documents' and o.created_at<now()-interval '30 days'
  and not exists(select 1 from public.pro_verifications v, lateral jsonb_each(v.documents) d where d.value->>'path'=o.name)
  order by o.created_at limit 100
 ) candidates;
 return jsonb_build_object('dossiers',dossiers,'audit_rows',audits,'orphan_paths',paths,'dry_run',p_dry_run);
end $$;
revoke all on function public.sokile_pro_retention(boolean) from public,anon,authenticated;
grant execute on function public.sokile_pro_retention(boolean) to service_role;
grant usage on schema sokile_private to service_role;
grant select,delete on public.pro_verifications,sokile_private.pro_verification_audit to service_role;

-- Notifications and program inquiries must follow the same live public visibility.
do $$ declare f record;definition text;marker text;begin
 for f in select oid,proname from pg_proc where pronamespace='public'::regnamespace and proname in('sokile_claim_alert_deliveries','sokile_alert_delivery_payload','sokile_program_inquiry') loop
  definition:=pg_get_functiondef(f.oid);
  if f.proname='sokile_program_inquiry' then
   marker:='select * into p from public.development_programs';
   if position(marker in definition)=0 then raise exception 'Unexpected program inquiry definition';end if;
   definition:=replace(definition,marker,'if not exists(select 1 from public.public_programs where id=p_program_id) then raise exception ''Ce programme n’est plus disponible.'';end if; '||marker);
  else
   marker:='p.expires_at>now()';
   if position(marker in definition)=0 then raise exception 'Unexpected alert definition';end if;
   definition:=replace(definition,marker,marker||' and exists(select 1 from public.public_properties visible where visible.id=p.id)');
  end if;
  execute definition;
 end loop;
end $$;
notify pgrst,'reload schema';
commit;
