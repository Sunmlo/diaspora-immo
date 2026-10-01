import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {cleanGift,giftSimulation,giftTools,giftApi} from '../src/gift.mjs';
import {projects,needs} from '../src/gift-data.mjs';
import {PGlite} from '@electric-sql/pglite';
const answers={project:'land',country:'Cameroun',mood:'warm',need:'build'};
test('every project maps to existing PDFs; invalid combinations are rejected',()=>{
 for(const p of projects)for(const n of needs[p.mode]){assert(cleanGift({...answers,project:p.id,need:n.id}));for(const id of n.guides)assert(readFileSync(new URL(`../public/gifts/Sokile-guide-${id}.pdf`,import.meta.url)).subarray(0,4).equals(Buffer.from('%PDF')))}
 assert.equal(cleanGift({...answers,need:'visit'}),null);assert.equal(cleanGift({...answers,country:'<script>'}),null);
 for(const id of ['rent_house','rent_flat'])assert.deepEqual(giftTools({...answers,project:id}),['savings']);
 assert.equal(giftSimulation(answers).currency,'XAF');assert.equal(giftSimulation(answers).active,'construction');
 const sim=giftSimulation(answers);sim.construction.surface='120';assert.equal(giftSimulation(answers,sim).construction.surface,'120');
});
test('API requires login, sends only validated fields, and surfaces failed save',async()=>{
 const calls=[];const api=giftApi('https://example.invalid','public',async(url,opts)=>{calls.push({url,opts});return{ok:true,json:async()=>[{answers,simulation:null}]}});
 await assert.rejects(api.save(null,answers,null),/Connectez/);
 await api.save({id:'user-a',token:'token-a'},{...answers,unwanted:'value'},null);
 const payload=JSON.parse(calls[0].opts.body);assert.equal(payload.user_id,'user-a');assert.equal(payload.answers.unwanted,undefined);assert.equal(calls[0].opts.headers.Authorization,'Bearer token-a');
 const broken=giftApi('x','public',async()=>({ok:false,status:500}));await assert.rejects(broken.save({id:'a',token:'b'},answers,null),/Réessayez/);
});
test('database isolates two accounts and blocks anonymous access / ownership transfer',async()=>{
 const db=new PGlite();const a='10000000-0000-4000-8000-000000000001',b='10000000-0000-4000-8000-000000000002';
 await db.exec(`create role anon;create role authenticated;create schema auth;create table auth.users(id uuid primary key);insert into auth.users values('${a}'),('${b}');create function auth.uid() returns uuid language sql stable as $$select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid$$;grant usage on schema auth to authenticated;`);
 await db.exec(readFileSync(new URL('../supabase-gift-projects-20261001.sql',import.meta.url),'utf8'));
 await db.exec('set role anon');await assert.rejects(db.query('select * from public.gift_projects'),/permission denied/);
 await db.exec('reset role;set role authenticated');await db.query("select set_config('request.jwt.claim.sub',$1,false)",[a]);
 await db.query('insert into gift_projects(user_id,answers) values($1,$2)',[a,answers]);
 await assert.rejects(db.query('insert into gift_projects(user_id,answers) values($1,$2)',[b,answers]),/row-level security/);
 await assert.rejects(db.query('update gift_projects set user_id=$1',[b]),/row-level security/);
 await assert.rejects(db.query('update gift_projects set answers=$1',[{...answers,mood:null}]),/check constraint/);
 await db.query("select set_config('request.jwt.claim.sub',$1,false)",[b]);assert.deepEqual((await db.query('select * from gift_projects')).rows,[]);
 assert.equal((await db.query('delete from gift_projects returning user_id')).rows.length,0);
 await db.query('insert into gift_projects(user_id,answers) values($1,$2)',[b,{...answers,mood:'natural'}]);
 await db.query("select set_config('request.jwt.claim.sub',$1,false)",[a]);assert.equal((await db.query('select answers from gift_projects')).rows[0].answers.mood,'warm');
 await db.exec(`reset role;delete from auth.users where id='${a}'`);assert.equal((await db.query('select count(*)::int as n from gift_projects')).rows[0].n,1);await db.close();
});
