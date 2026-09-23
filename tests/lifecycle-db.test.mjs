import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
const { PGlite } = await import(process.env.SOKILE_PGLITE_PATH || "@electric-sql/pglite");
const db = new PGlite();
const migration=await readFile(new URL("../supabase-v37-expiration-alerts.sql",import.meta.url),"utf8");
const owner="00000000-0000-4000-8000-000000000001",other="00000000-0000-4000-8000-000000000002";
const q=async(sql,params=[])=> (await db.query(sql,params)).rows;
await db.exec(`create role anon;create role authenticated;create role service_role bypassrls;
create schema auth;create table auth.users(id uuid primary key,email text,email_confirmed_at timestamptz);
create function auth.uid() returns uuid language sql stable as $$ select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid $$;
grant usage on schema auth to anon,authenticated,service_role;
create table public.properties(id bigint generated always as identity primary key,owner_id uuid,status text default 'en_attente',active boolean default false,verified boolean default false,title text,type text,transaction text,nature text,city text,country text,neighborhood text,description text,agency_name text,price_eur numeric,surface numeric,rooms integer,tags jsonb default '[]',created_at timestamptz default now(),validated_at timestamptz,modere_le timestamptz,user_email text,motif_rejet text);
alter table public.properties enable row level security;
grant select,insert,update on public.properties to authenticated;
grant usage on sequence public.properties_id_seq to authenticated;
create policy owner_access on public.properties to authenticated using(owner_id=auth.uid()) with check(owner_id=auth.uid());
create function public.fixture_workflow() returns trigger language plpgsql as $$ begin
  if current_user='authenticated' then new.status:='en_attente';new.active:=false;end if;
  return new;
end $$;
create trigger sokile_property_workflow before insert or update on public.properties for each row execute function public.fixture_workflow();
create view public.public_properties as select id,title,type,transaction,nature,country,city,price_eur,surface,rooms,tags,created_at from public.properties where active=true and status='validee';
grant select on public.public_properties to anon,authenticated;
insert into auth.users values('${owner}','owner@example.com',now()),('${other}','other@example.com',now());
insert into public.properties(title,status,active,type,validated_at) values('Historique','validee',true,'Location','2026-08-31T12:00:00Z');`);
await db.exec(migration);
await db.exec("update public.sokile_features set enabled=true where name='search_alerts';");
const asOwner=async(id,fn)=>{await db.exec(`set role authenticated;select set_config('request.jwt.claim.sub','${id}',false);`);try{return await fn();}finally{await db.exec("reset role;");}};

