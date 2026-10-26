import test from 'node:test';
import assert from 'node:assert/strict';
import {extractPage} from '../server/listing-extract.mjs';
import {publicUrl,publicAddress} from '../server/safe-fetch.mjs';
import {photoVerdict,createReviewHandler} from '../supabase/functions/listing-import-review/handler.mjs';
test('public URL validation blocks internal protocols, credentials, ports and private addresses',()=>{
 for(const u of ['http://example.com','https://a:b@example.com','https://example.com:8080','file:///etc/passwd','https://localhost'])assert.throws(()=>publicUrl(u));
 for(const ip of ['127.0.0.1','10.0.0.1','169.254.169.254','192.168.1.1','::1','::ffff:127.0.0.1','fc00::1','100.64.0.1'])assert.equal(publicAddress(ip),false,ip);
 assert.equal(publicAddress('93.184.216.34'),true);
});
test('structured property extracts only supported currency, known facts and media',()=>{
 const page=extractPage(`<script type="application/ld+json">${JSON.stringify({'@type':'House',name:'Villa à vendre',description:'Une villa de quatre chambres avec un grand jardin.',address:{addressCountry:'SN',addressLocality:'Dakar'},numberOfBedrooms:4,offers:{price:45000000,priceCurrency:'XOF'},image:['/villa.jpg','/logo.png']})}</script>`,'https://agence.example/biens/villa');
 assert.equal(page.isDetail,true);assert.equal(page.data.prix_fcfa,'45000000');assert.equal(page.data.ville,'Dakar');assert.equal(page.data.pays,'Sénégal');assert.equal(page.data.chambres,'4');assert.equal(page.data.pieces,'');assert.deepEqual(page.remotePhotos,['https://agence.example/villa.jpg']);
 const foreign=extractPage('<script type="application/ld+json">{"@type":"House","name":"Maison en vente","offers":{"price":200000,"priceCurrency":"USD"}}</script>','https://agence.example/biens/a');assert.equal(foreign.data.prix_fcfa,'');
});
test('catalogue identifies distinct same-site property links without publishing catalogue',()=>{
 const p=extractPage('<h1>Nos biens</h1><a href="/property/villa">Villa</a><a href="/property/villa#photos">Photos</a><a href="https://other.example/property/x">Externe</a>','https://agence.example/biens');assert.equal(p.isDetail,false);assert.equal(p.links.length,1);
});
test('image moderation fails closed for missing model results and flags explicit content',()=>{
 assert.equal(photoVerdict({status:'success'}),'manual_review');
 assert.equal(photoVerdict({status:'success',nudity:{sexual_activity:0.01,sexual_display:0.01,erotica:0.01},offensive:{prob:0.01}}),'checked');
 assert.equal(photoVerdict({status:'success',nudity:{sexual_activity:0.8,sexual_display:0,erotica:0},offensive:{prob:0}}),'flagged');
});
test('review endpoint rejects anonymous request before accessing database or provider',async()=>{
 let called=false;const handler=createReviewHandler({env:()=>'',send:async()=>{called=true;}});const result=await handler(new Request('https://test',{method:'POST',body:'{"id":1}'}));assert.equal(result.status,401);assert.equal(called,false);
});
test('review never evaluates another owners listing',async()=>{
 let calls=0;const handler=createReviewHandler({env:k=>k==='SUPABASE_URL'?'https://project.example':'key',send:async url=>{calls++;if(url.endsWith('/auth/v1/user'))return Response.json({id:'owner'});assert.match(url,/owner_id=eq.owner/);return Response.json([]);}});const result=await handler(new Request('https://test',{method:'POST',headers:{authorization:'Bearer token'},body:'{"id":1}'}));assert.equal(result.status,404);assert.equal(calls,2);
});
test('review outage stays pending, stops provider retries and permits a later retry',async()=>{
 let calls=0,saved;
 const base='https://project.example';
 const handler=createReviewHandler({env:k=>k==='SUPABASE_URL'?base:'key',digest:async()=> 'hash',send:async(url,opts)=>{
  if(url.endsWith('/auth/v1/user'))return Response.json({id:'owner'});
  if(url.includes('sightengine')){calls++;return Response.json({status:'failure'},{status:503});}
  if(opts.method==='PATCH'){saved=JSON.parse(opts.body);assert.deepEqual(Object.keys(saved),['moderation_note']);return Response.json([{id:1}]);}
  return Response.json([{id:1,status:'en_attente',details:{import_method:'website'},photos:[1,2].map(i=>base+'/storage/v1/object/public/photos-verified/annonces/owner/'+i+'.jpg'),updated_at:'2026-10-26T00:00:00Z'}]);
 }});
 const r=await handler(new Request('https://test',{method:'POST',headers:{authorization:'Bearer token'},body:'{"id":1}'}));assert.equal(r.status,200);assert.deepEqual(await r.json(),{status:'manual_review',checked:0,flagged:0,pending:2});assert.equal(calls,1);assert.match(saved.moderation_note,/import-ia-pending:hash/);
});
test('photo-free import skips image provider and remains pending human validation',async()=>{
 let saved;
 const handler=createReviewHandler({env:k=>k==='SUPABASE_URL'?'https://project.example':'',digest:async()=> 'no-photo-hash',send:async(url,opts)=>{
  assert.ok(!url.includes('sightengine'));
  if(url.endsWith('/auth/v1/user'))return Response.json({id:'owner'});
  if(opts.method==='PATCH'){assert.match(url,/status=eq.en_attente/);saved=JSON.parse(opts.body);return Response.json([{id:1}]);}
  return Response.json([{id:1,status:'en_attente',details:{import_method:'website'},photos:[],updated_at:'2026-10-26T00:00:00Z'}]);
 }});
 const r=await handler(new Request('https://test',{method:'POST',headers:{authorization:'Bearer token'},body:'{"id":1}'}));
 assert.equal(r.status,200);assert.deepEqual(await r.json(),{status:'no_photos',checked:0,flagged:0,pending:0});
 assert.deepEqual(Object.keys(saved),['moderation_note']);
 assert.match(saved.moderation_note,/Photo non disponible/);assert.match(saved.moderation_note,/requise avant publication/);
});
