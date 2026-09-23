-- Sokilé : préparation privée des offres et essais Stripe, sans encaissement réel.
-- Prérequis : auth.users et public.sokile_is_admin(). Migration réexécutable.
begin;
create or replace function public.sokile_billing_admin() returns boolean
language sql stable security definer set search_path=public as $$
 select public.sokile_is_admin() and exists(select 1 from auth.users where id=auth.uid() and email_confirmed_at is not null)
$$;
revoke all on function public.sokile_billing_admin() from public,anon;
grant execute on function public.sokile_billing_admin() to authenticated;

create table if not exists public.billing_settings (
 id boolean primary key default true check(id),
 test_enabled boolean not null default false,
 updated_at timestamptz not null default now()
);
insert into public.billing_settings(id) values(true) on conflict do nothing;
create table if not exists public.billing_offers (
 id uuid primary key default gen_random_uuid(),
 code text not null unique check(code ~ '^[a-z0-9_-]{2,60}$'),
 name text not null check(length(trim(name)) between 2 and 100),
 category text not null check(category in('agence','promoteur','publicite','visibilite')),
 description text not null default '' check(length(description)<=2000),
 amount_minor integer check(amount_minor between 1 and 99999999),
 currency text not null default 'eur' check(currency in('eur','xof','xaf')),
 billing_interval text not null default 'once' check(billing_interval in('once','month','year')),
 listing_quota integer check(listing_quota between 1 and 100000),
 program_quota integer check(program_quota between 1 and 100000),
 archived boolean not null default false,
 updated_at timestamptz not null default now()
);
insert into public.billing_offers(code,name,category,billing_interval) values
 ('agences','Formule agences','agence','month'),
 ('promoteurs','Formule promoteurs','promoteur','month'),
 ('publicite','Campagne publicitaire','publicite','once'),
 ('visibilite','Mise en avant d’une annonce','visibilite','once')
on conflict(code) do nothing;
create table if not exists public.billing_test_orders (
 id uuid primary key,
 owner_id uuid not null references auth.users(id),
 offer_id uuid not null references public.billing_offers(id),
 offer_name text not null,
 amount_minor integer not null check(amount_minor between 1 and 99999999),
 currency text not null check(currency in('eur','xof','xaf')),
 billing_interval text not null check(billing_interval in('once','month','year')),
 status text not null default 'created' check(status in('created','pending','paid','expired','failed')),
 stripe_session_id text unique,
 stripe_subscription_id text,
 created_at timestamptz not null default now(),
 updated_at timestamptz not null default now(),
 paid_at timestamptz
);
create table if not exists public.billing_test_events (
 event_id text primary key,
 order_id uuid not null references public.billing_test_orders(id),
 event_type text not null,
 received_at timestamptz not null default now()
);
create index if not exists billing_test_orders_created on public.billing_test_orders(created_at desc);
alter table public.billing_settings enable row level security;
alter table public.billing_offers enable row level security;
alter table public.billing_test_orders enable row level security;
alter table public.billing_test_events enable row level security;
revoke all on public.billing_settings,public.billing_offers,public.billing_test_orders,public.billing_test_events from public,anon,authenticated;
grant select on public.billing_settings,public.billing_offers,public.billing_test_orders,public.billing_test_events to authenticated;
grant all on public.billing_settings,public.billing_offers,public.billing_test_orders,public.billing_test_events to service_role;
drop policy if exists billing_admin_read on public.billing_settings;
create policy billing_admin_read on public.billing_settings for select to authenticated using(public.sokile_billing_admin());
drop policy if exists billing_admin_read on public.billing_offers;
create policy billing_admin_read on public.billing_offers for select to authenticated using(public.sokile_billing_admin());
drop policy if exists billing_admin_read on public.billing_test_orders;
create policy billing_admin_read on public.billing_test_orders for select to authenticated using(public.sokile_billing_admin());
drop policy if exists billing_admin_read on public.billing_test_events;
create policy billing_admin_read on public.billing_test_events for select to authenticated using(public.sokile_billing_admin());

create or replace function public.sokile_billing_settings(p_enabled boolean) returns boolean
language plpgsql security definer set search_path=public as $$
begin
 if not public.sokile_billing_admin() then raise exception 'Accès réservé à la gestion.';end if;
 update public.billing_settings set test_enabled=p_enabled,updated_at=now() where id=true;
 return p_enabled;
