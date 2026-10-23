import test from 'node:test';
import assert from 'node:assert/strict';
import {listingVideoApi,videoFileError,videoDurationError,validVideoPath,MAX_VIDEO_BYTES} from '../src/listing-video.mjs';
const path='10000000-0000-4000-8000-000000000001/20000000-0000-4000-8000-000000000001.mp4';
test('video validation rejects empty, oversized, unsupported and excessively long media',()=>{
  for(const file of [null,{type:'text/html',size:100},{type:'video/mp4',size:0},{type:'video/mp4',size:MAX_VIDEO_BYTES+1}])assert.ok(videoFileError(file));
  for(const type of ['video/mp4','video/webm','video/quicktime'])assert.equal(videoFileError({type,size:1024}),'');
  for(const seconds of [NaN,Infinity,0,121])assert.ok(videoDurationError(seconds));
  assert.equal(videoDurationError(120),'');assert.equal(validVideoPath(path),true);
  for(const value of ['https://evil.test/video.mp4','../private.mp4',path+'?other=1',null])assert.equal(validVideoPath(value),false);
});
test('signed playback uses the viewer identity, a five-minute URL, and handles denied access',async()=>{
  const original=global.fetch,calls=[];
  try{
    global.fetch=async(url,options)=>{calls.push({url,...options});return Response.json({signedURL:`/object/sign/listing-videos/${path}?token=test`});};
    const api=listingVideoApi('https://project.supabase.co','public-key');
    assert.equal(await api.open(path),`https://project.supabase.co/storage/v1/object/sign/listing-videos/${path}?token=test`);
    assert.equal(calls[0].headers.Authorization,'Bearer public-key');
    assert.deepEqual(JSON.parse(calls[0].body),{expiresIn:300});
    await api.open(path,'reviewer-token');assert.equal(calls[1].headers.Authorization,'Bearer reviewer-token');
    global.fetch=async()=>Response.json({message:'forbidden'},{status:403});await assert.rejects(api.open(path),/indisponible/);
    global.fetch=async()=>Response.json({signedURL:'https://evil.test/video'});await assert.rejects(api.open(path),/indisponible/);
  }finally{global.fetch=original;}
});
