export const individualNeeds = role => [
 {code:'right',label:'Justificatif du lien avec le bien'},
 ...(role==='Représentant du propriétaire'?[{code:'mandate',label:'Autorisation ou mandat du titulaire des droits'}]:[]),
 {code:'extra',label:'Complément demandé par Sokilé',optional:true}
];
export function individualError(f,role){
 if(!['Propriétaire','Représentant du propriétaire'].includes(role))return 'Précisez votre rôle dans l’annonce.';
 if(!f.holder_name?.trim()||!f.basis?.trim()||!f.situation)return 'Précisez le titulaire, votre lien avec le bien et sa situation.';
 if(!f.consent)return 'Confirmez l’exactitude des pièces et votre autorisation.';
 for(const n of individualNeeds(role)){const d=f.documents?.[n.code];if(n.optional&&!d?.path)continue;if(!d?.path||!d.reference?.trim()||!d.issuer?.trim())return `Complétez : ${n.label} (fichier, référence et émetteur).`;if(!d.no_expiry&&!d.expires_on)return 'Précisez la validité de chaque justificatif.';if(d.expires_on&&d.expires_on<new Date().toISOString().slice(0,10))return 'Un justificatif est expiré.';}
 return '';
}
export function individualApi(base,key,files){
 const call=async(path,user,method='GET',body)=>{const r=await fetch(`${base}/rest/v1/${path}`,{method,headers:{apikey:key,Authorization:`Bearer ${user.token}`,'Content-Type':'application/json',Prefer:'return=representation'},...(body?{body:JSON.stringify(body)}:{})});const d=await r.json().catch(()=>null);if(!r.ok)throw Error(d?.message||'Le dossier n’a pas pu être enregistré.');return d;};
 return {...files,load:(u,id)=>call(`individual_verifications?property_id=eq.${encodeURIComponent(id)}&select=*`,u),save:(u,p,f)=>call(`individual_verifications${f.id?'?id=eq.'+f.id:''}`,u,f.id?'PATCH':'POST',{property_id:p.id,owner_id:u.id,holder_name:f.holder_name.trim(),basis:f.basis.trim(),situation:f.situation,documents:f.documents,consent_at:new Date().toISOString()}),review:(u,id,decision)=>call('rpc/sokile_review_individual',u,'POST',{p_id:id,...decision})};
}
