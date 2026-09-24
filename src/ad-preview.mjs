export const ROTATION_MS = 8000;
export const DEMO_ADS = Object.freeze([
  {name:'Agence Horizon',title:'Votre prochain chez-vous commence ici.',text:'Vente, location et accompagnement immobilier.',theme:'forest',initials:'AH'},
  {name:'Résidences Lumière',title:'Un nouveau lieu pour votre nouvelle vie.',text:'Découvrez une résidence imaginée pour votre quotidien.',theme:'terra',initials:'RL'},
  {name:'Atelier Habitat',title:'Des idées qui prennent forme.',text:'Architecture et aménagement pour vos projets.',theme:'gold',initials:'AH'},
]);
export const nextAdIndex=(index,count)=>count>0?(index+1)%count:0;
export const previewOffer=search=>{
  const id=new URLSearchParams(search).get('apercu_pub');
  return ['spotlight','visibility','reach'].includes(id)?id:null;
};
export const previewHref=id=>`/?tab=${id==='spotlight'?'prestataires':'accueil'}&apercu_pub=${id}#${id==='spotlight'?'apercu-fiche':id==='visibility'?'apercu-encart':'apercu-banniere'}`;
