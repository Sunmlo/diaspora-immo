import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {ruleFor} from '../src/pro-regulations.mjs';
const {PGlite}=await import(process.env.SOKILE_PGLITE_PATH||'@electric-sql/pglite');
const db=new PGlite();
const owner='10000000-0000-4000-8000-000000000001',other='10000000-0000-4000-8000-000000000002',admin='10000000-0000-4000-8000-000000000003';
await db.exec(`create role anon;create role authenticated;create role service_role bypassrls;create schema auth;create table auth.users(id uuid primary key);insert into auth.users values('${owner}'),('${other}'),('${admin}');create function auth.uid() returns uuid language sql stable as $$select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid$$;grant usage on schema auth to authenticated,anon;create function public.sokile_is_admin() returns boolean language sql stable as $$select auth.uid()='${admin}'::uuid$$;
create schema storage;create table storage.buckets(id text primary key,name text,public boolean,file_size_limit bigint,allowed_mime_types text[]);create table storage.objects(id uuid default gen_random_uuid(),bucket_id text,name text,created_at timestamptz default now());alter table storage.objects enable row level security;grant usage on schema storage to authenticated;grant select,insert,update,delete on storage.objects to authenticated;create function storage.foldername(text) returns text[] language sql as $$select string_to_array($1,'/')$$;
create table public.properties(id bigint generated always as identity primary key,owner_id uuid,country text,agency_name text default 'Company',advertiser_type text,status text default 'en_attente',title text,active boolean default false,expires_at timestamptz default now()+interval '1 year');
create table public.professionals(id bigint generated always as identity primary key,owner_id uuid,countries text[],business_name text default 'Company',specialty text,status text default 'en_attente',active boolean default false);
create table public.development_programs(id uuid default gen_random_uuid() primary key,owner_id uuid,country text,publisher_kind text,developer_name text default 'Company',status text default 'en_attente',expires_at timestamptz default now()+interval '1 year');
create view public.public_properties as select id,title,advertiser_type,country from properties where status='validee' and active and expires_at>now();
create view public.public_professionals as select id,specialty,countries from professionals where status='validee' and active;
create view public.public_programs as select id,country from development_programs where status='validee' and expires_at>now();
grant select on public.public_properties,public.public_professionals,public.public_programs to anon,authenticated;grant select,insert,update on public.properties,public.professionals,public.development_programs to authenticated;grant usage on all sequences in schema public to authenticated;
`);
await db.exec(await readFile(new URL('../supabase-pro-verification-20261001.sql',import.meta.url),'utf8'));
await db.exec(await readFile(new URL('../supabase-pro-verification-rules-20261001.sql',import.meta.url),'utf8'));
await db.exec(await readFile(new URL('../supabase-pro-verification-maintenance-20261001.sql',import.meta.url),'utf8'));
const q=async(sql,args=[]) => (await db.query(sql,args)).rows;
async function as(id,fn){await db.exec(`set role ${id?'authenticated':'anon'};select set_config('request.jwt.claim.sub','${id||''}',false);`);try{return await fn();}finally{await db.exec('reset role');}}
const documents=async(country='Cameroun',activity='promoteur',uid=owner)=>{
 const docs={};let n=0;for(const d of ruleFor(country,activity).docs){const path=`${uid}/20000000-0000-4000-8000-${(++n).toString().padStart(12,'0')}.pdf`;if(!(await q('select 1 from storage.objects where name=$1',[path])).length)await q("insert into storage.objects(bucket_id,name)values('pro-verification-documents',$1)",[path]);docs[d.code]={path,reference:'REF-1',issuer:'Official ministry',no_expiry:true};}return docs;
};
const create=async(country='Cameroun',activity='promoteur',uid=owner)=>{const docs=await documents(country,activity,uid);return (await as(uid,()=>q(`insert into public.pro_verifications(owner_id,country,activity,rule_version,business_name,representative_name,registration_number,documents,consent_at)values($1,$2,$3,'2026-10-01','Company','Name','REG',$4,now()) returning *`,[uid,country,activity,docs])))[0];};
const approve=(id,until=new Date(Date.now()+90*86400000).toISOString().slice(0,10))=>as(admin,()=>q("select sokile_review_verification($1,'verified',$2,'',$3,$4)",[id,'Official ministry register checked: reference and holder match. Authority confirmed scope and current validity.',until,{identity:true,documents:true,regime:true}]));
let record;
test('private dossiers cannot be read, altered or self-approved by another account',async()=>{
 record=await create();assert.equal(record.status,'en_attente');
 assert.equal((await as(other,()=>q('select * from pro_verifications'))).length,0);
 await assert.rejects(as(null,()=>q('select * from pro_verifications')));
 assert.equal((await as(other,()=>q("update pro_verifications set business_name='Intrusion' returning id"))).length,0);
 await assert.rejects(as(owner,()=>q("update pro_verifications set owner_id=$1 where id=$2",[other,record.id])));
 await assert.rejects(as(owner,()=>q("select sokile_review_verification($1,'verified','anything','',current_date+30,'{}')",[record.id])));
 await as(owner,()=>q("update pro_verifications set status='verified',valid_until=now()+interval '1 year' where id=$1",[record.id]));
 assert.equal((await q('select status from pro_verifications where id=$1',[record.id]))[0].status,'en_attente');
});
test('missing, foreign, expired files and stale rules are rejected server-side',async()=>{
 await assert.rejects(as(owner,()=>q('update pro_verifications set documents=$1 where id=$2',[{},record.id])));
 const docs=await documents();docs.approval.path=`${other}/20000000-0000-4000-8000-000000000001.pdf`;
 await assert.rejects(as(owner,()=>q('update pro_verifications set documents=$1 where id=$2',[docs,record.id])));
 const expired=await documents();expired.approval={...expired.approval,no_expiry:false,expires_on:'2020-01-01'};
 await assert.rejects(as(owner,()=>q('update pro_verifications set documents=$1 where id=$2',[expired,record.id])));
 await assert.rejects(as(owner,()=>q("update pro_verifications set rule_version='old' where id=$1",[record.id])));
});
test('private storage isolates accounts and forbids replacement of reviewed files',async()=>{
 const files=await as(owner,()=>q("select * from storage.objects where bucket_id='pro-verification-documents'"));assert.ok(files.length);
 assert.equal((await as(other,()=>q('select * from storage.objects'))).length,0);
 assert.equal((await as(owner,()=>q("update storage.objects set name='replaced' returning name"))).length,0);
 assert.equal((await as(owner,()=>q('delete from storage.objects returning name'))).length,0);
 await assert.rejects(as(owner,()=>q("insert into storage.objects(bucket_id,name)values('pro-verification-documents',$1)",[`${other}/20000000-0000-4000-8000-000000000008.pdf`])));
});
let property,program;
test('pending creation remains possible but all publication channels require approval',async()=>{
 property=(await as(owner,()=>q("insert into properties(owner_id,country,advertiser_type,professional_activity,title)values($1,'Cameroun','pro','promoteur','Test') returning id",[owner])))[0].id;
 program=(await as(owner,()=>q("insert into development_programs(owner_id,country,publisher_kind)values($1,'Cameroun','promoteur') returning id",[owner])))[0].id;
 await assert.rejects(as(admin,()=>q("update properties set status='validee',active=true where id=$1",[property])));
 await assert.rejects(as(admin,()=>q("update development_programs set status='validee' where id=$1",[program])));
 await assert.rejects(as(admin,()=>q("insert into professionals(owner_id,countries,specialty,status,active)values($1,array['Cameroun'],'Promoteur immobilier','validee',true)",[owner])));
 await assert.rejects(as(admin,()=>q("select sokile_review_verification($1,'verified','Incomplete','',current_date+30,'{}')",[record.id])));
 await approve(record.id);
 await as(admin,()=>q("update properties set status='validee',active=true where id=$1",[property]));
 await as(admin,()=>q("update development_programs set status='validee' where id=$1",[program]));
 assert.equal((await as(null,()=>q('select * from public_properties')))[0].professional_verified,true);
 assert.equal((await as(null,()=>q('select * from public_programs'))).length,1);
 await assert.rejects(as(admin,()=>q("update properties set country='Tchad' where id=$1",[property])));
 await assert.rejects(as(admin,()=>q("update properties set professional_activity='agence' where id=$1",[property])));
});
test('directory requires approval for every country, and unknown regimes require an administrator’s documented regime review',async()=>{
 await assert.rejects(as(admin,()=>q("insert into professionals(owner_id,countries,specialty,status,active)values($1,array['Cameroun','Tchad'],'Promoteur immobilier','validee',true)",[owner])));
 const r=await create('Tchad');await approve(r.id);
 await as(admin,()=>q("insert into professionals(owner_id,countries,specialty,status,active)values($1,array['Cameroun','Tchad'],'Promoteur immobilier','validee',true)",[owner]));
 assert.equal((await as(null,()=>q('select * from public_professionals'))).length,1);
});
test('suspension hides previously approved listings, programs and directory instantly',async()=>{
 await as(admin,()=>q("select sokile_review_verification($1,'suspended','',$2,null,'{}')",[record.id,'Votre autorisation est suspendue. Merci de fournir un justificatif actualisé.']));
 assert.equal((await as(null,()=>q('select * from public_properties'))).length,0);
 assert.equal((await as(null,()=>q('select * from public_programs'))).length,0);
 assert.equal((await as(null,()=>q('select * from public_professionals'))).length,0);
 await approve(record.id);
});
test('expiration dynamically hides publications; owners changing documents lose their badge',async()=>{
 await db.exec(`alter table pro_verifications disable trigger guard_pro_verification;alter table pro_verifications disable trigger audit_pro_verification;`);
 await q("update pro_verifications set valid_until=now()-interval '1 second' where id=$1",[record.id]);
 await db.exec('alter table pro_verifications enable trigger guard_pro_verification;alter table pro_verifications enable trigger audit_pro_verification;');
 assert.equal((await as(null,()=>q('select * from public_properties'))).length,0);
 await approve(record.id);
 await as(owner,()=>q("update pro_verifications set registration_number='REG-updated' where id=$1",[record.id]));
 assert.equal((await as(null,()=>q('select * from public_properties'))).length,0);
 assert.equal((await q('select status,verified_at from pro_verifications where id=$1',[record.id]))[0].verified_at,null);
});
test('individual owners remain publishable and public projections disclose no private dossier',async()=>{
 await as(admin,()=>q("insert into properties(owner_id,country,advertiser_type,status,active,title,agency_name)values($1,'Tchad','particulier','validee',true,'Private owner',null)",[other]));
 const [p]=await as(null,()=>q('select * from public_properties'));assert.equal(p.professional_verified,false);
 for(const name of ['owner_id','documents','review_evidence','registration_number'])assert.ok(!Object.keys(p).includes(name));
 const audit=await q('select count(*)::int n from sokile_private.pro_verification_audit');assert.ok(audit[0].n>0);
 await assert.rejects(as(owner,()=>q('delete from sokile_private.pro_verification_audit')));

});
test('retention denies users, preserves active evidence, and selects only old orphan files',async()=>{
 await assert.rejects(as(owner,()=>q('select sokile_pro_retention(false)')));
 const oldPath=`${owner}/20000000-0000-4000-8000-000000000099.pdf`;
 await q("insert into storage.objects(bucket_id,name,created_at)values('pro-verification-documents',$1,now()-interval '31 days')",[oldPath]);
 const [dry]=await q('select sokile_pro_retention(true) result');assert.deepEqual(dry.result.orphan_paths,[oldPath]);
 const docs=await documents();docs.approval.path=oldPath;
 await assert.rejects(as(owner,()=>q('update pro_verifications set documents=$1 where id=$2',[docs,record.id])));
 const active=await q('select count(*)::int n from pro_verifications');
 await q('select sokile_pro_retention(false)');
 assert.equal((await q('select count(*)::int n from pro_verifications'))[0].n,active[0].n);
 await db.close();
});
