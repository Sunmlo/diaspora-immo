// Le SDK vérifie les signatures dans index.ts. Les dépendances sont injectées pour tester les frontières de confiance.
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const EVENTS = new Set(['checkout.session.completed','checkout.session.expired','checkout.session.async_payment_succeeded','checkout.session.async_payment_failed']);
const RETURN_URL = 'https://www.sokile.com/?tab=compte&paiement=test';
export const isTestKey = key => /^(sk|rk)_test_[A-Za-z0-9]+$/.test(key || '');
export const allowedOrigin = origin => ['https://www.sokile.com','https://sokile.com'].includes(origin) || /^https:\/\/diaspora-immo-[a-z0-9-]+-leonard16\.vercel\.app$/.test(origin || '');

export function checkoutParameters(order, email) {
 const metadata = {app:'sokile',environment:'test',order_id:order.id,owner_id:order.owner_id};
 return {
  mode:order.billing_interval === 'once' ? 'payment' : 'subscription',
  customer_email:email, client_reference_id:order.id, metadata,
  payment_method_types:['card'], allow_promotion_codes:false,
  line_items:[{quantity:1,price_data:{currency:order.currency,unit_amount:order.amount_minor,
   product_data:{name:`[TEST SOKILÉ] ${order.offer_name}`},
   ...(order.billing_interval === 'once' ? {} : {recurring:{interval:order.billing_interval}})}}],
  success_url:RETURN_URL, cancel_url:RETURN_URL,
  ...(order.billing_interval === 'once' ? {payment_intent_data:{metadata}} : {subscription_data:{metadata}}),
 };
}
export function matchesOrder(session, order) {
 return session?.livemode === false && session.id?.startsWith('cs_test_') &&
  (!order.stripe_session_id || order.stripe_session_id === session.id) &&
  session.metadata?.app === 'sokile' && session.metadata?.environment === 'test' &&
  session.metadata?.order_id === order.id && session.metadata?.owner_id === order.owner_id &&
  session.client_reference_id === order.id && session.amount_total === order.amount_minor &&
  session.currency === order.currency && session.mode === (order.billing_interval === 'once' ? 'payment' : 'subscription');
}
export function sessionStatus(session, type) {
 if (session.status === 'complete' && session.payment_status === 'paid') return 'paid';
 if (session.status === 'expired') return 'expired';
 if (type === 'checkout.session.async_payment_failed') return 'failed';
 return 'pending';
}

