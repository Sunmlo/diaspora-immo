export const PROGRAM_COUNTRIES=["Bénin","Burkina Faso","Côte d'Ivoire","Mali","Niger","Sénégal","Togo","Cameroun","Centrafrique","Congo","Gabon","Tchad"];
export const PROGRAM_STAGES={sur_plan:"Sur plan",construction:"En construction",livre:"Livré"};
export const UNIT_STATES={disponible:"Disponible",reserve:"Réservé",vendu:"Vendu"};
export const PROGRAM_STATES={en_attente:"En attente",validee:"Publié",refusee:"Refusé",modifications_demandees:"Précisions demandées",archive:"Archivé"};
export const IMAGE_KINDS={photo:"Photo",perspective:"Perspective non contractuelle",chantier:"Photo du chantier"};
export const programDate=v=>v?new Date(v).toLocaleDateString("fr-FR",{timeZone:"UTC"}):"";
export const fcfa=v=>v==null||v===""?"Prix sur demande":`${Number(v).toLocaleString("fr-FR")} FCFA`;
export const euros=v=>v==null||v===""?"":`≈ ${Math.round(Number(v)/655.957).toLocaleString("fr-FR")} €`;
export const programDelivery=p=>p.stage==="livre"?"Programme livré":p.delivery_quarter&&p.delivery_year?`Livraison prévisionnelle · T${p.delivery_quarter} ${p.delivery_year}`:"Livraison à préciser";
export function safeProgramUrl(value){try{const u=new URL(value);return u.protocol==="https:"&&!u.username&&!u.password?u.href:"";}catch{return "";}}
export function programState(p,now=Date.now()){return p.status==="validee"&&Date.parse(p.expires_at)<=now?"Expiré":PROGRAM_STATES[p.status]||p.status;}
export function inventoryStale(p,now=Date.now()){return now-Date.parse(p.inventory_updated_at)>=90*86400000;}
export function emptyUnit(){return {id:crypto.randomUUID(),reference:"",nature:"appartement",rooms:2,surface:"",price_fcfa:"",floor:"",outdoor:"",plan_url:"",availability:"disponible"};}
export function validateProgram(p,units){
 if(!p.title?.trim()||!p.developer_name?.trim()||!p.city?.trim()||!p.country)return "Renseignez le programme, le promoteur, le pays et la ville.";
 if((p.description||"").trim().length<80)return "Présentez le programme en au moins 80 caractères.";
 if(!p.phone||p.phone.trim().length<6)return "Indiquez un numéro de contact avec son indicatif pays.";
 if(p.stage!=="livre"&&(!p.delivery_quarter||!p.delivery_year))return "Précisez le trimestre et l’année de livraison prévisionnelle.";
 if(!p.gallery?.length)return "Ajoutez au moins une photo ou une perspective du programme.";
 if(!units.length)return "Ajoutez au moins un logement.";
 const refs=new Set();
 for(const u of units){const ref=u.reference.trim().toLowerCase();if(!ref||refs.has(ref))return "Chaque logement doit avoir une référence unique.";refs.add(ref);if(!(Number(u.surface)>0)||!(Number(u.rooms)>=1))return "Précisez la surface et le nombre de pièces de chaque logement.";if(u.price_fcfa!==""&&u.price_fcfa!=null&&!(Number(u.price_fcfa)>0))return "Renseignez un prix positif ou laissez le prix sur demande.";if(u.plan_url&&!safeProgramUrl(u.plan_url))return "Le lien du plan doit commencer par https://.";}
 if([p.brochure_url,p.website].some(v=>v&&!safeProgramUrl(v)))return "Les liens doivent commencer par https://.";
 return "";
}
