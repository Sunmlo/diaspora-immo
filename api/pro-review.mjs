import {createHash,randomBytes} from 'node:crypto';
import {createClient} from '@supabase/supabase-js';
import {cleanReviewDraft,reviewDraftError,invitationStatus} from '../src/pro-review.mjs';

const base = process.env.SUPABASE_URL || 'https://nhyejaubfxjmmuvetayw.supabase.co';
const secret = process.env.SUPABASE_SERVICE_ROLE_KEY;
const publicKey = process.env.SUPABASE_ANON_KEY;
const ADMIN_EMAIL = 'contact@sokile.com';
const TOKEN_PATTERN = /^[a-f0-9]{64}$/;
const EMAIL_PATTERN = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;

const fail = (res,status,message) => res.status(status).json({error:message});
const hash = token => createHash('sha256').update(token).digest('hex');
const isUuid = value => /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(String(value||''));
const rate = new Map();
function limited(ip) {
 const now=Date.now(), prior=(rate.get(ip)||[]).filter(t=>t>now-60000);
 if(rate.size>5000)rate.clear();
 rate.set(ip,[...prior,now]);
 return prior.length>=40;
}
async function verifiedAdmin(req) {
 const bearer=String(req.headers.authorization||'');
 if(!bearer.startsWith('Bearer ') || !publicKey)return false;
 const response=await fetch(base+'/auth/v1/user',{headers:{Authorization:bearer,apikey:publicKey},signal:AbortSignal.timeout(8000)});
 if(!response.ok)return false;
 const user=await response.json();
 return !!(user.id && user.email_confirmed_at && String(user.email).toLowerCase()===ADMIN_EMAIL);
}
function publicView(row) {
 return {status:invitationStatus(row),draft:row.draft,expires_at:row.expires_at,submitted_at:row.submitted_at};
}
export default async function handler(req,res) {
 res.setHeader('Cache-Control','no-store');
 res.setHeader('X-Content-Type-Options','nosniff');
 res.setHeader('Referrer-Policy','no-referrer');
 if(req.method!=='POST')return fail(res,405,'Méthode non autorisée.');
 if(!secret)return fail(res,503,'Configuration de validation indisponible.');
 const ip=String(req.headers['x-forwarded-for']||req.socket?.remoteAddress||'unknown').split(',')[0].trim();
 if(limited(ip))return fail(res,429,'Trop de tentatives. Réessayez plus tard.');
 const data=typeof req.body==='string'?JSON.parse(req.body):req.body;
 const action=data?.action;
 const db=createClient(base,secret,{auth:{autoRefreshToken:false,persistSession:false}});
 try {
  if(['create','list','revoke'].includes(action)){
   if(!await verifiedAdmin(req))return fail(res,403,'Accès réservé à l’administration.');
   if(action==='list') {
    const {data:rows,error}=await db.from('professional_review_invites')
      .select('id,agency_id,recipient_email,status,expires_at,submitted_at,created_at,draft')
      .order('created_at',{ascending:false}).limit(100);
    if(error)throw error;
    return res.status(200).json({invites:rows.map(row=>({...row,status:invitationStatus(row)}))});
   }
   if(action==='revoke'){
    if(!isUuid(data.id))return fail(res,400,'Invitation invalide.');
    const {error}=await db.from('professional_review_invites').update({status:'revoked',updated_at:new Date().toISOString()}).eq('id',data.id);
    if(error)throw error;
    return res.status(200).json({ok:true});
   }
   if(!isUuid(data.agencyId)||!EMAIL_PATTERN.test(String(data.recipientEmail||'')))return fail(res,400,'Agence ou email invalide.');
   const {data:agency,error:ae}=await db.from('assisted_agencies')
     .select('id,business_name,country,phone,website,description')
     .eq('id',data.agencyId).single();
   if(ae||!agency)return fail(res,404,'Agence accompagnée introuvable.');
   const draft=cleanReviewDraft(agency);
   const token=randomBytes(32).toString('hex');
   const expires_at=new Date(Date.now()+7*86400000).toISOString();
   const {data:created,error}=await db.from('professional_review_invites').insert({
      agency_id:agency.id,token_hash:hash(token),
      recipient_email:String(data.recipientEmail).trim().toLowerCase(),
      draft,original:draft,expires_at
   }).select('id,expires_at').single();
   if(error)throw error;
   // Token is returned ONLY once. It is not stored in cleartext and is not emailed.
   return res.status(200).json({id:created.id,token,expires_at:created.expires_at});
  }
  if(!['read','save','submit'].includes(action))return fail(res,400,'Action inconnue.');
  const token=String(data.token||'');
  if(!TOKEN_PATTERN.test(token))return fail(res,404,'Lien invalide.');
  const {data:row,error}=await db.from('professional_review_invites')
     .select('id,draft,status,expires_at,submitted_at,updated_at').eq('token_hash',hash(token)).maybeSingle();
  if(error)throw error;
  if(!row)return fail(res,404,'Lien invalide.');
  if(action==='read')return res.status(200).json(publicView(row));
  if(invitationStatus(row)!=='pending')return fail(res,409,'Cette invitation ne peut plus être modifiée.');
  const draft=cleanReviewDraft(data.draft);
  if(action==='submit'){
   if(data.consent!==true)return fail(res,422,'Confirmez votre autorisation de représentation.');
   const validation=reviewDraftError(draft);
   if(validation)return fail(res,422,validation);
  }
  // Atomic optimistic check: a concurrent submission cannot be silently overwritten.
  const update={draft,updated_at:new Date().toISOString()};
  if(action==='submit'){update.status='submitted';update.submitted_at=new Date().toISOString();}
  const {data:updated,error:ue}=await db.from('professional_review_invites').update(update)
    .eq('id',row.id).eq('status','pending').eq('updated_at',row.updated_at)
    .select('id,draft,status,expires_at,submitted_at').maybeSingle();
  if(ue)throw ue;
  if(!updated)return fail(res,409,'La fiche a été modifiée ailleurs. Rechargez-la avant de recommencer.');
  // No modification to assisted_agencies or public listings: requires manual admin review.
  return res.status(200).json(publicView(updated));
 }catch(e){
   console.error('professional review failure',e?.code||e?.name||'unknown');
   return fail(res,500,'Opération indisponible. Contactez Sokilé.');
 }
}
