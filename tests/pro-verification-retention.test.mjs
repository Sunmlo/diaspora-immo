import test from 'node:test';
import assert from 'node:assert/strict';
import {createRetentionHandler} from '../supabase/functions/retention-cleanup/handler.mjs';
const env=k=>({WEBHOOK_SECRET:'test-secret',SUPABASE_URL:'https://db.example',SUPABASE_SERVICE_ROLE_KEY:'test-key'})[k];
const req=body=>new Request('https://worker.example',{method:'POST',headers:{'x-webhook-secret':'test-secret'},body:JSON.stringify(body)});
const response=data=>new Response(JSON.stringify(data));
test('private evidence cleanup requires scheduler authentication and dry run never deletes',async()=>{
 const calls=[];const handler=createRetentionHandler({env,send:async(url,options)=>{calls.push([url,options]);return response(url.endsWith('sokile_pro_retention')?{dossiers:0,audit_rows:0,orphan_paths:['old.pdf']}:{dry_run:true});}});
 assert.equal((await handler(new Request('https://worker.example',{method:'POST'}))).status,401);assert.equal(calls.length,0);
 assert.equal((await handler(req({dry_run:true}))).status,200);assert.ok(calls.every(([,o])=>o.method!=='DELETE'));
});
test('retention deletes only eligible private paths and keeps existing photo maintenance',async()=>{
 const removed=[];const path='10000000-0000-4000-8000-000000000001/20000000-0000-4000-8000-000000000001.pdf';
 const handler=createRetentionHandler({env,send:async(url,o)=>{
  if(url.endsWith('sokile_pro_retention'))return response({dossiers:1,audit_rows:1,orphan_paths:[path,'../other-bucket/private.pdf']});
  if(url.endsWith('sokile_retention_media_pending'))return response([]);
  if(o.method==='DELETE')removed.push([url,JSON.parse(o.body)]);
  return response({});
 }});
 const result=await (await handler(req({}))).json();assert.equal(result.professional_files_deleted,1);
 assert.deepEqual(removed,[['https://db.example/storage/v1/object/pro-verification-documents',{prefixes:[path]}]]);
});
test('individual evidence cleanup is isolated to its private bucket',async()=>{
 const removed=[];const path='10000000-0000-4000-8000-000000000001/20000000-0000-4000-8000-000000000002.pdf';
 const handler=createRetentionHandler({env,send:async(url,o)=>{
  if(url.endsWith('sokile_individual_retention'))return response({dossiers:1,audit_rows:1,orphan_paths:[path,'../another-bucket/file.pdf']});
  if(url.endsWith('sokile_pro_retention'))return response({dossiers:0,audit_rows:0,orphan_paths:[]});
  if(url.endsWith('sokile_retention_media_pending'))return response([]);
  if(o.method==='DELETE')removed.push([url,JSON.parse(o.body)]);
  return response({});
 }});
 const result=await (await handler(req({}))).json();assert.equal(result.individual_files_deleted,1);
 assert.deepEqual(removed,[['https://db.example/storage/v1/object/individual-verification-documents',{prefixes:[path]}]]);
});
