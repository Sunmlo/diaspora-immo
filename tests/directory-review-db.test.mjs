import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';

const {PGlite}=await import(process.env.SOKILE_PGLITE_PATH||'@electric-sql/pglite');
const db=new PGlite();
const owner='10000000-0000-4000-8000-000000000001',other='10000000-0000-4000-8000-000000000002',admin='10000000-0000-4000-8000-000000000003';
await db.exec(`create role anon;create role authenticated;create role service_role bypassrls;create schema auth;create table auth.users(id uuid primary key);insert into auth.users values('${owner}'),('${other}'),('${admin}');create function auth.role() returns text language sql stable as $$select current_user::text$$;create function auth.uid() returns uuid language sql stable as $$select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid$$;grant usage on schema auth to authenticated,anon;create function public.sokile_is_admin() returns boolean language sql stable as $$select auth.uid()='${admin}'::uuid$$;
create schema storage;create table storage.buckets(id text primary key,name text,public boolean,file_size_limit bigint,allowed_mime_types text[]);create table storage.objects(id uuid default gen_random_uuid(),bucket_id text,name text,created_at timestamptz default now());alter table storage.objects enable row level security;grant usage on schema storage to authenticated;grant select,insert,update,delete on storage.objects to authenticated;create function storage.foldername(text) returns text[] language sql as $$select string_to_array($1,'/')$$;
create table public.properties(id bigint generated always as identity primary key,owner_id uuid,country text,agency_name text default 'Company',advertiser_type text,status text default 'en_attente',title text,active boolean default false,expires_at timestamptz default now()+interval '1 year');
create table public.professionals(id bigint generated always as identity primary key,owner_id uuid,countries text[],business_name text default 'Company',specialty text,status text default 'en_attente',active boolean default false,created_at timestamptz default now(),updated_at timestamptz default now(),zones text,email text,phone text,website text,pricing text,description text,moderation_note text,verification_reference text,consent_at timestamptz);
create table public.development_programs(id uuid default gen_random_uuid() primary key,owner_id uuid,country text,publisher_kind text,developer_name text default 'Company',status text default 'en_attente',expires_at timestamptz default now()+interval '1 year');
create view public.public_properties as select id,title,advertiser_type,country from properties where status='validee' and active and expires_at>now();
create view public.public_professionals as select id,business_name,specialty,countries,zones,phone,website,pricing,description from professionals where status='validee' and active;
create view public.public_programs as select id,country from development_programs where status='validee' and expires_at>now();
grant select on public.public_properties,public.public_professionals,public.public_programs to anon,authenticated;grant select,insert,update on public.properties,public.professionals,public.development_programs to authenticated;grant usage on all sequences in schema public to authenticated;
`);
await db.exec(await readFile(new URL('../supabase-pro-verification-20261001.sql',import.meta.url),'utf8'));
await db.exec(await readFile(new URL('../supabase-pro-verification-rules-20261001.sql',import.meta.url),'utf8'));
await db.exec(await readFile(new URL('../supabase-pro-verification-maintenance-20261001.sql',import.meta.url),'utf8'));