test("la migration est réexécutable et reprend la date de validation historique",async()=>{
  assert.equal((await q("select expires_at from properties where title='Historique'"))[0].expires_at.toISOString(),"2027-02-28T12:00:00.000Z");
  await db.exec(migration);
  assert.equal((await q("select expires_at from properties where title='Historique'"))[0].expires_at.toISOString(),"2027-02-28T12:00:00.000Z");
});
test("validation : six mois en location, un an en vente, aucune prolongation par métadonnées",async()=>{
  const [r]=await q("insert into properties(title,status,active,transaction) values('Location','validee',true,'location') returning id,expires_at=publication_started_at+interval '6 months' as correct");assert.equal(r.correct,true);
  const [s]=await q("insert into properties(title,status,active,transaction) values('Vente','validee',true,'vente') returning expires_at=publication_started_at+interval '1 year' as correct");assert.equal(s.correct,true);
  const [before]=await q("select expires_at from properties where id=$1",[r.id]);
  await q("update properties set expires_at=now()+interval '10 years',modere_le=now() where id=$1",[r.id]);
  assert.deepEqual((await q("select expires_at from properties where id=$1",[r.id]))[0],before);
});
test("les annonces expirées ne sont plus publiques, même via un lien direct",async()=>{
  // Vieillissement de fixture uniquement, sans changer les règles métier en production.
  await db.exec("alter table properties disable trigger zzz_sokile_publication_expiry;update properties set expires_at=now()-interval '1 second' where title='Historique';alter table properties enable trigger zzz_sokile_publication_expiry;");
  await db.exec("set role anon;");try{assert.equal((await q("select * from public_properties where title='Historique'")).length,0);await assert.rejects(q("select * from properties"));}finally{await db.exec("reset role;");}
});
test("un propriétaire ne peut ni publier ni prolonger directement son annonce",async()=>{
  const [p]=await q("insert into properties(owner_id,title,status,active,transaction) values($1,'Propriétaire','validee',true,'vente') returning id,expires_at",[owner]);
  await asOwner(owner,async()=>{await q("update properties set status='validee',expires_at=now()+interval '10 years' where id=$1",[p.id]);const [r]=await q("select status,expires_at from properties where id=$1",[p.id]);assert.equal(r.status,'en_attente');assert.deepEqual(r.expires_at,p.expires_at);});
  const [renewed]=await q("update properties set status='validee',active=true where id=$1 returning expires_at=publication_started_at+interval '1 year' as correct",[p.id]);assert.equal(renewed.correct,true);
});
test("création d'alerte pour un an et dédoublonnage, adresse imposée par le compte",async()=>{
  await asOwner(owner,async()=>{const [a]=await q("select (sokile_create_alert($1)).*",[{country:"Sénégal",transaction:"location",priceMax:"1000",rooms:"2+"}]);
    assert.equal(a.email,'owner@example.com');assert.equal(a.filters.priceMax,1000);
    assert.equal((await q("select expires_at=created_at+interval '1 year' as ok from search_alerts where id=$1",[a.id]))[0].ok,true);
    const [b]=await q("select (sokile_create_alert($1)).*",[{country:"Sénégal",transaction:"location",priceMax:1000,rooms:"2+"}]);assert.equal(b.id,a.id);
    await assert.rejects(q("insert into search_alerts(owner_id,email,filters) values($1,'victim@example.com','{}')",[owner]));
    await assert.rejects(q("update search_alerts set expires_at=now()+interval '10 years'"));
  });
});
test("les alertes d'un autre compte sont illisibles et ne peuvent pas être annulées",async()=>{
  const [a]=await q("select id from search_alerts where owner_id=$1 limit 1",[owner]);
  await asOwner(other,async()=>{assert.equal((await q("select * from search_alerts")).length,0);assert.equal((await q("select sokile_cancel_alert($1) as ok",[a.id]))[0].ok,false);});
});
test("le matching respecte pays, accents, budget, pièces et équipements",async()=>{
  const p={title:"Appartement meublé",country:"Sénégal",city:"Dakar",transaction:"location",nature:"appartement",price_eur:450,surface:80,rooms:3,tags:["Meublé","Parking"],verified:true};
  const f={country:"Sénégal",search:"meuble",priceMax:500,surfaceMin:60,rooms:"2+",equipements:["Parking"],verified:true};
  assert.equal((await q("select sokile_alert_matches($1,$2) as ok",[f,p]))[0].ok,true);
  for(const filter of [{...f,priceMax:400},{...f,country:"Cameroun"},{...f,rooms:"4+"},{...f,equipements:["Piscine"]},{...f,search:"%"}])assert.equal((await q("select sokile_alert_matches($1,$2) as ok",[filter,p]))[0].ok,false);
});
test("file d'envoi : nouvelle publication seulement, recontrôle d'annulation et pas de doublon",async()=>{
  const [a]=await asOwner(owner,()=>q("select (sokile_create_alert($1)).*",[{country:"Cameroun",transaction:"vente",priceMax:3000}]));
  await q("insert into properties(title,country,city,status,active,transaction,price_eur) values('Nouvelle maison','Cameroun','Douala','validee',true,'vente',2500)");
  await db.exec("set role service_role;");let d;
  try{[d]=await q("select * from sokile_claim_alert_deliveries()");assert.ok(d);assert.equal((await q("select * from sokile_claim_alert_deliveries()")).length,0);
    const [r]=await q("select sokile_alert_delivery_payload($1,$2) as payload",[d.id,d.lease_token]);assert.equal(r.payload.email,'owner@example.com');
  }finally{await db.exec("reset role;");}
  await asOwner(owner,async()=>{assert.equal((await q("select sokile_cancel_alert($1) as ok",[a.id]))[0].ok,true);});
  await db.exec("set role service_role;");try{assert.equal((await q("select sokile_alert_delivery_payload($1,$2) as p",[d.id,d.lease_token]))[0].p,null);}finally{await db.exec("reset role;");}
});
test("le lien d'annulation fonctionne sans connexion et reste idempotent",async()=>{
  const [a]=await q("select unsubscribe_token from search_alerts limit 1");
  await db.exec("set role anon;");try{
    await assert.rejects(q("select * from search_alerts"));await assert.rejects(q("select * from sokile_claim_alert_deliveries()"));
    for(let i=0;i<2;i++)assert.equal((await q("select sokile_cancel_alert_by_token($1) as ok",[a.unsubscribe_token]))[0].ok,true);
    assert.equal((await q("select sokile_cancel_alert_by_token(gen_random_uuid()) as ok"))[0].ok,false);
  }finally{await db.exec("reset role;");}
});
test.after(async()=>{await db.close();});
