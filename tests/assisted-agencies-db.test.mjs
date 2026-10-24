import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {PGlite} from '@electric-sql/pglite';
import {listingPrice} from '../src/assisted-listings.mjs';

test('prices preserve unknown periods and starting prices',()=>{
 assert.match(listingPrice({type:'Location',price:900000,details:{price_from:true}},'XOF'),/^À partir de .*FCFA \/ mois$/);
 assert.doesNotMatch(listingPrice({transaction:'location',details:{rent_period:'a_confirmer'}}),/mois|confirmer/);
 assert.doesNotMatch(listingPrice({type:'Vente',details:{rent_period:'a_confirmer'}}),/mois|confirmer/);
});

test('assisted publication and admin-only claim preserve listings without granting verification',async()=>{
 const db=new PGlite();const owner='10000000-0000-4000-8000-000000000001',other='10000000-0000-4000-8000-000000000002',admin='10000000-0000-4000-8000-000000000003';
 const q=async(s,a=[]) => (await db.query(s,a)).rows;
 async function as(id,fn){await db.exec(`set role ${id?'authenticated':'anon'};select set_config('request.jwt.claim.sub','${id||''}',false);select set_config('request.jwt.claim.role','${id?'authenticated':'anon'}',false)`);try{return await fn();}finally{await db.exec("reset role;select set_config('request.jwt.claim.role','service_role',false);select set_config('request.jwt.claim.sub','',false)");}}
 try{
 await db.exec(`create role anon;create role authenticated;create role service_role bypassrls;create schema auth;create schema sokile_private;grant usage on schema auth,sokile_private to authenticated,anon;
 create function auth.uid() returns uuid language sql stable as $$select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid$$;
 create function auth.role() returns text language sql stable as $$select current_setting('request.jwt.claim.role',true)$$;
 create function sokile_is_admin() returns boolean language sql stable as $$select coalesce(auth.uid()='${admin}'::uuid,false)$$;
 create table auth.users(id uuid primary key,email text,email_confirmed_at timestamptz,deleted_at timestamptz);
 insert into auth.users values('${owner}','owner@example.test',now(),null),('${other}','other@example.test',null,null),('${admin}','admin@example.test',now(),null);
 create table properties(id bigint generated always as identity primary key,owner_id uuid references auth.users,title text,type text,transaction text,nature text,details jsonb default '{}',country text,city text,neighborhood text,description text,price_eur integer,price bigint,surface integer,rooms integer,bathrooms integer,tags text[],advertiser_type text default 'particulier',agency_name text,agent_name text,photos text[],user_phone text,user_name text,user_email text,created_at timestamptz default now(),verified boolean default false,publication_started_at timestamptz default now(),expires_at timestamptz default now()+interval '6 months',video_path text,status text default 'en_attente',active boolean default false,professional_activity text,evidence_revision bigint default 0);
 alter table properties enable row level security;create policy owner_access on properties to authenticated using(owner_id=auth.uid() or sokile_is_admin()) with check(owner_id=auth.uid() or sokile_is_admin());grant select,insert,update,delete on properties to authenticated;grant usage on all sequences in schema public to authenticated;
 create table pro_verification_rules(country text,activity text,rule_version integer);
 create table pro_verifications(owner_id uuid,country text,activity text,rule_version integer,status text,valid_until timestamptz,business_name text);
 create table individual_verifications(property_id bigint,owner_id uuid,revision bigint,status text,valid_until timestamptz);
 grant select on pro_verifications,pro_verification_rules to authenticated;
 create function sokile_private.pro_verified(uuid,text,text) returns boolean language sql as $$select exists(select 1 from public.pro_verifications p join public.pro_verification_rules r using(country,activity,rule_version) where p.owner_id=$1 and p.country=$2 and p.activity=$3 and p.status='verified' and p.valid_until>now())$$;
 create function existing_workflow() returns trigger language plpgsql set search_path=public as $$begin if auth.role()='authenticated' and not sokile_is_admin() then if tg_op='INSERT' then new.owner_id:=auth.uid();else new.owner_id:=old.owner_id;end if;new.status:='en_attente';new.active:=false;new.verified:=false;elsif auth.role()='authenticated' and sokile_is_admin() then if new.status='validee' then new.active:=true;end if;end if;return new;end$$;
 create trigger sokile_property_workflow before insert or update on properties for each row execute function existing_workflow();`);
 const legacy=await readFile(new URL('../supabase-pro-verification-20261001.sql',import.meta.url),'utf8');
 await db.exec(legacy.slice(legacy.indexOf('create or replace function sokile_private.require_professional_verification()'),legacy.indexOf('create trigger zzzz_professional_verification before insert or update on public.professionals')));
 await db.exec(await readFile(new URL('../supabase/migrations/20261024134158_assisted_agency_publication.sql',import.meta.url),'utf8'));
 await assert.rejects(q("insert into assisted_agencies(slug,business_name,country,publication_enabled,consent_at) values('invalid','Invalid','Sénégal',true,now())"),/assisted_consent_required/);
 const [a]=await as(admin,()=>q("insert into assisted_agencies(slug,business_name,country,publication_enabled,consent_at,consent_note) values('agency','Agency','Sénégal',true,now(),'Agency expressly authorized publication via its usual contact.') returning *"));
 await assert.rejects(as(owner,()=>q("insert into assisted_agencies(slug,business_name,country) values('fake','Fake','Sénégal')")));
 await assert.rejects(as(null,()=>q('select * from assisted_agencies')));
 assert.equal((await as(null,()=>q('select * from public_assisted_agencies')))[0].claim_email,undefined);
 await assert.rejects(as(owner,()=>q("insert into properties(assisted_agency_id,advertiser_type,agency_name,country) values($1,'pro','Agency','Sénégal')",[a.id])),/réservé/);
 await assert.rejects(q("insert into properties(assisted_agency_id,advertiser_type,agency_name,country,status,active) values($1,'pro','Wrong','Sénégal','validee',true)",[a.id]),/correspondre/);
 await assert.rejects(q("insert into properties(advertiser_type,agency_name,country,status) values('pro','Other','Sénégal','validee')"),/nom légal/);
 const [p]=await q("insert into properties(assisted_agency_id,title,advertiser_type,agency_name,country,status,active,details) values($1,'Listing','pro','Agency','Sénégal','validee',true,'{\"import_reference\":\"one\"}') returning *",[a.id]);
 assert.equal((await as(null,()=>q('select * from public_properties')))[0].professional_verified,false);
 await assert.rejects(q("insert into properties(assisted_agency_id,advertiser_type,agency_name,country,details) values($1,'pro','Agency','Sénégal','{\"import_reference\":\"one\"}')",[a.id]),/duplicate key/);
 const evidence='Confirmed the professional account email with the agency via our existing conversation.';
 await assert.rejects(as(null,()=>q('select assign_assisted_agency($1,$2,$3)',[a.id,'owner@example.test',evidence])));
 await assert.rejects(as(owner,()=>q('select assign_assisted_agency($1,$2,$3)',[a.id,'owner@example.test',evidence])),/réservé/);
 await assert.rejects(as(admin,()=>q('select assign_assisted_agency($1,$2,$3)',[a.id,'other@example.test',evidence])),/non confirmée/);
 await assert.rejects(as(admin,()=>q('select assign_assisted_agency($1,$2,$3)',[a.id,'owner@example.test','short'])),/30/);
 assert.equal((await as(admin,()=>q('select assign_assisted_agency($1,$2,$3) n',[a.id,' OWNER@example.test ',evidence])))[0].n,1);
 const [claimed]=await as(owner,()=>q('select * from properties'));
 assert.equal(claimed.id,p.id);assert.equal(claimed.owner_id,owner);assert.equal(claimed.status,'validee');assert.equal(claimed.expires_at.toISOString(),p.expires_at.toISOString());assert.equal(claimed.publication_started_at.toISOString(),p.publication_started_at.toISOString());
 assert.equal((await as(other,()=>q('select * from properties'))).length,0);
 assert.equal((await as(null,()=>q('select * from public_properties')))[0].professional_verified,false);
 assert.equal((await as(admin,()=>q('select assign_assisted_agency($1,$2,$3) n',[a.id,'owner@example.test',evidence])))[0].n,1);
 await q('update auth.users set email_confirmed_at=now() where id=$1',[other]);
 await assert.rejects(as(admin,()=>q('select assign_assisted_agency($1,$2,$3)',[a.id,'other@example.test',evidence])),/déjà un titulaire/);
 await assert.rejects(as(owner,()=>q('update properties set assisted_agency_id=null where id=$1',[p.id])),/réservé/);
 await as(admin,()=>q('update assisted_agencies set publication_enabled=false where id=$1',[a.id]));assert.equal((await as(null,()=>q('select * from public_properties'))).length,0);
 await as(admin,()=>q('update assisted_agencies set publication_enabled=true where id=$1',[a.id]));
 await as(owner,()=>q("update properties set title='Edited' where id=$1",[p.id]));assert.equal((await as(null,()=>q('select * from public_properties'))).length,0);
 await as(admin,()=>q("update properties set status='validee' where id=$1",[p.id]));assert.equal((await as(null,()=>q('select * from public_properties'))).length,1);
 await q("insert into pro_verification_rules values('Sénégal','agence',1)");await q("insert into pro_verifications values($1,'Sénégal','agence',1,'verified',now()+interval '1 month','Agency')",[owner]);
 assert.equal((await as(null,()=>q('select * from public_properties')))[0].professional_verified,true);
 await q("update pro_verifications set valid_until=now()-interval '1 day'");assert.equal((await as(null,()=>q('select * from public_properties')))[0].professional_verified,false);
 const [individual]=await q("insert into properties(owner_id,country,title,status,active) values($1,'Sénégal','Individual','validee',true) returning id",[owner]);
 assert.equal((await as(null,()=>q('select * from public_properties'))).length,1);
 await q("insert into individual_verifications values($1,$2,0,'verified',now()+interval '1 month')",[individual.id,owner]);assert.equal((await as(null,()=>q('select * from public_properties'))).length,2);
 await q('update properties set evidence_revision=1 where id=$1',[individual.id]);assert.equal((await as(null,()=>q('select * from public_properties'))).length,1);
 }finally{await db.close();}
});
