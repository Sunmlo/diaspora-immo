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

await db.exec(`create schema sokile_private;
create table public.pro_verification_rules(country text,activity text,rule_version text);
create table public.pro_verifications(owner_id uuid,country text,activity text,rule_version text,status text,valid_until timestamptz);
create function sokile_private.pro_verified(p_owner uuid,p_country text,p_activity text) returns boolean language sql stable set search_path='' as $$
select exists(select 1 from public.pro_verifications v join public.pro_verification_rules r on r.country=v.country and r.activity=v.activity and r.rule_version=v.rule_version where v.owner_id=p_owner and v.country=p_country and v.activity=p_activity and v.status='verified' and v.valid_until>now());$$;
insert into pro_verification_rules values('Cameroun','agence','current');
insert into pro_verifications values('${other}','Cameroun','agence','current','verified',now()+interval '1 year');`);
const sharedMigration=await readFile(new URL('../supabase/migrations/20261002132751_shared_search_requests.sql',import.meta.url),'utf8');
// An existing alert must remain private after the upgrade.
const [legacy]=await asOwner(owner,()=>q('select * from sokile_create_alert($1)',[{country:'Cameroun'}]));
await db.exec(sharedMigration);
const filters={country:'Cameroun',city:'Douala',transaction:'location',nature:'appartement',priceMax:500,rooms:'2'};
const create=(f=filters,share=true)=>asOwner(owner,()=>q('select * from sokile_create_search_request($1,$2)',[f,share]));
const feed=()=>asOwner(other,()=>q('select * from sokile_list_search_requests()'));
let request,property;
test('existing alerts and unchecked requests remain private; sharing is explicit and idempotent',async()=>{
 assert.equal((await q('select shared_with_pros from search_alerts where id=$1',[legacy.id]))[0].shared_with_pros,false);
 [request]=await create(filters,false);assert.equal(request.shared_with_pros,false);assert.equal(request.sharing_consented_at,null);assert.deepEqual(await feed(),[]);
 const [shared]=await create();assert.equal(shared.id,request.id);assert.ok(shared.sharing_consented_at);assert.equal(shared.sharing_version,1);
 const [again]=await create();assert.deepEqual(again.sharing_consented_at,shared.sharing_consented_at);assert.deepEqual(again.expires_at,request.expires_at);
 const rows=await feed();assert.equal(rows.length,1);assert.deepEqual(Object.keys(rows[0]).sort(),['id','filters','created_at','expires_at','proposed_property_ids'].sort());
 assert.deepEqual((await asOwner(other,()=>q('select * from search_alerts'))),[]);
 await assert.rejects(asOwner(other,()=>q('update search_alerts set shared_with_pros=true')));
 await db.exec('set role anon');try{await assert.rejects(q('select * from sokile_list_search_requests()'));await assert.rejects(q('select * from sokile_create_search_request($1,true)',[filters]));}finally{await db.exec('reset role')}
});
test('only currently verified agencies in the matching country can read requests',async()=>{
 for(const patch of ["status='en_attente'","country='Sénégal'","valid_until=now()-interval '1 second'","rule_version='obsolete'","activity='notaire'"]){
  await db.exec(`update pro_verifications set ${patch}`);assert.deepEqual(await feed(),[]);
  await db.exec("update pro_verifications set status='verified',country='Cameroun',valid_until=now()+interval '1 year',rule_version='current',activity='agence'");
 }
 assert.equal((await feed()).length,1);
});
test('shared criteria reject contacts, unsupported fields, invalid budgets and unconfirmed accounts',async()=>{
 for(const f of [{...filters,email:'private@example.com'},{...filters,search:'call me'},{...filters,city:'private@example.com'},{...filters,city:'+237 60000000'},{...filters,priceMax:0},{...filters,rooms:'7'},{...filters,country:'France'}])await assert.rejects(create(f));
 await q('update auth.users set email_confirmed_at=null where id=$1',[owner]);await assert.rejects(create());await q('update auth.users set email_confirmed_at=now() where id=$1',[owner]);
});
test('responses require an owned visible listing that matches city and all criteria',async()=>{
 [property]=await q("insert into properties(owner_id,title,country,city,nature,status,active,transaction,price_eur,rooms) values($1,'Fixture','Cameroun','Douala','appartement','validee',true,'location',450,3) returning id",[other]);
 await q('delete from search_alert_deliveries where alert_id=$1',[request.id]);
 const propose=()=>asOwner(other,()=>q('select sokile_propose_search_property($1,$2) as ok',[request.id,property.id]));
 for(const patch of ["owner_id='"+owner+"'","city='Yaoundé'","price_eur=800","rooms=1","active=false","status='en_attente'"]){
  await db.exec(`update properties set ${patch} where id=${property.id}`);await assert.rejects(propose());
  await q("update properties set owner_id=$1,city='Douala',price_eur=450,rooms=3,active=true,status='validee' where id=$2",[other,property.id]);
 }
 // The publication trigger may have queued a notification during the fixture resets.
 await q('delete from search_alert_deliveries where alert_id=$1',[request.id]);
 for(let i=0;i<2;i++)assert.equal((await propose())[0].ok,true);
 assert.equal((await q('select * from search_alert_deliveries where alert_id=$1 and property_id=$2',[request.id,property.id])).length,1);
 assert.deepEqual((await feed())[0].proposed_property_ids,[property.id]);
 await asOwner(owner,async()=>{await assert.rejects(q('select sokile_propose_search_property($1,$2)',[request.id,property.id]));});
 // Even a validated active row must be present in the curated public view.
 await db.exec('create or replace view public.public_properties as select id,title,type,transaction,nature,country,city,price_eur,surface,rooms,tags,created_at,publication_started_at,expires_at from properties where false');await assert.rejects(propose());
});
test('withdrawal is owner-only and keeps private alerts; cancellation and expiry hide requests',async()=>{
 assert.equal((await asOwner(other,()=>q('select sokile_withdraw_search_sharing($1) ok',[request.id])))[0].ok,false);
 assert.equal((await asOwner(owner,()=>q('select sokile_withdraw_search_sharing($1) ok',[request.id])))[0].ok,true);assert.deepEqual(await feed(),[]);
 const [row]=await q('select * from search_alerts where id=$1',[request.id]);assert.equal(row.cancelled_at,null);assert.ok(row.sharing_revoked_at);
 await create();assert.equal((await feed()).length,1);
 await create(filters,false);assert.deepEqual(await feed(),[]);
 await create();await q("update search_alerts set expires_at=now()-interval '1 second' where id=$1",[request.id]);assert.deepEqual(await feed(),[]);
 const [fresh]=await create();await asOwner(owner,()=>q('select sokile_cancel_alert($1)',[fresh.id]));assert.deepEqual(await feed(),[]);
});
test.after(async()=>{await db.close()});