end $$;
create or replace function public.sokile_billing_save_offer(p_id uuid,p_offer jsonb) returns uuid
language plpgsql security definer set search_path=public as $$
declare v_id uuid:=coalesce(p_id,gen_random_uuid());
begin
 if not public.sokile_billing_admin() then raise exception 'Accès réservé à la gestion.';end if;
 if p_id is not null and not exists(select 1 from public.billing_offers where id=p_id) then raise exception 'Offre introuvable.';end if;
 insert into public.billing_offers(id,code,name,category,description,amount_minor,currency,billing_interval,listing_quota,program_quota,archived)
 values(v_id,coalesce(nullif(p_offer->>'code',''),'offre_'||replace(v_id::text,'-','')),trim(p_offer->>'name'),p_offer->>'category',coalesce(p_offer->>'description',''),(p_offer->>'amount_minor')::integer,p_offer->>'currency',p_offer->>'billing_interval',(p_offer->>'listing_quota')::integer,(p_offer->>'program_quota')::integer,coalesce((p_offer->>'archived')::boolean,false))
 on conflict(id) do update set name=excluded.name,category=excluded.category,description=excluded.description,amount_minor=excluded.amount_minor,currency=excluded.currency,billing_interval=excluded.billing_interval,listing_quota=excluded.listing_quota,program_quota=excluded.program_quota,archived=excluded.archived,updated_at=now();
 return v_id;
end $$;

-- Le navigateur ne fournit jamais de montant : copie atomique du tarif privé.
create or replace function public.sokile_billing_begin(p_offer_id uuid,p_request_id uuid) returns jsonb
language plpgsql security definer set search_path=public as $$
declare o public.billing_test_orders; f public.billing_offers;
begin
 if not public.sokile_billing_admin() then raise exception 'Accès réservé à la gestion.';end if;
 -- Sérialise les doubles clics et la limite de fréquence par compte.
 perform 1 from auth.users where id=auth.uid() for update;
 if not exists(select 1 from public.billing_settings where id and test_enabled) then raise exception 'Les essais de paiement sont désactivés.';end if;
 select * into o from public.billing_test_orders where id=p_request_id;
 if found then
   if o.owner_id<>auth.uid() or o.offer_id<>p_offer_id then raise exception 'Essai inaccessible.';end if;
   return to_jsonb(o);
 end if;
 if (select count(*) from public.billing_test_orders where owner_id=auth.uid() and created_at>now()-interval '1 minute')>=5 then raise exception 'Attendez une minute avant un nouvel essai.';end if;
 select * into f from public.billing_offers where id=p_offer_id and not archived for share;
 if not found or f.amount_minor is null then raise exception 'Définissez un tarif pour cet essai.';end if;
 insert into public.billing_test_orders(id,owner_id,offer_id,offer_name,amount_minor,currency,billing_interval)
 values(p_request_id,auth.uid(),f.id,f.name,f.amount_minor,f.currency,f.billing_interval) returning * into o;
 return to_jsonb(o);
end $$;

-- Seule la fonction serveur peut rattacher une session Stripe et confirmer un essai.
create or replace function public.sokile_billing_attach(p_order_id uuid,p_session_id text) returns boolean
language plpgsql security definer set search_path=public as $$
begin
 if p_session_id is null or p_session_id not like 'cs_test_%' then raise exception 'Session de test requise.';end if;
 update public.billing_test_orders set stripe_session_id=p_session_id,updated_at=now()
 where id=p_order_id and (stripe_session_id is null or stripe_session_id=p_session_id);
 if not found then raise exception 'Session incompatible.';end if;
 return true;
end $$;
create or replace function public.sokile_billing_record(p_event_id text,p_event_type text,p_order_id uuid,p_session_id text,p_status text,p_subscription_id text default null) returns boolean
language plpgsql security definer set search_path=public as $$
declare o public.billing_test_orders;
begin
 if coalesce(p_event_id,'') not like 'evt_%' or p_event_type not in('checkout.session.completed','checkout.session.expired','checkout.session.async_payment_succeeded','checkout.session.async_payment_failed') or p_status not in('pending','paid','expired','failed') then raise exception 'Événement invalide.';end if;
 select * into o from public.billing_test_orders where id=p_order_id for update;
 if not found then raise exception 'Essai introuvable.';end if;
 perform public.sokile_billing_attach(p_order_id,p_session_id);
 insert into public.billing_test_events(event_id,order_id,event_type) values(p_event_id,p_order_id,p_event_type) on conflict(event_id) do nothing;
 if not found then return false;end if;
 -- Une notification tardive ne dégrade jamais un paiement confirmé.
 update public.billing_test_orders set status=case when status='paid' or p_status='paid' then 'paid' when status in('expired','failed') and p_status='pending' then status else p_status end,
 paid_at=case when p_status='paid' then coalesce(paid_at,now()) else paid_at end,
 stripe_subscription_id=coalesce(p_subscription_id,stripe_subscription_id),updated_at=now() where id=p_order_id;
 return true;
end $$;
revoke all on function public.sokile_billing_settings(boolean),public.sokile_billing_save_offer(uuid,jsonb),public.sokile_billing_begin(uuid,uuid) from public,anon;
grant execute on function public.sokile_billing_settings(boolean),public.sokile_billing_save_offer(uuid,jsonb),public.sokile_billing_begin(uuid,uuid) to authenticated;
revoke all on function public.sokile_billing_attach(uuid,text),public.sokile_billing_record(text,text,uuid,text,text,text) from public,anon,authenticated;
grant execute on function public.sokile_billing_attach(uuid,text),public.sokile_billing_record(text,text,uuid,text,text,text) to service_role;
commit;
