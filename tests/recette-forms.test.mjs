import test from 'node:test';
import assert from 'node:assert/strict';
import {listingForm,splitPhone,normalizePhone,contactError,websiteUrl,photoUrlsInOrder,readAllProperties,isDocumentAvailable} from '../src/form-fields.mjs';
const codes=[{code:'+221'},{code:'+33'},{code:'+1'},{code:'+27'}];
test('editing a rental preserves its category, details, zero values and phone prefix',()=>{
 const original={type:'Location',transaction:'location',nature:'appartement',details:{pieces:'3',chambres:'2',etage:0,meuble:'Meublé'},user_phone:'+221 77 000 00 00',user_email:'contact@example.com',surface:70,rooms:3,bathrooms:0,tags:['Parking']};
 const f=listingForm(original,{},codes);
 assert.equal(f.transaction,'location'); assert.equal(f.nature,'appartement'); assert.deepEqual(f.details,original.details); assert.equal(f.details.etage,0); assert.equal(f.bathrooms,0);
 assert.equal(f.phoneCode+f.phone,'+221770000000'); assert.equal(f.email,original.user_email);
 f.details.pieces='8'; f.features.push('Jardin'); assert.equal(original.details.pieces,'3'); assert.deepEqual(original.tags,['Parking']);
});
test('new listings require an explicit category and transaction',()=>{
 const f=listingForm(null,{email:'contact@example.com'},codes); assert.equal(f.transaction,''); assert.equal(f.nature,''); assert.equal(f.email,'contact@example.com');
});
test('legacy terrain and rental values remain usable in editing',()=>{
 assert.equal(listingForm({type:'Terrain',title:'Terrain Dakar'},null,codes).nature,'terrain');
 assert.equal(listingForm({type:'Location',title:'Studio'},null,codes).transaction,'location');
 assert.deepEqual(splitPhone('+33 6 00 00 00 00',codes),{phoneCode:'+33',phone:'600000000'});
});
test('saved photos and new uploads keep the exact selected cover/order',()=>{
 const a={url:'existing-a'},b={url:'existing-b'},c={file:{name:'new-c'}};
 assert.deepEqual(photoUrlsInOrder([c,b,a],['uploaded-c']),['uploaded-c','existing-b','existing-a']);
 assert.deepEqual(photoUrlsInOrder([b,a],[]),['existing-b','existing-a']);
 assert.throws(()=>photoUrlsInOrder([c,b],[]),/formulaire est conservé/);
});
test('invalid contact info is rejected before submitting, valid website is normalized',()=>{
 assert.match(contactError('TEST','invalide',''),/email valide/);
 assert.match(contactError('   ','contact@example.com',''),/nom/);
 for(const u of ['javascript:alert(1)','data:text/html,test','https://','https://user:password@example.com']) assert.match(contactError('TEST','contact@example.com',u),/site valide/);
 assert.equal(contactError('TEST',' contact@example.com ','www.sokile.com'),'');
 assert.equal(websiteUrl('www.sokile.com'),'https://www.sokile.com/');
});
test('search loads listings beyond the old 24 limit and across API pages',async()=>{
 const catalogue=Array.from({length:205},(_,i)=>({id:i})); const calls=[];
 const rows=await readAllProperties(async(table,query)=>{calls.push(query);const off=+new URLSearchParams(query).get('offset');return {ok:true,data:catalogue.slice(off,off+100)};});
 assert.deepEqual(rows,catalogue);assert.equal(calls.length,3);assert.match(calls[2],/offset=200/);
});
test('search does not silently return partial results on a later-page error',async()=>{
 let page=0; await assert.rejects(readAllProperties(async()=>++page===1?{ok:true,data:Array(100).fill({id:1})}:{ok:false}),/Lecture/);
});

test('phone entry handles national and pasted international numbers without duplicate prefixes',()=>{
 assert.equal(normalizePhone('+33','06 12 34 56 78'),'+33612345678');
 assert.equal(normalizePhone('+33','+33 (0)6 12 34 56 78'),'+33612345678');
 assert.equal(normalizePhone('+221','77 123 45 67'),'+221771234567');
 assert.equal(normalizePhone('+33','+221 77 123 45 67'),'+221771234567');
 assert.equal(normalizePhone('+33','00221 77 123 45 67'),'+221771234567');
 assert.deepEqual(splitPhone('00221 77 123 45 67',codes),{phoneCode:'+221',phone:'771234567'});
});
test('phone normalization preserves significant zeroes and rejects unusable contact numbers',()=>{
 assert.equal(normalizePhone('+225','01 23 45 67 89'),'+2250123456789');
 assert.equal(normalizePhone('+33','  '),'');
 for(const value of ['bonjour','77abc1234567','+33+612345678','12','+1234567890123456']) assert.equal(normalizePhone('+221',value),null);
});

test('downloads require an available document, never an error page or missing object',async()=>{
 for(const type of ['application/pdf','application/vnd.openxmlformats-officedocument.spreadsheetml.sheet','application/octet-stream']) {
   assert.equal(await isDocumentAvailable('https://example.test/document',async()=>new Response(null,{status:200,headers:{'content-type':type}})),true);
 }
 for(const [status,type] of [[400,'application/json'],[404,'text/html'],[200,'text/html']]) {
   assert.equal(await isDocumentAvailable('https://example.test/document',async()=>new Response(null,{status,headers:{'content-type':type}})),false);
 }
 assert.equal(await isDocumentAvailable('https://example.test/document',async()=>{throw new Error('offline');}),false);
});
