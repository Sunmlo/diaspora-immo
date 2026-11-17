export const VERSION='kobes-programmes-20261117-v3';
const UUID=/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
function fail(message,field){const error=new Error(message);error.field=field;throw error;}
const str=(v,max,field)=>{if(typeof v!=='string'||v.length>max)fail('Un texte est invalide ou trop long.',field);return v.trim();};
function num(v,field,{min=0,max=1e12,integer=false}={}){if(v!==null&&(typeof v!=='number'||!Number.isFinite(v)||v<min||v>max||(integer&&!Number.isInteger(v))))fail('Vérifiez cette valeur numérique.',field);return v;}
function option(v,choices,field){if(!choices.includes(v))fail('Choisissez une option valide.',field);return v;}
function url(v,field){if(!v)return;try{const u=new URL(v);if(u.protocol!=='https:'||u.username||u.password)throw Error();}catch{fail('Utilisez un lien HTTPS valide, sans identifiants.',field);}}
export function validateProgrammesPayload(data,listings,version=VERSION){
 if(!data||!UUID.test(data.id)||data.version!==version||data.consent!==true||!Array.isArray(data.entries)||data.entries.length!==listings.length)fail('Vérifiez les programmes et cochez votre autorisation finale.','consent');
 const contact={};for(const [k,max] of Object.entries({name:150,email:254,phone:100})){contact[k]=str(data.contact?.[k],max,'contact-'+k);if(!contact[k])fail('Complétez vos coordonnées.','contact-'+k);}
 if(!/^\S+@\S+\.\S+$/.test(contact.email))fail('Vérifiez votre adresse email.','contact-email');
 const entries=data.entries.map((e,i)=>{
  const d=listings[i],f=k=>d.id+'-'+k;
  if(!e||e.id!==d.id)fail('Ce programme ne correspond pas au dossier.');
  const clean={id:d.id,kind:'new_development',currency:'XOF'};
  clean.status=option(e.status,['approved','corrections','unavailable','pending'],f('status'));
  clean.stage=option(e.stage,['unknown','planned','under_construction','delivered'],f('stage'));
  clean.mediaChoice=option(e.mediaChoice,['unconfirmed','confirmed','replace','none'],f('mediaChoice'));
  for(const [k,max] of Object.entries({title:250,location:250,developer:250,description:6000,delivery:250,equipment:3000,terms:3000,notes:3000,mediaLinks:12000,videoLink:2000,brochureLink:2000}))clean[k]=str(e[k],max,f(k));
  if(!clean.title||!clean.location)fail('Indiquez le nom et la localisation du programme.',f(!clean.title?'title':'location'));
  clean.totalUnits=num(e.totalUnits,f('totalUnits'),{min:1,max:1000000,integer:true});
  const media=clean.mediaLinks.split(/\r?\n/).map(x=>x.trim()).filter(Boolean);if(media.length>20)fail('Ajoutez au maximum 20 liens de photos.',f('mediaLinks'));
  media.forEach(u=>url(u,f('mediaLinks')));url(clean.videoLink,f('videoLink'));url(clean.brochureLink,f('brochureLink'));
  if(!Array.isArray(e.typologies)||!e.typologies.length||e.typologies.length>30)fail('Prévoyez entre 1 et 30 typologies par programme.',f('typologies'));
  clean.typologies=e.typologies.map((t,j)=>{
   const tf=k=>f('type-'+j+'-'+k),out={label:str(t?.label,150,tf('label'))};
   if(!out.label)fail('Nommez chaque typologie (exemple : appartement F3).',tf('label'));
   out.availability=option(t.availability,['unknown','available','reserved','sold_out'],tf('availability'));
   out.priceType=option(t.priceType,['unknown','from','exact'],tf('priceType'));
   for(const k of ['areaMin','areaMax','landMin','landMax','price'])out[k]=num(t[k],tf(k),{min:0.01});
   out.availableLots=num(t.availableLots,tf('availableLots'),{max:1000000,integer:true});
   for(const [a,b] of [['areaMin','areaMax'],['landMin','landMax']])if(out[a]!==null&&out[b]!==null&&out[a]>out[b])fail('La surface maximale doit être supérieure ou égale à la minimale.',tf(b));
   if((out.availability==='available'&&out.availableLots===0)||(['reserved','sold_out'].includes(out.availability)&&out.availableLots!==null&&out.availableLots>0))fail('Le nombre de lots est incohérent avec la disponibilité choisie.',tf('availableLots'));
   if(clean.status==='approved'&&out.availability==='available'&&(out.price===null||out.priceType==='unknown'))fail('Indiquez le prix en FCFA de chaque typologie disponible, ou enregistrez le programme « À compléter ».',tf('price'));
   out.notes=str(t.notes,1500,tf('notes'));return out;
  });
  const knownAvailable=clean.typologies.reduce((n,t)=>n+(t.availableLots??0),0);
  if(clean.totalUnits!==null&&knownAvailable>clean.totalUnits)fail('Les lots disponibles ne peuvent pas dépasser le nombre total de logements du programme.',f('totalUnits'));
  if(clean.status==='approved'){
   if(clean.stage==='unknown')fail('Précisez l’avancement du programme avant validation.',f('stage'));
   if(clean.stage!=='delivered'&&!clean.delivery)fail('Précisez la livraison prévisionnelle (mois, trimestre ou année).',f('delivery'));
   if(!clean.typologies.some(t=>t.availability==='available'))fail('Confirmez au moins une typologie disponible avant validation.',f('typologies'));
   if(clean.mediaChoice==='unconfirmed')fail('Confirmez le choix des visuels.',f('mediaChoice'));
   if(clean.mediaChoice==='confirmed'&&!d.images.length)fail('Indiquez les visuels à utiliser.',f('mediaChoice'));
   if(clean.mediaChoice==='replace'&&!media.length&&!clean.notes)fail('Ajoutez les liens des nouveaux visuels ou leur mode de transmission.',f('mediaLinks'));
  }
  return clean;
 });
 if(entries.every(e=>e.status==='pending'))fail('Indiquez votre choix pour au moins un programme.','programmes');
 return {version,category:'programmes_neufs',consent:true,contact,entries};
}
