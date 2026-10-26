import https from 'node:https';
import {lookup} from 'node:dns/promises';
import ipaddr from 'ipaddr.js';
export function publicUrl(value){
  let u;try{u=new URL(value);}catch{throw Error('Collez un lien HTTPS valide.');}
  if(u.protocol!=='https:'||u.username||u.password||(u.port&&u.port!=='443')||!u.hostname.includes('.')||u.hostname.endsWith('.')||u.href.length>2500)throw Error('Seuls les liens HTTPS publics sont acceptés.');
  u.hash='';return u;
}
export function publicAddress(ip){try{return ipaddr.parse(ip).range()==='unicast';}catch{return false;}}
export async function safeFetch(value,{image=false,redirects=0}={}){
  const u=publicUrl(value);
  if(redirects>4)throw Error('Trop de redirections sur ce site.');
  const addresses=await lookup(u.hostname,{all:true});
  if(!addresses.length||addresses.some(a=>!publicAddress(a.address)))throw Error('Cette adresse ne peut pas être importée.');
  const a=addresses[0],limit=image?4*1024*1024:2*1024*1024;
  const result=await new Promise((resolve,reject)=>{
    const req=https.get(u,{lookup:(_host,opts,cb)=>opts.all?cb(null,[a]):cb(null,a.address,a.family),headers:{'User-Agent':'SokileImport/1.0 (+https://www.sokile.com)','Accept':image?'image/jpeg,image/png,image/webp':'text/html','Accept-Encoding':'identity'}},res=>{
      if([301,302,303,307,308].includes(res.statusCode)){res.resume();return resolve({redirect:res.headers.location});}
      if(res.statusCode!==200){res.resume();return reject(Error('Ce site bloque la récupération ou la page est indisponible. Vous pouvez utiliser l’import Excel/CSV.'));}
      const type=String(res.headers['content-type']||'').split(';')[0];
      if(!(image?['image/jpeg','image/png','image/webp'].includes(type):['text/html','application/xhtml+xml'].includes(type))){res.resume();return reject(Error('Le lien ne correspond pas au contenu attendu.'));}
      const chunks=[];let size=0;
      res.on('data',c=>{size+=c.length;if(size>limit)req.destroy(Error('Contenu trop volumineux pour cet import.'));else chunks.push(c);});
      res.on('end',()=>resolve({body:Buffer.concat(chunks),type,url:u.href}));res.on('error',reject);
    });
    const timer=setTimeout(()=>req.destroy(Error('Le site met trop de temps à répondre. Réessayez avec le lien d’une annonce.')),12000);
    req.on('close',()=>clearTimeout(timer));req.on('error',reject);
  });
  if(result.redirect)return safeFetch(new URL(result.redirect,u).href,{image,redirects:redirects+1});
  if(image){const b=result.body;const valid=result.type==='image/jpeg'?b[0]===255&&b[1]===216&&b[2]===255:result.type==='image/png'?b.subarray(0,8).equals(Buffer.from([137,80,78,71,13,10,26,10])):b.toString('ascii',0,4)==='RIFF'&&b.toString('ascii',8,12)==='WEBP';if(!valid)throw Error('Le fichier récupéré n’est pas une photo valide.');}
  return result;
}
