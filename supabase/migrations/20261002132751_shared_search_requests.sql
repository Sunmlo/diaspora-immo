-- Opt-in search sharing. Existing alerts stay private. Contact details never leave the owner scope.
begin;
set local lock_timeout='5s';
alter table public.search_alerts add column if not exists shared_with_pros boolean not null default false;
alter table public.search_alerts add column if not exists sharing_consented_at timestamptz;
alter table public.search_alerts add column if not exists sharing_revoked_at timestamptz;
alter table public.search_alerts add column if not exists sharing_version integer;
create index if not exists search_alerts_shared_country on public.search_alerts((filters->>'country'),created_at desc) where shared_with_pros and cancelled_at is null;
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
    elsif k in ('country','region','transaction','nature','natureLabel','search','city','rooms') then
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
revoke all on function public.sokile_create_alert(jsonb) from public,anon;
grant execute on function public.sokile_create_alert(jsonb) to authenticated;

create or replace function public.sokile_alert_matches(f jsonb,p jsonb)
returns boolean language plpgsql immutable set search_path=public as $$
declare tr text:=coalesce(nullif(p->>'transaction',''),case when p->>'type' ilike '%location%' then 'location' else 'vente' end);
nat text:=coalesce(nullif(p->>'nature',''),case when p->>'type' ilike '%terrain%' then 'terrain' when p->>'type' ilike '%commercial%' then 'commerce' when p->>'title' ilike '%appartement%' then 'appartement' else 'maison' end);
begin
  return coalesce(
    (not f ? 'country' or f->>'country'=p->>'country')
    and (not f ? 'city' or public.sokile_search_text(btrim(f->>'city'))=public.sokile_search_text(btrim(p->>'city')))
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


-- Private implementations enforce identity; public invoker wrappers expose only the intended API.
create or replace function sokile_private.create_search_request(p_filters jsonb,p_share boolean)
returns public.search_alerts language plpgsql security definer set search_path='' as $$
declare a public.search_alerts; f jsonb; begin
 if auth.uid() is null then raise exception 'Connexion requise' using errcode='42501'; end if;
 if p_share is null or jsonb_typeof(p_filters) is distinct from 'object' or octet_length(p_filters::text)>1500 then raise exception 'Recherche invalide';end if;
 if exists(select 1 from jsonb_object_keys(p_filters) k where k not in('country','city','transaction','nature','priceMax','rooms')) then raise exception 'Critères non pris en charge';end if;
 if not coalesce(p_filters->>'country'=any(array['Bénin','Burkina Faso','Cameroun','Centrafrique','Congo','Côte d''Ivoire','Gabon','Mali','Niger','Sénégal','Tchad','Togo']),false) then raise exception 'Choisissez un pays';end if;
 if not coalesce(p_filters->>'transaction' in('vente','location'),false) or not coalesce(p_filters->>'nature' in('maison','appartement','immeuble','terrain','agricole','commerce','bureau','entrepot','hotel'),false) then raise exception 'Choisissez le type de bien et la transaction';end if;
 if not coalesce(length(btrim(p_filters->>'city')) between 2 and 80 and btrim(p_filters->>'city') ~ '^[[:alpha:]][[:alpha:] .’''-]*$',false) then raise exception 'Indiquez uniquement le nom de la ville, sans coordonnées';end if;
 if not coalesce(p_filters->>'priceMax' ~ '^[0-9]+([.][0-9]+)?$',false) then raise exception 'Indiquez votre budget maximum';end if;
 if (p_filters->>'priceMax')::numeric<=0 then raise exception 'Le budget doit être supérieur à zéro';end if;
 f:=p_filters||jsonb_build_object('city',btrim(p_filters->>'city'));
 a:=public.sokile_create_alert(f);
 -- Apply the explicit sharing choice; duplicate requests retain their original expiry.
 if p_share then
  update public.search_alerts set sharing_consented_at=case when shared_with_pros then sharing_consented_at else now() end,shared_with_pros=true,sharing_revoked_at=null,sharing_version=1 where id=a.id and owner_id=auth.uid() returning * into a;
 else
  update public.search_alerts set sharing_revoked_at=case when shared_with_pros then now() else sharing_revoked_at end,shared_with_pros=false where id=a.id and owner_id=auth.uid() returning * into a;
 end if;
 return a;
end $$;
revoke all on function sokile_private.create_search_request(jsonb,boolean) from public,anon;
grant execute on function sokile_private.create_search_request(jsonb,boolean) to authenticated;

create or replace function public.sokile_create_search_request(p_filters jsonb,p_share boolean)
returns public.search_alerts language sql security invoker set search_path='' as $$ select sokile_private.create_search_request(p_filters,p_share); $$;
revoke all on function public.sokile_create_search_request(jsonb,boolean) from public,anon;
grant execute on function public.sokile_create_search_request(jsonb,boolean) to authenticated;

create or replace function sokile_private.withdraw_search_sharing(p_id uuid)
returns boolean language plpgsql security definer set search_path='' as $$ begin
 if auth.uid() is null then raise exception 'Connexion requise' using errcode='42501';end if;
 update public.search_alerts set shared_with_pros=false,sharing_revoked_at=now() where id=p_id and owner_id=auth.uid();return found;
end $$;
revoke all on function sokile_private.withdraw_search_sharing(uuid) from public,anon;
grant execute on function sokile_private.withdraw_search_sharing(uuid) to authenticated;
create or replace function public.sokile_withdraw_search_sharing(p_id uuid)
returns boolean language sql security invoker set search_path='' as $$ select sokile_private.withdraw_search_sharing(p_id); $$;
revoke all on function public.sokile_withdraw_search_sharing(uuid) from public,anon;
grant execute on function public.sokile_withdraw_search_sharing(uuid) to authenticated;

create or replace function sokile_private.list_search_requests()
returns table(id uuid,filters jsonb,created_at timestamptz,expires_at timestamptz,proposed_property_ids jsonb)
language plpgsql security definer set search_path='' as $$ begin
 if auth.uid() is null then raise exception 'Connexion requise' using errcode='42501';end if;
 return query select a.id,a.filters,a.created_at,a.expires_at,
  coalesce((select jsonb_agg(d.property_id) from public.search_alert_deliveries d join public.properties p on p.id=d.property_id where d.alert_id=a.id and p.owner_id=auth.uid()),'[]'::jsonb)
 from public.search_alerts a where a.shared_with_pros and a.sharing_version=1 and a.cancelled_at is null and a.expires_at>now() and a.owner_id<>auth.uid()
 and (sokile_private.pro_verified(auth.uid(),a.filters->>'country','agence') or sokile_private.pro_verified(auth.uid(),a.filters->>'country','promoteur'))
 order by a.created_at desc,a.id limit 100;
end $$;
revoke all on function sokile_private.list_search_requests() from public,anon;
grant execute on function sokile_private.list_search_requests() to authenticated;
create or replace function public.sokile_list_search_requests()
returns table(id uuid,filters jsonb,created_at timestamptz,expires_at timestamptz,proposed_property_ids jsonb)
language sql security invoker set search_path='' as $$ select * from sokile_private.list_search_requests(); $$;
revoke all on function public.sokile_list_search_requests() from public,anon;
grant execute on function public.sokile_list_search_requests() to authenticated;

create or replace function sokile_private.propose_search_property(p_request uuid,p_property bigint)
returns boolean language plpgsql security definer set search_path='' as $$
declare a public.search_alerts;p public.properties;begin
 if auth.uid() is null then raise exception 'Connexion requise' using errcode='42501';end if;
 if not public.sokile_alerts_available() then raise exception 'Les notifications sont momentanément indisponibles';end if;
 select * into a from public.search_alerts where id=p_request and shared_with_pros and sharing_version=1 and cancelled_at is null and expires_at>now() and owner_id<>auth.uid() for update;
 if not found then raise exception 'Cette recherche n’est plus disponible';end if;
 if not(sokile_private.pro_verified(auth.uid(),a.filters->>'country','agence') or sokile_private.pro_verified(auth.uid(),a.filters->>'country','promoteur')) then raise exception 'Votre dossier professionnel doit être vérifié pour ce pays' using errcode='42501';end if;
 select * into p from public.properties where id=p_property and owner_id=auth.uid() and status='validee' and active=true and expires_at>now() and exists(select 1 from public.public_properties v where v.id=p_property);
 if not found then raise exception 'Choisissez une de vos annonces publiées et disponibles';end if;
 if not public.sokile_alert_matches(a.filters,to_jsonb(p)) then raise exception 'Cette annonce ne correspond pas aux critères de la recherche';end if;
 -- Reuse the existing idempotent email queue, including cancellation and visibility checks.
 insert into public.search_alert_deliveries(alert_id,property_id) values(a.id,p.id) on conflict(alert_id,property_id) do nothing;
 return true;
end $$;
revoke all on function sokile_private.propose_search_property(uuid,bigint) from public,anon;
grant execute on function sokile_private.propose_search_property(uuid,bigint) to authenticated;
create or replace function public.sokile_propose_search_property(p_request uuid,p_property bigint)
returns boolean language sql security invoker set search_path='' as $$ select sokile_private.propose_search_property(p_request,p_property); $$;
revoke all on function public.sokile_propose_search_property(uuid,bigint) from public,anon;
grant execute on function public.sokile_propose_search_property(uuid,bigint) to authenticated;
grant usage on schema sokile_private to authenticated;
commit;
