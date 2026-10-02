export const REQUEST_COUNTRIES=['Bénin','Burkina Faso','Cameroun','Centrafrique','Congo',"Côte d'Ivoire",'Gabon','Mali','Niger','Sénégal','Tchad','Togo'];
export const REQUEST_NATURES={maison:'Maison ou villa',appartement:'Appartement',immeuble:'Immeuble',terrain:'Terrain à bâtir',agricole:'Terrain agricole',commerce:'Local commercial',bureau:'Bureau',entrepot:'Entrepôt',hotel:'Hôtel ou résidence'};
export const REQUEST_DRAFT='sokile-search-request-draft-v1';
export function requestFilters(form){
 const city=String(form.city||'').trim(), budget=Number(form.budget);
 if(!REQUEST_COUNTRIES.includes(form.country))throw Error('Choisissez un pays.');
 if(!['vente','location'].includes(form.transaction)||!REQUEST_NATURES[form.nature])throw Error('Choisissez le type de bien recherché.');
 if(city.length<2||city.length>80||!/^\p{L}[\p{L} .’'-]*$/u.test(city))throw Error('Indiquez uniquement le nom de la ville, sans coordonnées.');
 if(!Number.isFinite(budget)||budget<1000||budget>1e12)throw Error('Indiquez un budget maximum valide en FCFA.');
 if(form.rooms&&!/^[1-5]$/.test(form.rooms))throw Error('Nombre de pièces invalide.');
 return {country:form.country,city,transaction:form.transaction,nature:form.nature,priceMax:Math.round(budget/655.957),...(form.rooms?{rooms:form.rooms}:{})};
}
export function requestSummary(f){return `${REQUEST_NATURES[f.nature]||f.nature} ${f.transaction==='location'?'à louer':'à acheter'} · ${f.city}, ${f.country}`;}
export function requestBudget(f){return `Budget ≈ ${Math.round(Number(f.priceMax)*655.957).toLocaleString('fr-FR')} FCFA${f.transaction==='location'?' / mois':''}${f.rooms?` · ${f.rooms} pièce(s) minimum`:''}`;}
const normalized=x=>String(x||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().trim();
export function requestMatches(f,p){return p.country===f.country&&normalized(p.city)===normalized(f.city)&&p.transaction===f.transaction&&p.nature===f.nature&&p.price_eur!=null&&Number(p.price_eur)<=Number(f.priceMax)&&(!f.rooms||(p.rooms!=null&&Number(p.rooms)>=Number(f.rooms)));}
