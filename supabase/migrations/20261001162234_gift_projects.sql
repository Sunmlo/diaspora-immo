begin;
create table if not exists public.gift_projects (
 user_id uuid primary key references auth.users(id) on delete cascade,
 answers jsonb not null,
 simulation jsonb,
 updated_at timestamptz not null default now(),
 constraint gift_answers_valid check ((
  jsonb_typeof(answers)='object' and octet_length(answers::text)<4000
  and answers ?& array['project','country','mood','need']
  and answers->>'project' in ('buy_house','buy_flat','land','rent_house','rent_flat')
  and answers->>'country' in ('Bénin','Burkina Faso','Cameroun','Centrafrique','Congo','Côte d’Ivoire','Gabon','Mali','Niger','Sénégal','Tchad','Togo')
  and answers->>'mood' in ('natural','modern','warm','light')
  and case when answers->>'project'='land' then answers->>'need' in ('terrain','build','distance')
   when answers->>'project' in ('rent_house','rent_flat') then answers->>'need' in ('security','visit','currency')
   else answers->>'need' in ('distance','security','currency') end
 ) is true),
 constraint gift_simulation_bounded check (simulation is null or (jsonb_typeof(simulation)='object' and octet_length(simulation::text)<20000))
);
alter table public.gift_projects enable row level security;
revoke all on public.gift_projects from public, anon, authenticated;
grant select,insert,update,delete on public.gift_projects to authenticated;
create policy gift_read_own on public.gift_projects for select to authenticated using ((select auth.uid())=user_id);
create policy gift_insert_own on public.gift_projects for insert to authenticated with check ((select auth.uid())=user_id);
create policy gift_update_own on public.gift_projects for update to authenticated using ((select auth.uid())=user_id) with check ((select auth.uid())=user_id);
create policy gift_delete_own on public.gift_projects for delete to authenticated using ((select auth.uid())=user_id);
commit;