const workflow=await readFile(new URL('../supabase-v34-annuaire-publicite.sql',import.meta.url),'utf8');
await db.exec(workflow.slice(workflow.indexOf('create or replace function public.sokile_request_workflow()'),workflow.indexOf('drop trigger if exists sokile_advertising_workflow')));
const response=await readFile(new URL('../supabase-v36-personalized-decisions.sql',import.meta.url),'utf8');
await db.exec(response.slice(response.indexOf('create or replace function public.sokile_require_moderation_response()'),response.indexOf('-- Le nom')));
await db.exec(`alter table public.professionals enable row level security;
create policy owner_read on professionals for select to authenticated using(owner_id=auth.uid() or sokile_is_admin());
create policy owner_insert on professionals for insert to authenticated with check(owner_id=auth.uid() or sokile_is_admin());
create policy owner_update on professionals for update to authenticated using(owner_id=auth.uid() or sokile_is_admin()) with check(owner_id=auth.uid() or sokile_is_admin());
create trigger zz_sokile_require_response before insert or update on public.professionals for each row execute function public.sokile_require_moderation_response();
grant usage on schema auth,storage to service_role;grant select on storage.objects to service_role;
insert into professionals(owner_id,specialty,countries)values('${owner}','Déménagement',array['Cameroun']);`);
await db.exec(await readFile(new URL('../supabase/migrations/20261002053819_proportional_directory.sql',import.meta.url),'utf8'));
const q=async(sql,args=[]) => (await db.query(sql,args)).rows;
async function as(id,fn){await db.exec(`set role ${id==='service_role'?'service_role':id?'authenticated':'anon'};select set_config('request.jwt.claim.sub','${id==='service_role'?'':id||''}',false);`);try{return await fn();}finally{await db.exec('reset role');}}
const path=`${owner}/20000000-0000-4000-8000-000000000001.jpg`;
const docs={registration:{path,name:'Photo.jpg'}};
const review={identity:true,content:true,title:'not_applicable',notes:'Photo lisible, nom et activité concordants. Services de déménagement sans titre ni acte réglementé revendiqué.'};
const approve=(id,checks=review)=>as(admin,()=>q("update professionals set status='validee',active=true,directory_review=$2,directory_valid_until=now()+interval '6 months' where id=$1 returning *",[id,checks]));
let record;
test('one directory submission covers multiple countries without per-country dossiers',async()=>{
 await as(owner,()=>q("insert into storage.objects(bucket_id,name)values('pro-verification-documents',$1)",[path]));
 [record]=await as(owner,()=>q(`insert into professionals(owner_id,business_name,specialty,countries,email,phone,description,consent_at,directory_documents,status,active,directory_review,directory_valid_until)
 values($1,'Company','Déménagement',array['Cameroun','Tchad'],'private@example.test','+237600000000','Services de déménagement',now(),$2,'validee',true,$3,now()+interval '6 months') returning *`,[owner,docs,review]));
 assert.equal(record.status,'en_attente');assert.equal(record.active,false);assert.equal(record.directory_review,null);
 assert.equal((await q('select count(*)::int n from pro_verifications'))[0].n,0);
 assert.equal((await as(null,()=>q('select * from public_professionals'))).length,0);
 await approve(record.id);
 const [visible]=await as(null,()=>q('select * from public_professionals'));assert.equal(visible.id,record.id);assert.equal(visible.professional_verified,true);
 assert.deepEqual(visible.countries,['Cameroun','Tchad']);
 for(const privateKey of ['owner_id','email','directory_documents','directory_review','verification_reference'])assert.ok(!(privateKey in visible));
});
test('owners and strangers cannot publish or access other accounts documents',async()=>{
 assert.equal((await as(other,()=>q('select * from professionals'))).length,0);
 assert.equal((await as(other,()=>q('update professionals set active=true returning id'))).length,0);
 await assert.rejects(as(null,()=>q('select * from professionals')));
 await assert.rejects(as(owner,()=>q('select * from sokile_private.directory_review_audit')));
 await assert.rejects(as(owner,()=>q('truncate professionals')));
 await as(owner,()=>q("update professionals set description='Nouvelle présentation',status='validee',active=true,directory_review=$2 where id=$1",[record.id,review]));
 assert.equal((await as(null,()=>q('select * from public_professionals'))).length,0);
 const foreign={registration:{path:`${other}/20000000-0000-4000-8000-000000000001.jpg`}};
 await assert.rejects(as(owner,()=>q('update professionals set directory_documents=$2 where id=$1',[record.id,foreign])));
 await assert.rejects(as(owner,()=>q('update professionals set directory_documents=$2 where id=$1',[record.id,{}])));
});
test('administrator review requires checks, a note, a valid deadline and regulated references',async()=>{
 await assert.rejects(approve(record.id,{}));
 await assert.rejects(as(admin,()=>q("update professionals set status='validee',active=true,directory_review=$2,directory_valid_until=now()+interval '2 years' where id=$1",[record.id,review])));
 await as(owner,()=>q("update professionals set specialty='Architecte' where id=$1",[record.id]));
 await assert.rejects(approve(record.id));
 await assert.rejects(approve(record.id,{...review,title:'checked'}));
 await as(owner,()=>q("update professionals set verification_reference='Ordre et références par pays' where id=$1",[record.id]));
 await approve(record.id,{...review,title:'checked',notes:'Registre officiel, deux pays, références et titulaire rapprochés. Contrôle de test.'});
 await assert.rejects(as(admin,()=>q("insert into properties(owner_id,country,advertiser_type,professional_activity,status,active)values($1,'Cameroun','pro','architecte','validee',true)",[owner])));
 await as(owner,()=>q("update professionals set specialty='Déménagement' where id=$1",[record.id]));
});
test('legacy applications can receive a personalized request, but cannot publish without proof',async()=>{
 await assert.rejects(approve(1));
 await assert.rejects(as(admin,()=>q("update professionals set status='modifications_demandees',moderation_note='' where id=1")));
 await as(admin,()=>q("update professionals set status='modifications_demandees',moderation_note='Merci de joindre une photo lisible de votre justificatif professionnel pour compléter votre fiche.' where id=1"));
});
test('retention preserves reused files and removes expired private evidence after twelve months',async()=>{
 await q("update storage.objects set created_at=now()-interval '60 days' where name=$1",[path]);
 await as(owner,()=>q('update professionals set directory_documents=$2 where id=$1',[record.id,docs]));
 await assert.rejects(as(owner,()=>q('select sokile_pro_retention(false)')));
 let [result]=await as('service_role',()=>q('select sokile_pro_retention(true) result'));assert.ok(!result.result.orphan_paths.includes(path));
 await approve(record.id);
 await db.exec('alter table professionals disable trigger all');
 await q("update professionals set directory_valid_until=now()-interval '13 months',updated_at=now()-interval '13 months' where id=$1",[record.id]);
 await db.exec('alter table professionals enable trigger all');
 assert.equal((await as(null,()=>q('select * from public_professionals'))).length,0);
 [result]=await as('service_role',()=>q('select sokile_pro_retention(false) result'));assert.equal(result.result.directory_dossiers,1);assert.ok(result.result.orphan_paths.includes(path));
 const [cleared]=await q('select * from professionals where id=$1',[record.id]);assert.deepEqual(cleared.directory_documents,{});assert.equal(cleared.directory_review,null);assert.equal(cleared.active,false);
 await assert.rejects(as(owner,()=>q('update professionals set directory_documents=$2 where id=$1',[record.id,docs])));
 const [audit]=await q('select count(*)::int n from sokile_private.directory_review_audit');assert.ok(audit.n>0);
 await db.close();
});
