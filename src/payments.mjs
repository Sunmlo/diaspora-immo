export const OFFER_CATEGORIES={agence:'Agences',promoteur:'Promoteurs',publicite:'Publicité',visibilite:'Mise en avant'};
export const BILLING_INTERVALS={once:'Paiement ponctuel',month:'Chaque mois',year:'Chaque année'};
export const ORDER_STATUS={created:'À démarrer',pending:'En attente de confirmation',paid:'Test réussi',expired:'Session expirée',failed:'Test échoué'};
export function amountToMinor(value,currency){
 if(!['eur','xof','xaf'].includes(currency))throw Error('Choisissez une devise.');
 const text=String(value??'').trim().replace(/[ \u00a0\u202f]/g,'').replace(',','.');
 if(!text)return null;
 const decimals=currency==='eur'?2:0;
 if(!(decimals?/^\d+(\.\d{1,2})?$/:/^\d+$/).test(text))throw Error(decimals?'Saisissez un montant avec deux décimales maximum.':'Le franc CFA se saisit sans décimales.');
 const [whole,fraction='']=text.split('.');
 const minor=Number(whole)*(decimals?100:1)+(decimals?Number(fraction.padEnd(2,'0')):0);
 if(!Number.isSafeInteger(minor)||minor<1||minor>99999999)throw Error('Saisissez un tarif positif dans la limite autorisée.');
 return minor;
}
export const amountInput=offer=>offer.amount_minor==null?'':String(offer.amount_minor/(offer.currency==='eur'?100:1));
export const paymentAmount=(minor,currency)=>minor==null?'Tarif à définir':new Intl.NumberFormat('fr-FR',{style:'currency',currency:currency.toUpperCase()}).format(minor/(currency==='eur'?100:1));
export function quotaInput(value){
 if(String(value??'').trim()==='')return null;
 if(!/^\d+$/.test(String(value))||Number(value)<1||Number(value)>100000)throw Error('Les quotas doivent être des nombres entiers positifs, ou rester vides.');
 return Number(value);
}
export function paymentGateway(base,publicKey){
 return async(token,input)=>{
  try{
   const response=await fetch(`${base}/functions/v1/payments-test`,{method:'POST',headers:{'Content-Type':'application/json',apikey:publicKey,Authorization:`Bearer ${token}`},body:JSON.stringify(input)});
   const data=await response.json().catch(()=>null);
   return response.ok?{ok:true,data}:{ok:false,motif:data?.error||'Le service de paiement de test est indisponible.'};
  }catch{return {ok:false,motif:'Connexion impossible au service de paiement. Réessayez.'};}
 };
}
