import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
const {PGlite}=await import(process.env.SOKILE_PGLITE_PATH||'@electric-sql/pglite');
const db=new PGlite();
const admin='10000000-0000-4000-8000-000000000001',member='10000000-0000-4000-8000-000000000002';
await db.exec(`create role anon;create role authenticated;create role service_role bypassrls;create schema auth;create table auth.users(id uuid primary key,email_confirmed_at timestamptz);create function auth.uid() returns uuid language sql stable as $$select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid$$;grant usage on schema auth to authenticated,anon,service_role;create function public.sokile_is_admin() returns boolean language sql stable as $$select auth.uid()='${admin}'::uuid$$;insert into auth.users values('${admin}',now()),('${member}',now());`);
const migration=await readFile(new URL('../supabase-v39-paiements-test.sql',import.meta.url),'utf8');
await db.exec(migration);
const q=async(s,p=[])=>(await db.query(s,p)).rows;
async function as(id,fn){await db.exec(`set role ${id==='service'?'service_role':id?'authenticated':'anon'};select set_config('request.jwt.claim.sub','${id==='service'?'':id||''}',false);`);try{return await fn();}finally{await db.exec('reset role');}}
const offer=(await q("select * from billing_offers where code='agences'"))[0];
const save=(patch={})=>as(admin,()=>q('select sokile_billing_save_offer($1,$2)',[offer.id,{...offer,amount_minor:1234,...patch}]));
const begin=id=>as(admin,()=>q('select sokile_billing_begin($1,$2) as value',[offer.id,id]));
const oid=n=>`20000000-0000-4000-8000-${String(n).padStart(12,'0')}`;

test('paiements : migration réexécutable, lancement gratuit et catalogue sans prix',async()=>{
 await db.exec(migration);assert.equal((await q('select count(*) from billing_offers'))[0].count,4);
 assert.ok((await q('select amount_minor from billing_offers')).every(x=>x.amount_minor===null));
 assert.equal((await q('select test_enabled from billing_settings'))[0].test_enabled,false);
 await assert.rejects(begin(oid(1)));await save();await assert.rejects(begin(oid(1)));
});
test('paiements : visiteurs et membres ne lisent ni offres ni essais privés',async()=>{
 for(const table of ['billing_settings','billing_offers','billing_test_orders','billing_test_events']){
  await assert.rejects(as(null,()=>q(`select * from ${table}`)));
  assert.equal((await as(member,()=>q(`select * from ${table}`))).length,0);
 }
 await assert.rejects(as(member,()=>q('select sokile_billing_settings(true)')));
 await assert.rejects(as(member,()=>q('select sokile_billing_save_offer($1,$2)',[offer.id,offer])));
 await assert.rejects(as(member,()=>q('select sokile_billing_begin($1,$2)',[offer.id,oid(1)])));
 await assert.rejects(as(admin,()=>q('update billing_offers set amount_minor=1')));
});
test('paiements : une identité admin non confirmée est refusée',async()=>{
 await q('update auth.users set email_confirmed_at=null where id=$1',[admin]);
 assert.equal((await as(admin,()=>q('select * from billing_offers'))).length,0);
 await assert.rejects(save());await q('update auth.users set email_confirmed_at=now() where id=$1',[admin]);
});
test('paiements : seuls les tarifs valides et les offres actives peuvent être testés',async()=>{
 for(const patch of [{amount_minor:-1},{currency:'usd'},{billing_interval:'week'},{listing_quota:0},{program_quota:-3}])await assert.rejects(save(patch));
 await as(admin,()=>q('select sokile_billing_settings(true)'));
 await save({amount_minor:null});await assert.rejects(begin(oid(1)));
 await save({archived:true});await assert.rejects(begin(oid(1)));await save({archived:false});
});
test('paiements : copie figée du tarif serveur et double clic idempotent',async()=>{
 const first=(await begin(oid(1)))[0].value;assert.equal(first.amount_minor,1234);assert.equal(first.owner_id,admin);
 await save({amount_minor:5000,currency:'xof'});
 assert.deepEqual((await begin(oid(1)))[0].value,first);
 assert.equal((await q('select count(*) from billing_test_orders'))[0].count,1);
 const second=(await begin(oid(2)))[0].value;assert.equal(second.amount_minor,5000);assert.equal(second.currency,'xof');
});
test('paiements : seul le serveur confirme et une session réelle est refusée',async()=>{
 await assert.rejects(as(admin,()=>q("update billing_test_orders set status='paid'")));
 await assert.rejects(as(admin,()=>q("select sokile_billing_attach($1,'cs_test_one')",[oid(1)])));
 await assert.rejects(as(member,()=>q("select sokile_billing_record('evt_fake','checkout.session.completed',$1,'cs_test_one','paid',null)",[oid(1)])));
 await assert.rejects(as('service',()=>q("select sokile_billing_attach($1,'cs_live_one')",[oid(1)])));
 await as('service',()=>q("select sokile_billing_attach($1,'cs_test_one')",[oid(1)]));
 await assert.rejects(as('service',()=>q("select sokile_billing_attach($1,'cs_test_other')",[oid(1)])));
});
test('paiements : webhook dédoublonné et paiement confirmé jamais dégradé',async()=>{
 const record=(event,type,status,session='cs_test_one')=>as('service',()=>q('select sokile_billing_record($1,$2,$3,$4,$5,null) as value',[event,type,oid(1),session,status]));
 assert.equal((await record('evt_one','checkout.session.completed','paid'))[0].value,true);
 const paid=(await q('select * from billing_test_orders where id=$1',[oid(1)]))[0];assert.equal(paid.status,'paid');assert.ok(paid.paid_at);
 assert.equal((await record('evt_one','checkout.session.completed','paid'))[0].value,false);
 await record('evt_old','checkout.session.expired','expired');
 assert.equal((await q('select status from billing_test_orders where id=$1',[oid(1)]))[0].status,'paid');
 await assert.rejects(record('evt_bad','checkout.session.completed','paid','cs_test_mismatch'));
 assert.equal((await q("select count(*) from billing_test_events where event_id='evt_bad'"))[0].count,0);
});
test('paiements : limitation des essais et désactivation effective',async()=>{
 await begin(oid(3));await begin(oid(4));await begin(oid(5));await assert.rejects(begin(oid(6)),/minute/);
 await as(admin,()=>q('select sokile_billing_settings(false)'));await assert.rejects(begin(oid(2)),/désactivés/);
});
test.after(()=>db.close());
