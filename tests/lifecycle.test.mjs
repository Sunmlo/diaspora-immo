import test from "node:test";
import assert from "node:assert/strict";
import { addCalendarMonths, publicationMonths, isExpired, alertState } from "../src/lifecycle.mjs";
import { buildDecisionMessage } from "../supabase/functions/notify-admin/moderation.mjs";
import { buildAlertEmail, createAlertsHandler } from "../supabase/functions/search-alerts/handler.mjs";

test("les mois calendaires couvrent fins de mois et années bissextiles",()=>{
  assert.equal(addCalendarMonths("2026-08-31T12:00:00Z",6),"2027-02-28T12:00:00.000Z");
  assert.equal(addCalendarMonths("2024-02-29T12:00:00Z",12),"2025-02-28T12:00:00.000Z");
  assert.equal(publicationMonths({type:"Location"}),6);
  assert.equal(publicationMonths({transaction:"vente",type:"Location"}),12);
});
test("l'expiration intervient à l'échéance et n'écrase pas les autres statuts",()=>{
  const now=Date.parse("2027-03-23T12:00:00Z");
  assert.equal(isExpired({status:"validee",expires_at:"2027-03-23T12:00:00Z"},now),true);
  assert.equal(isExpired({status:"en_attente",expires_at:"2027-03-22T12:00:00Z"},now),false);
  assert.equal(alertState({expires_at:"2027-03-23T12:00:00Z"},now),"Expirée");
  assert.equal(alertState({expires_at:"2027-03-23T12:00:00Z",cancelled_at:"2026-12-01"},now),"Annulée");
});
test("la validation communique durée et échéance sans reprendre un ancien refus",()=>{
  const m=buildDecisionMessage("properties",{status:"validee",transaction:"location",expires_at:"2027-03-23T12:00:00Z",title:"Studio",user_email:"test@example.com",motif_rejet:"Ancien refus"});
  assert.match(m.text,/23\/03\/2027/);assert.match(m.text,/6 mois/);assert.doesNotMatch(m.text,/Ancien refus/);
});
const payload={id:"delivery-1",email:"test@example.com",token:"cancel-token",expires_at:"2027-09-23T00:00:00Z",property:{id:999,title:"Studio\nDakar",city:"Dakar",country:"Sénégal",price_eur:300}};
test("l'alerte contient une adresse de fiche directe et un lien d'annulation",()=>{
  const m=buildAlertEmail(payload);assert.match(m.text,/\/annonce\/999/);assert.match(m.text,/annuler_alerte=cancel-token/);assert.equal(m.subject.includes("\n"),false);
});
const env=key=>({WEBHOOK_SECRET:"test-secret",SUPABASE_URL:"https://db.example",SUPABASE_SERVICE_ROLE_KEY:"test-service",RESEND_API_KEY:"test-mail"})[key];
const request=()=>new Request("https://worker.example",{method:"POST",headers:{"x-webhook-secret":"test-secret"}});
const response=(body,status=200)=>new Response(JSON.stringify(body),{status});
test("aucun email n'est envoyé sans authentification de l'ordonnanceur",async()=>{
  let count=0;const h=createAlertsHandler({env,send:async()=>{count++;return response({});}});
  assert.equal((await h(new Request("https://worker.example",{method:"POST"}))).status,401);assert.equal(count,0);
});
test("une alerte annulée après mise en file est ignorée avant l'envoi",async()=>{
  let sent=0;const h=createAlertsHandler({env,send:async url=>{
    if(url.endsWith("sokile_alerts_available"))return response(true);
    if(url.endsWith("sokile_claim_alert_deliveries"))return response([{id:"d",lease_token:"lease"}]);
    if(url.endsWith("sokile_alert_delivery_payload"))return response(null);
    sent++;return response({});
  }});assert.deepEqual(await (await h(request())).json(),{sent:0,skipped:1,failed:0});assert.equal(sent,0);
});
test("un refus du fournisseur est enregistré en échec, jamais en succès",async()=>{
  let result;const h=createAlertsHandler({env,send:async(url,options)=>{
    if(url.endsWith("sokile_alerts_available"))return response(true);
    if(url.endsWith("sokile_claim_alert_deliveries"))return response([{id:"d",lease_token:"lease"}]);
    if(url.endsWith("sokile_alert_delivery_payload"))return response(payload);
    if(url.endsWith("sokile_finish_alert_delivery")){result=JSON.parse(options.body);return response(true);}
    return response({error:"rate limit"},429);
  }});assert.equal((await h(request())).status,502);assert.equal(result.p_provider_id,null);assert.match(result.p_error,/429/);
});
test("une reprise emploie la même clé anti-doublon et valide l'accusé fournisseur",async()=>{
  const keys=[];let done;const h=createAlertsHandler({env,send:async(url,options)=>{
    if(url.endsWith("sokile_alerts_available"))return response(true);
    if(url.endsWith("sokile_claim_alert_deliveries"))return response([{id:"d",lease_token:"lease"}]);
    if(url.endsWith("sokile_alert_delivery_payload"))return response(payload);
    if(url.endsWith("sokile_finish_alert_delivery")){done=JSON.parse(options.body);return response(true);}
    keys.push(options.headers["Idempotency-Key"]);return response({id:"mail-1"});
  }});await h(request());await h(request());assert.deepEqual(keys,["sokile-search-d","sokile-search-d"]);assert.equal(done.p_provider_id,"mail-1");
});
