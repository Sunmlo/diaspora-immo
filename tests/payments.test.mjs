import test from 'node:test';
import assert from 'node:assert/strict';
import {amountToMinor,amountInput,quotaInput} from '../src/payments.mjs';
import {createPaymentsHandler,checkoutParameters,matchesOrder,sessionStatus,allowedOrigin,isTestKey} from '../supabase/functions/payments-test/handler.mjs';
const order={id:'20000000-0000-4000-8000-000000000001',owner_id:'10000000-0000-4000-8000-000000000001',offer_id:'30000000-0000-4000-8000-000000000001',offer_name:'Offre de test',amount_minor:1500,currency:'eur',billing_interval:'month',status:'created',created_at:new Date().toISOString(),stripe_session_id:null};
const session={id:'cs_test_one',url:'https://checkout.stripe.com/c/pay/cs_test_one',livemode:false,status:'open',payment_status:'unpaid',amount_total:1500,currency:'eur',mode:'subscription',client_reference_id:order.id,metadata:{app:'sokile',environment:'test',order_id:order.id,owner_id:order.owner_id}};
const json=(value,status=200)=>new Response(JSON.stringify(value),{status});
function fixture(overrides={}){
 const calls=[];const env={SUPABASE_URL:'https://db.example.test',SUPABASE_ANON_KEY:'public-test',SUPABASE_SERVICE_ROLE_KEY:'service-test',STRIPE_TEST_SECRET_KEY:'sk_test_example',STRIPE_TEST_WEBHOOK_SECRET:'whsec_example',...overrides.env};
 const event=overrides.event||{id:'evt_one',livemode:false,type:'checkout.session.completed',data:{object:session}};
 const handler=createPaymentsHandler({env:key=>env[key],send:async(url,options)=>{
  calls.push({url,options});
  if(url.endsWith('/auth/v1/user'))return json(overrides.user||{id:order.owner_id,email:'contact@example.test',email_confirmed_at:'2026-09-23T08:00:00Z'},overrides.authStatus||200);
  if(url.endsWith('/rpc/sokile_billing_admin'))return json(overrides.admin??true);
  if(url.includes('/billing_settings?'))return json([{test_enabled:overrides.enabled??true}]);
  if(url.endsWith('/rpc/sokile_billing_begin'))return json({...order,...overrides.order});
  if(url.includes('/billing_test_orders?'))return json([{...order,...overrides.order}]);
  if(url.endsWith('/rpc/sokile_billing_attach')||url.endsWith('/rpc/sokile_billing_record'))return json(true);
  throw Error('Unexpected DB route');
 },stripeFactory:key=>{
  calls.push({stripeKey:key});
  return {balance:{retrieve:async()=>({livemode:false})},checkout:{sessions:{create:async(params,options)=>{calls.push({create:params,options});return {...session,...overrides.session};},retrieve:async id=>{calls.push({retrieve:id});return {...session,...overrides.session};}}},verifyEvent:async(raw,signature,secret)=>{calls.push({verify:{raw,signature,secret}});if(overrides.invalidSignature)throw Error('Invalid signature');return event;}};
 }});
 const req=(body={action:'checkout',offer_id:order.offer_id,request_id:order.id},headers={})=>new Request('https://edge.example.test/payments-test',{method:'POST',headers:{authorization:'Bearer synthetic-token',origin:'https://www.sokile.com',...headers},body:JSON.stringify(body)});
 const webhook=()=>new Request('https://edge.example.test/payments-test/webhook',{method:'POST',headers:{'stripe-signature':'synthetic-signature'},body:'{"untouched":"raw body"}'});
 return {handler,calls,req,webhook};
}
test('tarifs : conversion exacte EUR et CFA sans multiplication indue',()=>{
 assert.equal(amountToMinor('19,99','eur'),1999);assert.equal(amountToMinor('0.29','eur'),29);
 assert.equal(amountToMinor('15 000','xof'),15000);assert.equal(amountToMinor('15000','xaf'),15000);
 assert.equal(amountInput({amount_minor:1999,currency:'eur'}),'19.99');
 assert.equal(amountInput({amount_minor:15000,currency:'xof'}),'15000');
 assert.equal(amountToMinor('','eur'),null);assert.equal(quotaInput(''),null);
 for(const [v,c] of [['1.2','xof'],['10.001','eur'],['1e3','eur'],['0','eur'],['-1','eur'],['1','usd'],['100000000','xaf']])assert.throws(()=>amountToMinor(v,c));
 for(const v of ['0','-1','1.5','2x'])assert.throws(()=>quotaInput(v));
});
test('checkout : prix serveur, abonnement et retour sur Sokilé imposés',async()=>{
 const f=fixture();const response=await f.handler(f.req({action:'checkout',offer_id:order.offer_id,request_id:order.id,amount:1,currency:'usd',success_url:'https://evil.example'}));
 assert.equal(response.status,200);const creation=f.calls.find(x=>x.create);assert.equal(creation.create.line_items[0].price_data.unit_amount,1500);assert.equal(creation.create.line_items[0].price_data.currency,'eur');assert.equal(creation.create.mode,'subscription');assert.equal(creation.create.line_items[0].price_data.recurring.interval,'month');assert.equal(creation.options.idempotencyKey,`sokile-test-${order.id}`);assert.ok(creation.create.success_url.startsWith('https://www.sokile.com/'));
 const single=checkoutParameters({...order,billing_interval:'once',currency:'xaf',amount_minor:10000},'test@example.test');assert.equal(single.mode,'payment');assert.equal(single.line_items[0].price_data.unit_amount,10000);assert.equal(single.line_items[0].price_data.recurring,undefined);
});
test('checkout : utilisateurs non autorisés et sessions non confirmées refusés',async()=>{
 for(const overrides of [{admin:false},{user:{id:order.owner_id,email:'contact@example.test'}}]){
  const f=fixture(overrides);assert.equal((await f.handler(f.req())).status,403);assert.ok(!f.calls.some(x=>x.stripeKey));
 }
 const f=fixture({authStatus:401});assert.equal((await f.handler(f.req())).status,401);
});
test('checkout : aucune clé réelle, domaine tiers ni activation publique',async()=>{
 assert.equal(isTestKey('sk_live_any'),false);assert.equal(isTestKey('rk_test_example'),true);
 assert.equal(allowedOrigin('https://sokile.com.attacker.test'),false);assert.equal(allowedOrigin('https://diaspora-immo-git-feature-paiements-test-leonard16.vercel.app'),true);
 for(const key of ['sk_live_example',undefined]){const f=fixture({env:{STRIPE_TEST_SECRET_KEY:key}});assert.equal((await f.handler(f.req())).status,503);assert.ok(!f.calls.some(x=>x.stripeKey));}
 const f=fixture({enabled:false});assert.equal((await f.handler(f.req())).status,409);assert.ok(!f.calls.some(x=>x.create));
 const g=fixture();assert.equal((await g.handler(g.req(undefined,{origin:'https://other.example'}))).status,403);assert.equal(g.calls.length,0);
});
test('checkout : mauvaise somme, session réelle ou mauvaise destination bloquées',async()=>{
 for(const patch of [{livemode:true},{amount_total:1},{currency:'usd'},{url:'https://checkout.stripe.com.attacker.test/pay'},{metadata:{...session.metadata,owner_id:'other'}}]){
  const f=fixture({session:patch});assert.equal((await f.handler(f.req())).status,502);assert.ok(!f.calls.some(x=>x.url?.endsWith('sokile_billing_attach')));
 }
});
test('checkout : reprise sans nouvelle session et anciens essais non recréés',async()=>{
 const f=fixture({order:{stripe_session_id:session.id}});assert.equal((await f.handler(f.req())).status,200);assert.ok(f.calls.some(x=>x.retrieve));assert.ok(!f.calls.some(x=>x.create));
 const old=fixture({order:{created_at:'2020-01-01T00:00:00Z'}});assert.equal((await old.handler(old.req())).status,409);assert.ok(!old.calls.some(x=>x.create));
 const paid=fixture({order:{status:'paid'}});assert.equal((await paid.handler(paid.req())).status,409);
});
test('statut : vérification privée sans exposer aucune clé',async()=>{
 const f=fixture();const response=await f.handler(f.req({action:'status'}));const body=await response.text();assert.equal(response.status,200);assert.equal(JSON.parse(body).connected,true);assert.ok(!body.includes('sk_test'));assert.ok(!body.includes('whsec'));assert.ok(!body.includes('service-test'));
});
test('webhook : signature sur corps brut obligatoire avant tout accès DB',async()=>{
 const f=fixture({invalidSignature:true});assert.equal((await f.handler(f.webhook())).status,400);assert.equal(f.calls.find(x=>x.verify).verify.raw,'{"untouched":"raw body"}');assert.ok(!f.calls.some(x=>x.url));
 const missing=fixture();const request=missing.webhook();request.headers.delete('stripe-signature');assert.equal((await missing.handler(request)).status,400);assert.equal(missing.calls.length,0);
});
test('webhook : un événement réel ou étranger ne modifie jamais une commande',async()=>{
 const f=fixture({event:{id:'evt_live',livemode:true,type:'checkout.session.completed',data:{object:session}}});assert.equal((await f.handler(f.webhook())).status,400);assert.ok(!f.calls.some(x=>x.url));
 const other=fixture({event:{id:'evt_other',livemode:false,type:'checkout.session.completed',data:{object:{...session,metadata:{app:'other'}}}}});assert.equal((await other.handler(other.webhook())).status,200);assert.ok(!other.calls.some(x=>x.url));
});
test('webhook : un retour client ne confirme rien, seule une session payée vérifiée le peut',async()=>{
 const f=fixture({session:{status:'complete',payment_status:'paid',subscription:'sub_example'}});assert.equal((await f.handler(f.webhook())).status,200);
 const recorded=JSON.parse(f.calls.find(x=>x.url?.endsWith('sokile_billing_record')).options.body);assert.equal(recorded.p_status,'paid');assert.equal(recorded.p_subscription_id,'sub_example');assert.ok(f.calls.some(x=>x.retrieve===session.id));
 assert.equal(sessionStatus({...session,status:'complete'},'checkout.session.completed'),'pending');assert.equal(sessionStatus({...session,status:'expired'},'checkout.session.expired'),'expired');
 const mismatch=fixture({session:{status:'complete',payment_status:'paid',amount_total:1}});assert.equal((await mismatch.handler(mismatch.webhook())).status,409);assert.ok(!mismatch.calls.some(x=>x.url?.endsWith('sokile_billing_record')));
 assert.equal(matchesOrder({...session,mode:'payment'},order),false);
});
