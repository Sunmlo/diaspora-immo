-- À appliquer avant l'interface. L'expiration publique est immédiate, sans cron.
-- Les programmes neufs ne sont pas inclus dans cette migration.
begin;
set local lock_timeout = '5s';
set local timezone = 'UTC';

alter table public.properties add column if not exists publication_started_at timestamptz;
alter table public.properties add column if not exists expires_at timestamptz;

create or replace function public.sokile_publication_expiry()
returns trigger language plpgsql security invoker set search_path=public set timezone='UTC' as $$
begin
  -- Ce trigger passe après les protections de modération existantes.
  if new.status='validee' then
    if tg_op='INSERT' or old.status is distinct from 'validee' or old.expires_at is null then
      new.publication_started_at:=now();
      new.expires_at:=now()+case when coalesce(nullif(new.transaction,''),case when new.type ilike '%location%' then 'location' else 'vente' end)='location' then interval '6 months' else interval '1 year' end;
    else
      -- Une modification de métadonnées ne prolonge jamais la publication.
      new.publication_started_at:=old.publication_started_at;
      new.expires_at:=old.expires_at;
    end if;
  elsif tg_op='INSERT' then
    new.publication_started_at:=null; new.expires_at:=null;
  else
    new.publication_started_at:=old.publication_started_at;
    new.expires_at:=old.expires_at;
  end if;
  return new;
end $$;

-- Reprise de l'historique à partir de la validation connue, sinon du dépôt.
-- Le statut ne change pas et ne doit pas déclencher de nouvel email de décision.
update public.properties
set publication_started_at=coalesce(validated_at,modere_le,created_at,now()),
    expires_at=coalesce(validated_at,modere_le,created_at,now())+case when coalesce(nullif(transaction,''),case when type ilike '%location%' then 'location' else 'vente' end)='location' then interval '6 months' else interval '1 year' end
where status='validee' and expires_at is null;

drop trigger if exists zzz_sokile_publication_expiry on public.properties;
create trigger zzz_sokile_publication_expiry before insert or update on public.properties
for each row execute function public.sokile_publication_expiry();
create index if not exists properties_expiration_idx on public.properties(expires_at) where status='validee';

-- Conserver exactement les colonnes publiques déjà autorisées et leur ordre.
do $$ declare definition text; columns text; begin
  select pg_get_viewdef('public.public_properties'::regclass,true) into definition;
  select string_agg(format('v.%I',attname),', ' order by attnum) into columns
    from pg_attribute where attrelid='public.public_properties'::regclass and attnum>0 and not attisdropped
    and attname not in ('publication_started_at','expires_at');
  execute format('create or replace view public.public_properties as select %s, p.publication_started_at, p.expires_at from (%s) v join public.properties p on p.id=v.id where p.status=''validee'' and p.active=true and p.expires_at>now()',columns,rtrim(definition,'; '||chr(10)));
end $$;

create table if not exists public.search_alerts (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  email text not null,
  filters jsonb not null check(jsonb_typeof(filters)='object'),
  created_at timestamptz not null default now(),
  expires_at timestamptz not null default (now()+interval '1 year'),
  cancelled_at timestamptz,
  unsubscribe_token uuid not null unique default gen_random_uuid()
);
alter table public.search_alerts enable row level security;
revoke all on public.search_alerts from public,anon,authenticated;
grant select on public.search_alerts to authenticated;
grant all on public.search_alerts to service_role;
drop policy if exists sokile_read_own_alerts on public.search_alerts;
create policy sokile_read_own_alerts on public.search_alerts for select to authenticated using(owner_id=auth.uid());
create index if not exists search_alerts_owner_idx on public.search_alerts(owner_id,created_at desc);

-- Activation uniquement après déploiement du worker et contrôle de son ordonnanceur.
create table if not exists public.sokile_features (name text primary key, enabled boolean not null default false);
alter table public.sokile_features enable row level security;
revoke all on public.sokile_features from public,anon,authenticated;
grant all on public.sokile_features to service_role;
insert into public.sokile_features(name) values('search_alerts') on conflict do nothing;
create or replace function public.sokile_alerts_available()
returns boolean language sql security definer set search_path=public as $$ select coalesce((select enabled from public.sokile_features where name='search_alerts'),false); $$;
revoke all on function public.sokile_alerts_available() from public;
grant execute on function public.sokile_alerts_available() to anon,authenticated,service_role;

