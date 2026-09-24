import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
const {PGlite}=await import(process.env.SOKILE_PGLITE_PATH||'@electric-sql/pglite');
const db=new PGlite();
const particular='10000000-0000-4000-8000-000000000004';
const owner='10000000-0000-4000-8000-000000000001',other='10000000-0000-4000-8000-000000000002',admin='10000000-0000-4000-8000-000000000003';
await db.exec(`create role anon;create role authenticated;create role service_role bypassrls;create schema auth;create table auth.users(id uuid primary key,email text,email_confirmed_at timestamptz,raw_user_meta_data jsonb default '{}');create function auth.uid() returns uuid language sql stable as $$select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid$$;grant usage on schema auth to authenticated,anon,service_role;create function public.sokile_is_admin() returns boolean language sql stable as $$select auth.uid()='${admin}'::uuid$$;create function public.sokile_search_text(v text) returns text language sql immutable as $$select lower(v)$$;insert into auth.users(id,email,email_confirmed_at) values('${owner}','owner@example.test',now()),('${other}','other@example.test',now()),('${admin}','admin@example.test',now());`);
await db.exec(`update auth.users set raw_user_meta_data='{"account_type":"pro"}';insert into auth.users(id,email,email_confirmed_at,raw_user_meta_data) values('${particular}','particular@example.test',now(),'{"account_type":"particulier"}');`);
const migration=await readFile(new URL('../supabase-v38-programmes-neufs.sql',import.meta.url),'utf8');
await db.exec(migration);await db.exec(await readFile(new URL('../supabase-v39-program-professional-access.sql',import.meta.url),'utf8'));
const q=async(s,p=[])=>(await db.query(s,p)).rows;
async function as(id,fn){await db.exec(`set role ${id?'authenticated':'anon'};select set_config('request.jwt.claim.sub','${id||''}',false);`);try{return await fn();}finally{await db.exec('reset role');}}
const program={title:'Résidence de test',developer_name:'Promoteur Test',publisher_kind:'promoteur',country:'Sénégal',city:'Dakar',neighborhood:'Almadies',description:'Présentation de test de la résidence : logements avec terrasse, parking, espaces partagés et services de proximité.',stage:'construction',delivery_quarter:4,delivery_year:2027,gallery:[{url:'https://example.test/photo.jpg',kind:'perspective'}],phone:'+221771234567'};
const unit=(reference='A1',rooms=2,price_fcfa=45000000)=>({reference,nature:'appartement',rooms,surface:55,price_fcfa,availability:'disponible'});
const create=async(p=program,units=[unit()])=>(await as(owner,()=>q('select sokile_save_program(null,$1,$2) as id',[p,units])))[0].id;
const approve=async id=>as(admin,()=>q("select sokile_moderate_program($1,'validee','')",[id]));