export function createPaymentsHandler({env, stripeFactory, send = fetch}) {
 return async request => {
  const origin = request.headers.get('origin');
  const cors = allowedOrigin(origin) ? {'Access-Control-Allow-Origin':origin,'Vary':'Origin','Access-Control-Allow-Headers':'authorization, apikey, content-type','Access-Control-Allow-Methods':'POST, OPTIONS'} : {};
  const reply = (body, status = 200) => new Response(JSON.stringify(body),{status,headers:{'Content-Type':'application/json','Cache-Control':'no-store',...cors}});
  if (request.method === 'OPTIONS') return new Response(null,{status:allowedOrigin(origin)?204:403,headers:cors});
  if (request.method !== 'POST') return reply({error:'Méthode non autorisée.'},405);
  const webhook = new URL(request.url).pathname.endsWith('/webhook');
  if (!webhook && origin && !allowedOrigin(origin)) return reply({error:'Origine non autorisée.'},403);
  const key = env('STRIPE_TEST_SECRET_KEY'), signingSecret = env('STRIPE_TEST_WEBHOOK_SECRET');
  const base = env('SUPABASE_URL'), publicKey = env('SUPABASE_ANON_KEY'), serviceKey = env('SUPABASE_SERVICE_ROLE_KEY');
  if (!base || !serviceKey || !publicKey) return reply({error:'Configuration serveur incomplète.'},503);
  const db = async (path, token, body) => {
   const response = await send(`${base}/rest/v1/${path}`,{method:body === undefined ? 'GET' : 'POST',headers:{apikey:token === serviceKey ? serviceKey : publicKey,Authorization:`Bearer ${token}`,'Content-Type':'application/json'},...(body === undefined ? {} : {body:JSON.stringify(body)})});
   if (!response.ok) throw Error('database');
   return response.json();
  };
  const rpc = (name, token, body) => db(`rpc/${name}`,token,body);
  if (webhook) {
   if (!isTestKey(key) || !signingSecret?.startsWith('whsec_')) return reply({error:'Les essais Stripe ne sont pas configurés.'},503);
   const signature = request.headers.get('stripe-signature');
   if (!signature) return reply({error:'Signature manquante.'},400);
   if (Number(request.headers.get('content-length')) > 262144) return reply({error:'Requête trop volumineuse.'},413);
   const raw = await request.text();
   if (raw.length > 262144) return reply({error:'Requête trop volumineuse.'},413);
   const stripe = stripeFactory(key);
   let event;
   try { event = await stripe.verifyEvent(raw,signature,signingSecret); }
   catch { return reply({error:'Signature invalide.'},400); }
   if (event.livemode !== false) return reply({error:'Seuls les événements de test sont acceptés.'},400);
   if (!EVENTS.has(event.type)) return reply({received:true,ignored:true});
   const object = event.data?.object;
   if (object?.metadata?.app !== 'sokile') return reply({received:true,ignored:true});
   if (object?.metadata?.environment !== 'test' || !UUID.test(object?.metadata?.order_id || '') || !object.id?.startsWith('cs_test_')) return reply({error:'Session incompatible.'},400);
   try {
    const orders = await db(`billing_test_orders?id=eq.${object.metadata.order_id}&select=*`,serviceKey);
    if (!orders[0]) return reply({error:'Essai introuvable.'},409);
    // Relit Stripe : les événements anciens ne remplacent pas l’état actuel de la session.
    const session = await stripe.checkout.sessions.retrieve(object.id);
    if (!matchesOrder(session,orders[0])) return reply({error:'Le montant ou la session ne correspond pas à cet essai.'},409);
    await rpc('sokile_billing_record',serviceKey,{p_event_id:event.id,p_event_type:event.type,p_order_id:orders[0].id,p_session_id:session.id,p_status:sessionStatus(session,event.type),p_subscription_id:typeof session.subscription === 'string' ? session.subscription : null});
    return reply({received:true});
   } catch { return reply({error:'Confirmation temporairement indisponible.'},503); }
  }
  const token = request.headers.get('authorization')?.match(/^Bearer (.+)$/i)?.[1];
  if (!token) return reply({error:'Connectez-vous à votre compte administrateur.'},401);
  let user;
  try {
   const response = await send(`${base}/auth/v1/user`,{headers:{apikey:publicKey,Authorization:`Bearer ${token}`}});
   if (!response.ok) return reply({error:'Session expirée. Reconnectez-vous.'},401);
   user = await response.json();
   if (!user.id || !user.email_confirmed_at || await rpc('sokile_billing_admin',token,{}) !== true) return reply({error:'Accès réservé à la gestion.'},403);
  } catch { return reply({error:'La vérification de votre compte est indisponible.'},503); }
  let input;
  try { const raw=await request.text(); if(raw.length>2048) return reply({error:'Requête trop volumineuse.'},413);input=JSON.parse(raw); }
  catch { return reply({error:'Requête invalide.'},400); }
  if (input?.action === 'status') {
   let connected = false;
   if (isTestKey(key)) { try { connected = (await stripeFactory(key).balance.retrieve()).livemode === false; } catch { /* jamais de secret ni erreur Stripe brute dans la réponse */ } }
   return reply({test_only:true,key_configured:!!key,key_valid:isTestKey(key),connected,webhook_configured:!!signingSecret?.startsWith('whsec_')});
  }
  if (input?.action !== 'checkout' || !UUID.test(input.offer_id || '') || !UUID.test(input.request_id || '')) return reply({error:'Choisissez une offre pour cet essai.'},400);
  if (!isTestKey(key) || !signingSecret?.startsWith('whsec_')) return reply({error:'Raccordez le compte Stripe de test et ses confirmations avant de lancer un essai.'},503);
  try {
   const settings = await db('billing_settings?id=eq.true&select=test_enabled',token);
   if (!settings[0]?.test_enabled) return reply({error:'Les essais de paiement sont désactivés.'},409);
   const order = await rpc('sokile_billing_begin',token,{p_offer_id:input.offer_id,p_request_id:input.request_id});
   if (['paid','expired','failed'].includes(order.status)) return reply({error:'Cet essai est terminé. Lancez un nouvel essai.'},409);
   const stripe = stripeFactory(key);
   // Une commande ancienne n’est pas recréée après l’expiration de l’idempotence Stripe.
   if (!order.stripe_session_id && Date.now()-Date.parse(order.created_at)>23*60*60*1000) return reply({error:'Cet essai est trop ancien. Lancez un nouvel essai.'},409);
   const session = order.stripe_session_id ? await stripe.checkout.sessions.retrieve(order.stripe_session_id) : await stripe.checkout.sessions.create(checkoutParameters(order,user.email),{idempotencyKey:`sokile-test-${order.id}`});
   if (!matchesOrder(session,order) || session.status !== 'open' || !session.url || new URL(session.url).origin !== 'https://checkout.stripe.com') return reply({error:'Stripe n’a pas renvoyé de page de test valide.'},502);
   await rpc('sokile_billing_attach',serviceKey,{p_order_id:order.id,p_session_id:session.id});
   return reply({url:session.url,order_id:order.id,test_only:true});
  } catch { return reply({error:'L’essai n’a pas pu être ouvert. Vérifiez le tarif, la connexion Stripe et réessayez dans une minute.'},503); }
 };
}
