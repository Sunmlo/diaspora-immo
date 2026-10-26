import {safeFetch,publicUrl} from '../server/safe-fetch.mjs';
import {extractPage} from '../server/listing-extract.mjs';
const base='https://nhyejaubfxjmmuvetayw.supabase.co';
const recent=new Map();
export default async function handler(req,res){
 res.setHeader('Cache-Control','no-store');
 if(req.method!=='POST')return res.status(405).json({error:'Méthode non autorisée.'});
 try{
  const token=req.headers.authorization,apikey=req.headers.apikey;
  if(!token?.startsWith('Bearer ')||!apikey)return res.status(401).json({error:'Reconnectez-vous pour importer vos annonces.'});
  const auth=await fetch(base+'/auth/v1/user',{headers:{Authorization:token,apikey},signal:AbortSignal.timeout(8000)});
  const user=await auth.json();if(!auth.ok||!user.id||!user.email_confirmed_at)return res.status(401).json({error:'Connectez-vous avec une adresse email confirmée.'});
  const now=Date.now(),usage=recent.get(user.id)||[];const times=usage.filter(t=>t>now-60000);if(times.length>=1200)return res.status(429).json({error:'Veuillez patienter une minute avant de poursuivre.'});recent.set(user.id,[...times,now]);if(recent.size>5000)recent.clear();
  const body=typeof req.body==='string'?JSON.parse(req.body):req.body;
  const url=publicUrl(body?.url).href;
  if(!['discover','detail','photo'].includes(body.action))return res.status(400).json({error:'Action inconnue.'});
  const result=await safeFetch(url,{image:body.action==='photo'});
  if(body.action==='photo'){res.setHeader('Content-Type',result.type);res.setHeader('X-Content-Type-Options','nosniff');return res.status(200).send(result.body);}
  return res.status(200).json(extractPage(result.body.toString('utf8'),result.url));
 }catch(e){return res.status(422).json({error:e.message||'Import indisponible. Utilisez le fichier Excel ou CSV.'});}
}