test('programme : migration réexécutable et dépôt atomique privé',async()=>{
 await db.exec(migration);await db.exec(await readFile(new URL('../supabase-v39-program-professional-access.sql',import.meta.url),'utf8'));const id=await create();const [p]=await q('select * from development_programs where id=$1',[id]);assert.equal(p.owner_id,owner);assert.equal(p.email,'owner@example.test');assert.equal(p.status,'en_attente');assert.equal(p.expires_at,null);
 assert.equal((await as(null,()=>q('select * from public_programs where id=$1',[id]))).length,0);
 await assert.rejects(as(null,()=>q('select * from development_programs')));
 const before=(await q('select count(*) from development_programs'))[0].count;
 await assert.rejects(create(program,[unit('A1'),unit('A1')]));assert.equal((await q('select count(*) from development_programs'))[0].count,before);
});
test('seuls les professionnels déposent ; les administrateurs restent modérateurs',async()=>{
 for(const id of [null,particular,admin])await assert.rejects(as(id,()=>q('select sokile_save_program(null,$1,$2)',[program,[unit()]])));
 const id=await create();
 for(const account of [particular,admin,other]){
  await assert.rejects(as(account,()=>q('select sokile_save_program($1,$2,$3)',[id,program,[unit()]])));
  await assert.rejects(as(account,()=>q('select sokile_program_inventory($1,$2,true)',[id,[]])));
 }
 await approve(id);
 const [{id:inquiry}]=await as(null,()=>q('select sokile_program_inquiry($1,null,$2,$3,$4,$5,true) as id',[id,'Client Test','roles@example.test','','Merci de me transmettre les disponibilités.']));
 for(const account of [particular,admin,other])await assert.rejects(as(account,()=>q('select sokile_program_inquiry_done($1)',[inquiry])));
 await as(owner,()=>q('select sokile_program_inquiry_done($1)',[inquiry]));
 assert.equal((await q('select status from program_inquiries where id=$1',[inquiry]))[0].status,'traitee');
});
test('un ancien propriétaire devenu particulier ne peut plus gérer son programme',async()=>{
 const id=await create();
 await q("update auth.users set raw_user_meta_data='{}' where id=$1",[owner]);
 try{
  await assert.rejects(as(owner,()=>q('select sokile_save_program($1,$2,$3)',[id,program,[unit()]])));
  await assert.rejects(as(owner,()=>q('select sokile_program_inventory($1,$2)',[id,[]])));
 }finally{await q('update auth.users set raw_user_meta_data=$1 where id=$2',[{account_type:'pro'},owner]);}
});
test('un promoteur ne peut publier ni modifier un autre programme',async()=>{
 const id=await create();await assert.rejects(as(owner,()=>q("update development_programs set status='validee' where id=$1",[id])));
 await assert.rejects(as(owner,()=>q("select sokile_moderate_program($1,'validee','')",[id])));
 await assert.rejects(as(other,()=>q('select sokile_save_program($1,$2,$3)',[id,program,[unit()]])));
 assert.equal((await as(other,()=>q('select * from development_programs where id=$1',[id]))).length,0);
 assert.equal((await as(other,()=>q('select * from program_units where program_id=$1',[id]))).length,0);
});
test('refus et corrections exigent une réponse personnalisée',async()=>{
 const id=await create();for(const status of ['refusee','modifications_demandees']){
 await assert.rejects(as(admin,()=>q('select sokile_moderate_program($1,$2,$3)',[id,status,'Non'])));
 await as(admin,()=>q('select sokile_moderate_program($1,$2,$3)',[id,status,'Merci de préciser la livraison et de joindre une présentation exacte du promoteur.']));
 assert.equal((await q('select status from development_programs where id=$1',[id]))[0].status,status);
 }
});
test('publication un an, disponibilités sans prolongation et masquage après vente',async()=>{
 const id=await create();await approve(id);const [p]=await q("select *,expires_at=publication_started_at+interval '1 year' as duration from development_programs where id=$1",[id]);assert.equal(p.duration,true);
 const [u]=await q('select * from program_units where program_id=$1',[id]);
 await as(owner,()=>q('select sokile_program_inventory($1,$2)',[id,[{id:u.id,availability:'reserve'}]]));
 assert.deepEqual((await q('select expires_at from development_programs where id=$1',[id]))[0].expires_at,p.expires_at);
 assert.equal((await as(null,()=>q('select * from public_programs where id=$1',[id]))).length,1);
 await as(owner,()=>q('select sokile_program_inventory($1,$2)',[id,[{id:u.id,availability:'vendu'}]]));
 assert.equal((await as(null,()=>q('select * from public_programs where id=$1',[id]))).length,0);
 assert.equal((await as(null,()=>q('select * from public_program_units where program_id=$1',[id]))).length,0);
});
test('une modification repasse en validation ; unités étrangères inaccessibles',async()=>{
 const id=await create();await approve(id);const foreign=await create();const [u]=await q('select * from program_units where program_id=$1',[foreign]);
 await assert.rejects(as(owner,()=>q('select sokile_save_program($1,$2,$3)',[id,program,[{...unit(),id:u.id}]])));
 await as(owner,()=>q('select sokile_save_program($1,$2,$3)',[id,{...program,title:'Résidence actualisée'},[unit()]]));
 assert.equal((await q('select status from development_programs where id=$1',[id]))[0].status,'en_attente');
 assert.equal((await q('select * from public_programs where id=$1',[id])).length,0);
});
test('recherche : le budget et les pièces doivent correspondre au même logement',async()=>{
 const id=await create({...program,title:'Recherche ciblée'},[unit('A',2,45000000),unit('B',4,90000000)]);await approve(id);
 assert.equal((await as(null,()=>q("select * from sokile_search_programs('Sénégal','Recherche ciblée','',4,50000000,0)"))).length,0);
 assert.equal((await as(null,()=>q("select * from sokile_search_programs('Sénégal','Recherche ciblée','',4,100000000,0)"))).length,1);
 await q("update development_programs set expires_at=now()-interval '1 second' where id=$1",[id]);
 assert.equal((await as(null,()=>q('select * from public_programs where id=$1',[id]))).length,0);
});
test('contact : publication, consentement, logement et anti-doublon contrôlés',async()=>{
 const id=await create();const [u]=await q('select * from program_units where program_id=$1',[id]);
 const contact=(consent=true,uid=u.id)=>as(null,()=>q('select sokile_program_inquiry($1,$2,$3,$4,$5,$6,$7) as id',[id,uid,'Client Test','client@example.test','','Merci de me transmettre des informations.',consent]));
 await assert.rejects(contact());await approve(id);await assert.rejects(contact(false));
 const foreign=await create();const [v]=await q('select * from program_units where program_id=$1',[foreign]);await assert.rejects(contact(true,v.id));
 const [inquiry]=await contact();await assert.rejects(contact());
 assert.equal((await as(owner,()=>q('select * from program_inquiries where id=$1',[inquiry.id]))).length,1);
 assert.equal((await as(other,()=>q('select * from program_inquiries where id=$1',[inquiry.id]))).length,0);
 await assert.rejects(as(null,()=>q('select * from program_inquiries')));
 await assert.rejects(as(other,()=>q('select sokile_program_inquiry_done($1)',[inquiry.id])));
 await as(owner,()=>q('select sokile_program_inquiry_done($1)',[inquiry.id]));
 assert.equal((await q('select recipient_email,status from program_inquiries where id=$1',[inquiry.id]))[0].status,'traitee');
});
test('liens dangereux, photo absente et retrait de programme',async()=>{
 await assert.rejects(create({...program,brochure_url:'javascript:alert(1)'}));
 const id=await create({...program,gallery:[]});await assert.rejects(approve(id));
 const otherId=await create();await approve(otherId);await as(owner,()=>q('select sokile_program_inventory($1,$2,true)',[otherId,[]]));assert.equal((await q('select * from public_programs where id=$1',[otherId])).length,0);
});
test('rappel : mise en file après 90 jours, absence de doublon et confirmation HTTP',async()=>{
 await db.exec(`create schema storage;create table storage.buckets(id text primary key,name text,public boolean,file_size_limit bigint,allowed_mime_types text[]);create table storage.objects(bucket_id text,name text);create function storage.foldername(text) returns text[] language sql as $$select string_to_array($1,'/')$$;create function storage.extension(text) returns text language sql as $$select 'pdf'::text$$;
 create schema vault;create table vault.decrypted_secrets(name text,decrypted_secret text);insert into vault.decrypted_secrets values('sokile_webhook_secret','local-test-only');
 create schema net;create table net._http_response(id bigint,status_code integer,content text);create table net.test_requests(id bigserial primary key,body jsonb);create function net.http_post(url text,headers jsonb,body jsonb,timeout_milliseconds integer) returns bigint language sql as $$insert into net.test_requests(body) values($3) returning id$$;
 create schema cron;create function cron.schedule(text,text,text) returns bigint language sql as $$select 1::bigint$$;create function public.sokile_notify_admin_webhook() returns trigger language plpgsql as $$begin return new;end$$;`);
 await db.exec(await readFile(new URL('../supabase-v38b-program-integrations.sql',import.meta.url),'utf8'));
 const id=await create();await approve(id);
 await q("update development_programs set inventory_updated_at=now()-interval '91 days' where id=$1",[id]);
 await assert.rejects(as(owner,()=>q('select sokile_program_reminders()')));
 assert.equal((await q('select sokile_program_reminders() as n'))[0].n,1);
 assert.equal((await q('select sokile_program_reminders() as n'))[0].n,0);
 const [job]=await q('select * from program_reminder_jobs where program_id=$1',[id]);assert.equal(job.attempts,1);assert.equal(job.payload.record.email,'owner@example.test');
 await q('insert into net._http_response values($1,200,$2)',[job.request_id,JSON.stringify({accepted:true})]);
 assert.equal((await q('select sokile_program_reminders() as n'))[0].n,0);
 assert.ok((await q('select sent_at from program_reminder_jobs where id=$1',[job.id]))[0].sent_at);
 await q("update development_programs set inventory_updated_at=now()-interval '92 days',status='archive' where id=$1",[id]);
 assert.equal((await q('select sokile_program_reminders() as n'))[0].n,0);
 assert.equal((await q('select count(*) from net.test_requests'))[0].count,1);
});
test.after(async()=>db.close());
