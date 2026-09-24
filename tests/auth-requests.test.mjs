import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';
import {normalizeEmail,readAuthResponse} from '../src/auth-session.mjs';

const source=readFileSync(new URL('../src/App.jsx',import.meta.url),'utf8');
const helpers=source.slice(source.indexOf('async function signUp('),source.indexOf('// ─── LOGIN MODAL'));
function setup(response) {
 const calls=[];
 const context=vm.createContext({SUPABASE_URL:'https://auth.example.test',SUPABASE_KEY:'synthetic-public-key',normalizeEmail,readAuthResponse,encodeURIComponent,window:{location:{origin:'https://www.sokile.com'}},fetch:async(url,options)=>{calls.push({url,...options,body:JSON.parse(options.body)});return response.clone();}});
 vm.runInContext(helpers,context);
 return {context,calls};
}
test('signup and login use the same normalized email and keep passwords out of URLs',async()=>{
 const {context,calls}=setup(new Response(JSON.stringify({user:{id:'synthetic'}}),{status:200}));
 await context.signUp(' TEST@Example.com ','synthetic-password',{name:'Test'});
 await context.signIn(' TEST@Example.com ','synthetic-password');
 for(const c of calls){assert.equal(c.body.email,'test@example.com');assert.equal(c.body.password,'synthetic-password');assert.doesNotMatch(c.url,/synthetic-password/);}
});
test('password recovery uses the current site origin and accepts a non-enumerating response',async()=>{
 const {context,calls}=setup(new Response('{}',{status:200}));
 const r=await context.requestPasswordReset(' TEST@Example.com ');
 assert.equal(r.error,undefined);
 assert.equal(new URL(calls[0].url).searchParams.get('redirect_to'),'https://www.sokile.com/');
 assert.equal(calls[0].body.email,'test@example.com');
});
test('password updates keep the recovery credential in the authorization header and expose server failure',async()=>{
 const {context,calls}=setup(new Response(JSON.stringify({error_code:'same_password'}),{status:422}));
 const r=await context.updatePassword('synthetic-recovery','synthetic-password');
 assert.match(r.error.message,/différent/);
 assert.equal(calls[0].method,'PUT');
 assert.equal(calls[0].headers.Authorization,'Bearer synthetic-recovery');
 assert.doesNotMatch(calls[0].url,/synthetic-recovery|synthetic-password/);
});