-- La création prend l'adresse vérifiée du compte : impossible d'abonner un tiers.
create or replace function public.sokile_create_alert(p_filters jsonb)
returns public.search_alerts language plpgsql security definer set search_path=public set timezone='UTC' as $$
declare result public.search_alerts; recipient text; k text; v jsonb; normalized jsonb:='{}'; begin
  if not public.sokile_alerts_available() then raise exception 'Les alertes email sont en cours de préparation. Réessayez bientôt.'; end if;
  if auth.uid() is null then raise exception 'Connexion requise' using errcode='42501'; end if;
  select email into recipient from auth.users where id=auth.uid() and email_confirmed_at is not null;
  if recipient is null then raise exception 'Confirmez votre adresse email avant de créer une alerte.' using errcode='42501'; end if;
  if jsonb_typeof(p_filters) is distinct from 'object' or octet_length(p_filters::text)>5000 then raise exception 'Critères invalides'; end if;
  for k,v in select * from jsonb_each(p_filters) loop
    if k in ('priceMin','priceMax','surfaceMin','surfaceMax') then
      if v#>>'{}' not in ('','null') and v<>'null'::jsonb then
        if (v#>>'{}') !~ '^[0-9]+([.][0-9]+)?$' or (v#>>'{}')::numeric>1000000000000 then raise exception 'Limite numérique invalide'; end if;
        normalized:=normalized||jsonb_build_object(k,(v#>>'{}')::numeric);
      end if;
    elsif k in ('country','region','transaction','nature','natureLabel','search','rooms') then
      if jsonb_typeof(v)<>'string' or char_length(v#>>'{}')>200 then raise exception 'Critère invalide'; end if;
      if btrim(v#>>'{}') not in ('','Tous','tous') then normalized:=normalized||jsonb_build_object(k,btrim(v#>>'{}')); end if;
    elsif k='verified' then
      if jsonb_typeof(v)<>'boolean' then raise exception 'Critère invalide'; end if;
      if v='true'::jsonb then normalized:=normalized||jsonb_build_object(k,true); end if;
    elsif k='equipements' then
      if jsonb_typeof(v)<>'array' or jsonb_array_length(v)>30 then raise exception 'Équipements invalides'; end if;
      if exists(select 1 from jsonb_array_elements(v) x where jsonb_typeof(x)<>'string' or char_length(x#>>'{}')>100) then raise exception 'Équipement invalide'; end if;
      select coalesce(jsonb_agg(x order by x),'[]') into v from (select distinct value as x from jsonb_array_elements(v)) q;
      if v<>'[]'::jsonb then normalized:=normalized||jsonb_build_object(k,v); end if;
    else raise exception 'Critère inconnu'; end if;
  end loop;
  if normalized ? 'transaction' and normalized->>'transaction' not in ('vente','location') then raise exception 'Transaction invalide'; end if;
  if normalized ? 'rooms' and normalized->>'rooms' !~ '^[1-5][+]?$' then raise exception 'Nombre de pièces invalide'; end if;
  if (normalized->>'priceMin')::numeric>(normalized->>'priceMax')::numeric or (normalized->>'surfaceMin')::numeric>(normalized->>'surfaceMax')::numeric then raise exception 'Le minimum dépasse le maximum'; end if;
  perform pg_advisory_xact_lock(hashtextextended(auth.uid()::text,37));
  select * into result from public.search_alerts where owner_id=auth.uid() and filters=normalized and cancelled_at is null and expires_at>now() limit 1;
  if found then return result; end if;
  if (select count(*) from public.search_alerts where owner_id=auth.uid() and cancelled_at is null and expires_at>now())>=20 then raise exception 'Vous avez déjà 20 alertes actives. Annulez-en une avant de continuer.'; end if;
  insert into public.search_alerts(owner_id,email,filters) values(auth.uid(),recipient,normalized) returning * into result;
  return result;
end $$;
revoke all on function public.sokile_create_alert(jsonb) from public;
grant execute on function public.sokile_create_alert(jsonb) to authenticated;

create or replace function public.sokile_cancel_alert(p_id uuid)
returns boolean language plpgsql security definer set search_path=public as $$ begin
  update public.search_alerts set cancelled_at=coalesce(cancelled_at,now()) where id=p_id and owner_id=auth.uid();
  return found;
end $$;
revoke all on function public.sokile_cancel_alert(uuid) from public;
grant execute on function public.sokile_cancel_alert(uuid) to authenticated;

-- Appel POST explicite depuis le lien d'email ; un simple GET ne désabonne pas.
create or replace function public.sokile_cancel_alert_by_token(p_token uuid)
returns boolean language plpgsql security definer set search_path=public as $$ begin
  update public.search_alerts set cancelled_at=coalesce(cancelled_at,now()) where unsubscribe_token=p_token;
  return found;
end $$;
revoke all on function public.sokile_cancel_alert_by_token(uuid) from public;
grant execute on function public.sokile_cancel_alert_by_token(uuid) to anon,authenticated;

create or replace function public.sokile_search_text(s text)
returns text language sql immutable set search_path=public as $$
select lower(translate(coalesce(s,''),'ÀÂÄÉÈÊËÎÏÔÖÙÛÜÇàâäéèêëîïôöùûüç','AAAEEEEIIOOUUUCaaaeeeeiioouuuc'));
$$;
create or replace function public.sokile_alert_matches(f jsonb,p jsonb)
returns boolean language plpgsql immutable set search_path=public as $$
declare tr text:=coalesce(nullif(p->>'transaction',''),case when p->>'type' ilike '%location%' then 'location' else 'vente' end);
nat text:=coalesce(nullif(p->>'nature',''),case when p->>'type' ilike '%terrain%' then 'terrain' when p->>'type' ilike '%commercial%' then 'commerce' when p->>'title' ilike '%appartement%' then 'appartement' else 'maison' end);
begin
  return coalesce(
    (not f ? 'country' or f->>'country'=p->>'country')
    and (not f ? 'region' or (f->>'region'='Afrique de l''Ouest' and p->>'country'=any(array['Bénin','Burkina Faso','Côte d''Ivoire','Mali','Niger','Sénégal','Togo'])) or (f->>'region'='Afrique Centrale' and p->>'country'=any(array['Cameroun','Centrafrique','Congo','Gabon','Tchad'])))
    and (not f ? 'transaction' or f->>'transaction'=tr)
    and (not f ? 'nature' or f->>'nature'=nat)
    and (not f ? 'priceMin' or (p->>'price_eur')::numeric>=(f->>'priceMin')::numeric)
    and (not f ? 'priceMax' or (p->>'price_eur')::numeric<=(f->>'priceMax')::numeric)
    and (not f ? 'surfaceMin' or (p->>'surface')::numeric>=(f->>'surfaceMin')::numeric)
    and (not f ? 'surfaceMax' or (p->>'surface')::numeric<=(f->>'surfaceMax')::numeric)
    and (not f ? 'rooms' or (p->>'rooms')::numeric>=replace(f->>'rooms','+','')::numeric)
    and (not coalesce((f->>'verified')::boolean,false) or coalesce((p->>'verified')::boolean,false))
    and (not f ? 'equipements' or coalesce(p->'tags','[]') @> (f->'equipements'))
    and (not f ? 'search' or exists(select 1 from jsonb_array_elements_text(jsonb_build_array(p->>'title',p->>'city',p->>'country',p->>'neighborhood',p->>'description',p->>'agency_name',p->>'type',nat,tr,('{"maison":"Maison ou villa","appartement":"Appartement","immeuble":"Immeuble","terrain":"Terrain à bâtir","agricole":"Terrain agricole ou exploitation","commerce":"Local commercial","bureau":"Bureau","entrepot":"Entrepôt ou local industriel","hotel":"Hôtel ou résidence"}'::jsonb->>nat))||coalesce(p->'tags','[]')) s where strpos(public.sokile_search_text(s),public.sokile_search_text(f->>'search'))>0))
  ,false);
end $$;

create table if not exists public.search_alert_deliveries (
  id uuid primary key default gen_random_uuid(),
  alert_id uuid not null references public.search_alerts(id) on delete cascade,
  property_id bigint not null references public.properties(id) on delete cascade,
  created_at timestamptz not null default now(),
  attempts integer not null default 0,
  first_attempt_at timestamptz,
  leased_until timestamptz,
  lease_token uuid,
  sent_at timestamptz,
  provider_id text,
  payload jsonb,
  last_error text,
  unique(alert_id,property_id)
);
alter table public.search_alert_deliveries enable row level security;
revoke all on public.search_alert_deliveries from public,anon,authenticated;
grant all on public.search_alert_deliveries to service_role;

create or replace function public.sokile_claim_alert_deliveries()
returns table(id uuid,lease_token uuid) language plpgsql security definer set search_path=public as $$ begin
  -- Rattrapage inclus : une panne de l'ordonnanceur ne perd pas les publications.
  insert into public.search_alert_deliveries(alert_id,property_id)
  select a.id,p.id from public.search_alerts a join public.properties p on p.publication_started_at>=a.created_at
  where a.cancelled_at is null and a.expires_at>now() and p.status='validee' and p.active=true and p.expires_at>now()
    and public.sokile_alert_matches(a.filters,to_jsonb(p))
    and not exists(select 1 from public.search_alert_deliveries d where d.alert_id=a.id and d.property_id=p.id)
  order by p.publication_started_at,a.created_at limit 200 on conflict do nothing;
  return query with batch as (
    select d.id from public.search_alert_deliveries d join public.search_alerts a on a.id=d.alert_id join public.properties p on p.id=d.property_id
    where d.sent_at is null and d.attempts<5 and (d.leased_until is null or d.leased_until<now())
      and (d.first_attempt_at is null or d.first_attempt_at>now()-interval '23 hours')
      and a.cancelled_at is null and a.expires_at>now() and p.status='validee' and p.active=true and p.expires_at>now()
    order by d.created_at for update of d skip locked limit 10
  ) update public.search_alert_deliveries d set attempts=d.attempts+1,first_attempt_at=coalesce(d.first_attempt_at,now()),leased_until=now()+interval '5 minutes',lease_token=gen_random_uuid()
  from batch where d.id=batch.id returning d.id,d.lease_token;
end $$;
revoke all on function public.sokile_claim_alert_deliveries() from public;
grant execute on function public.sokile_claim_alert_deliveries() to service_role;

-- Recontrôle juste avant l'envoi : retrait du bien, annulation et expiration.
create or replace function public.sokile_alert_delivery_payload(p_id uuid,p_lease uuid)
returns jsonb language sql security definer set search_path=public as $$
update public.search_alert_deliveries d set payload=coalesce(d.payload,jsonb_build_object('id',d.id,'email',a.email,'token',a.unsubscribe_token,'expires_at',a.expires_at,'property',jsonb_build_object('id',p.id,'title',p.title,'city',p.city,'country',p.country,'price_eur',p.price_eur)))
from public.search_alerts a, public.properties p, auth.users u
where a.id=d.alert_id and p.id=d.property_id and u.id=a.owner_id and u.email=a.email and u.email_confirmed_at is not null
and d.id=p_id and d.lease_token=p_lease and d.sent_at is null and d.leased_until>now()
and a.cancelled_at is null and a.expires_at>now() and p.status='validee' and p.active=true and p.expires_at>now()
and public.sokile_alert_matches(a.filters,to_jsonb(p)) returning d.payload;
$$;
revoke all on function public.sokile_alert_delivery_payload(uuid,uuid) from public;
grant execute on function public.sokile_alert_delivery_payload(uuid,uuid) to service_role;

create or replace function public.sokile_finish_alert_delivery(p_id uuid,p_lease uuid,p_provider_id text,p_error text)
returns boolean language plpgsql security definer set search_path=public as $$ begin
  update public.search_alert_deliveries set sent_at=case when nullif(p_provider_id,'') is not null then now() else null end,
    provider_id=nullif(p_provider_id,''),last_error=left(p_error,200),leased_until=now()+interval '10 minutes'
  where id=p_id and lease_token=p_lease and sent_at is null;
  return found;
end $$;
revoke all on function public.sokile_finish_alert_delivery(uuid,uuid,text,text) from public;
grant execute on function public.sokile_finish_alert_delivery(uuid,uuid,text,text) to service_role;
notify pgrst,'reload schema';
commit;
