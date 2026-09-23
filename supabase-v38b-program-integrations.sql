-- Appliquer après v38, avant l’interface ; réutilise l’envoi existant.
begin;
drop trigger if exists sokile_notify_program on public.development_programs;
create trigger sokile_notify_program after insert or update on public.development_programs for each row execute function public.sokile_notify_admin_webhook();
drop trigger if exists sokile_notify_program_inquiry on public.program_inquiries;
create trigger sokile_notify_program_inquiry after insert on public.program_inquiries for each row execute function public.sokile_notify_admin_webhook();
insert into storage.buckets(id,name,public,file_size_limit,allowed_mime_types)
values('program-documents','program-documents',true,10485760,array['application/pdf']) on conflict(id) do nothing;
drop policy if exists program_pdf_upload on storage.objects;
create policy program_pdf_upload on storage.objects for insert to authenticated with check(bucket_id='program-documents' and (storage.foldername(name))[1]=auth.uid()::text and lower(storage.extension(name))='pdf');
-- Pas d’écrasement ni de suppression de document par un autre compte.
create table if not exists public.program_reminder_jobs(
 id uuid primary key default gen_random_uuid(),program_id uuid not null references public.development_programs(id),inventory_at timestamptz not null,
 payload jsonb not null,created_at timestamptz not null default now(),request_id bigint,attempts integer not null default 0,
 first_attempt_at timestamptz,last_attempt_at timestamptz,sent_at timestamptz,unique(program_id,inventory_at)
);
alter table public.program_reminder_jobs enable row level security;
revoke all on public.program_reminder_jobs from public,anon,authenticated;
grant all on public.program_reminder_jobs to service_role;
create or replace function public.sokile_program_reminders() returns integer
language plpgsql security definer set search_path=public,net,vault as $$
declare j record;secret text;request bigint;queued integer:=0;
begin
 -- Un seul job à la fois ; le résultat HTTP est contrôlé au passage suivant.
 if not pg_try_advisory_xact_lock(380023) then return 0;end if;
 update public.program_reminder_jobs j set sent_at=now() from net._http_response r
 where j.request_id=r.id and j.sent_at is null and r.status_code=200 and r.content::jsonb->>'accepted'='true';
 insert into public.program_reminder_jobs(program_id,inventory_at,payload)
 select p.id,p.inventory_updated_at,jsonb_build_object('type','REMINDER','table','development_programs','record',jsonb_build_object('id',p.id,'email',p.email,'title',p.title,'status',p.status,'updated_at',p.inventory_updated_at))
 from public.development_programs p join public.public_programs v on v.id=p.id
 where p.inventory_updated_at<now()-interval '90 days' on conflict do nothing;
 select decrypted_secret into secret from vault.decrypted_secrets where name='sokile_webhook_secret' limit 1;
 if secret is null then raise exception 'Configuration email indisponible.';end if;
 for j in select r.* from public.program_reminder_jobs r join public.public_programs v on v.id=r.program_id join public.development_programs p on p.id=r.program_id join auth.users a on a.id=p.owner_id
 where r.sent_at is null and r.inventory_at=p.inventory_updated_at and a.email=p.email and a.email_confirmed_at is not null
 and r.attempts<3 and (r.first_attempt_at is null or r.first_attempt_at>now()-interval '23 hours') and (r.last_attempt_at is null or r.last_attempt_at<now()-interval '20 minutes') order by r.created_at limit 20 loop
   select net.http_post(url:='https://nhyejaubfxjmmuvetayw.supabase.co/functions/v1/notify-admin',headers:=jsonb_build_object('Content-Type','application/json','x-webhook-secret',secret),body:=j.payload,timeout_milliseconds:=10000) into request;
   update public.program_reminder_jobs set request_id=request,attempts=attempts+1,first_attempt_at=coalesce(first_attempt_at,now()),last_attempt_at=now() where id=j.id;
   queued:=queued+1;
 end loop;
 return queued;
end $$;
revoke all on function public.sokile_program_reminders() from public,anon,authenticated;
grant execute on function public.sokile_program_reminders() to service_role;
select cron.schedule('sokile-program-reminders','*/15 * * * *','select public.sokile_program_reminders();');
commit;
