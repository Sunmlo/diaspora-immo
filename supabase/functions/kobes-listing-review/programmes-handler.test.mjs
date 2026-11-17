import test from 'node:test';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {createHandler} from './handler.mjs';
import {VERSION} from './programmes-schema.mjs';
const listings=Array.from({length:10},(_,i)=>({id:'KOB-'+String(i+1).padStart(2,'0'),images:['https://example.invalid/fixture.jpg']}));
const token='a'.repeat(43),tokenHash=createHash('sha256').update(token).digest('hex');
const typology=()=>({label:'Appartement F3',availability:'available',priceType:'from',price:45000000,areaMin:70,areaMax:95,landMin:null,landMax:null,availableLots:4,notes:''});
const valid=()=>({id:crypto.randomUUID(),version:VERSION,consent:true,contact:{name:'TEST TECHNIQUE',email:'test@example.invalid',phone:'TEST'},entries:listings.map((d,i)=>({id:d.id,status:i===0?'approved':'pending',stage:'under_construction',mediaChoice:'confirmed',title:'Programme de test',location:'Ville de test',developer:'Promoteur de test',description:'Données fictives de test',delivery:'2e trimestre 2027',equipment:'',terms:'',notes:'',mediaLinks:'',videoLink:'',brochureLink:'',totalUnits:20,typologies:[typology(),{...typology(),label:'Appartement F4',price:60000000,areaMin:110,areaMax:130,availableLots:2}]}))});
const request=(data,auth=token,origin='https://www.sokile.com')=>new Request('https://example.invalid/review',{method:data?'POST':'GET',headers:{'X-Review-Token':auth,Origin:origin,'Content-Type':'application/json'},...(data?{body:JSON.stringify(data)}:{})});
function setup(overrides={}){const rows=new Map();const store={get:async id=>rows.get(id),countSince:async()=>rows.size,insert:async row=>{if(!rows.has(row.id))rows.set(row.id,structuredClone(row));},...overrides};return {rows,handler:createHandler({tokenHash,listings,store,now:()=>new Date('2026-11-17')})};}
test('authentication, origin and expiry protect programme submissions',async()=>{
 const {handler}=setup();assert.equal((await handler(request(null,''))).status,401);assert.equal((await handler(request(null,'b'.repeat(43)))).status,403);assert.equal((await handler(request(null,token,'https://evil.invalid'))).status,403);assert.equal((await (await handler(request())).json()).version,VERSION);
 const expired=createHandler({tokenHash,listings,store:{},now:()=>new Date('2027-02-18')});assert.equal((await expired(request())).status,410);
});
test('prices, stock per typology and programme fields survive storage and retries',async()=>{
 const {handler,rows}=setup(),data=valid();const a=await handler(request(data));assert.equal(a.status,200);const reference=(await a.json()).reference;
 const saved=rows.get(data.id).payload;assert.equal(saved.category,'programmes_neufs');assert.equal(saved.entries[0].kind,'new_development');assert.equal(saved.entries[0].currency,'XOF');assert.equal(saved.entries[0].typologies[0].price,45000000);assert.equal(saved.entries[0].typologies[1].availableLots,2);assert.equal(saved.entries[0].totalUnits,20);assert.equal(saved.entries[0].delivery,'2e trimestre 2027');
 rows.get(data.id).payload=Object.fromEntries(Object.entries(saved).reverse());assert.equal((await (await handler(request(data))).json()).reference,reference);assert.equal(rows.size,1);data.entries[0].notes='Changed';assert.equal((await handler(request(data))).status,409);
});
test('rejects inverted ranges, inconsistent stock, missing available prices and oversized typologies',async()=>{
 const mutations=[d=>d.entries[0].typologies[0].areaMax=50,d=>{d.entries[0].typologies[0].landMin=100;d.entries[0].typologies[0].landMax=50;},d=>d.entries[0].typologies[0].availableLots=-1,d=>d.entries[0].typologies[0].availableLots=0,d=>d.entries[0].typologies[0].availableLots=1.5,d=>d.entries[0].totalUnits=2,d=>d.entries[0].typologies[0].price=null,d=>d.entries[0].typologies[0].priceType='unknown',d=>d.entries[0].typologies[0].label='',d=>d.entries[0].typologies=Array.from({length:31},typology)];
 for(const change of mutations){const {handler,rows}=setup(),d=valid();change(d);assert.equal((await handler(request(d))).status,400);assert.equal(rows.size,0);}
});
test('delivered programmes do not require a future delivery date; off-plan ones do',async()=>{const {handler}=setup(),d=valid();d.entries[0].delivery='';assert.equal((await handler(request(d))).status,400);d.entries[0].stage='delivered';assert.equal((await handler(request(d))).status,200);});
test('partial corrections save unknown price, stock and delivery without invented values',async()=>{
 const {handler,rows}=setup(),d=valid();Object.assign(d.entries[0],{status:'corrections',stage:'unknown',delivery:'',mediaChoice:'unconfirmed',typologies:[{...typology(),availability:'unknown',availableLots:null,price:null,priceType:'unknown',areaMin:null,areaMax:null}]});
 assert.equal((await handler(request(d))).status,200);assert.equal(rows.get(d.id).payload.entries[0].typologies[0].price,null);
});
test('available and sold-out typologies remain distinct',async()=>{
 const {handler,rows}=setup(),d=valid();d.entries[0].typologies[1].availability='sold_out';d.entries[0].typologies[1].availableLots=0;assert.equal((await handler(request(d))).status,200);assert.equal(rows.get(d.id).payload.entries[0].typologies[1].availability,'sold_out');
 const bad=valid();bad.entries[0].typologies.forEach(t=>{t.availability='sold_out';t.availableLots=0;});assert.equal((await handler(request(bad))).status,400);
});
test('consent, identities, media protocols and unreviewed-only returns are enforced',async()=>{
 for(const change of [d=>d.consent=false,d=>d.entries.pop(),d=>d.entries[0].id='OTHER',d=>d.entries[0].brochureLink='javascript:alert(1)',d=>d.entries[0].videoLink='https://user:secret@example.invalid',d=>d.entries.forEach(e=>e.status='pending')]){const {handler,rows}=setup(),d=valid();change(d);assert.equal((await handler(request(d))).status,400);assert.equal(rows.size,0);}
});
test('v2 form already opened in a browser still saves its original version',async()=>{
 const {handler,rows}=setup();const d={id:crypto.randomUUID(),version:'kobes-20261117-v2',consent:true,contact:{name:'TEST',email:'test@example.invalid',phone:'TEST'},entries:listings.map(l=>({id:l.id,status:'corrections',mediaChoice:'confirmed',title:'Old form',location:'Test',description:'',notes:'',mediaLinks:'',videoLink:'',composition:'',delivery:'',price:null,priceType:'unknown',area:null,landArea:null,bedrooms:null,bathrooms:null}))};
 assert.equal((await handler(request(d))).status,200);assert.equal(rows.get(d.id).payload.version,'kobes-20261117-v2');
});
test('storage outage never claims success',async()=>{const {handler}=setup({get:async()=>{throw Error('offline');}});const r=await handler(request(valid()));assert.equal(r.status,503);assert.equal((await r.json()).saved,undefined);});
