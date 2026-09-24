// Public preview only. No checkout, reservation or campaign activation is exposed.
export const PAID_SERVICES = Object.freeze({status:'not_open',message:'Fonctionnalité non ouverte pour le moment.'});
export const PAID_OFFERS = Object.freeze([
  Object.freeze({id:'spotlight',name:'Mise en lumière',monthly:10000,kind:'Fiche professionnelle',description:'Mise en avant de votre fiche dans le catalogue des professionnels, parmi les fiches sponsorisées. Le référencement normal reste gratuit.'}),
  Object.freeze({id:'visibility',name:'Visibilité',monthly:25000,kind:'Publicité',description:'Un encart publicitaire sur la page d’accueil, sous les pays couverts, pour présenter votre activité ou votre projet.'}),
  Object.freeze({id:'reach',name:'Rayonnement',monthly:50000,kind:'Publicité',description:'Une bannière dans la partie haute de l’accueil et un encart sous les pays couverts.'}),
]);
export function offerPrice(id,days){
  const offer=PAID_OFFERS.find(o=>o.id===id);
  if(!offer||![30,90].includes(days))throw new Error('Formule ou durée inconnue.');
  return offer.monthly*(days===90?2.7:1);
}
export const formatCfa=value=>`${new Intl.NumberFormat('fr-FR').format(value)} FCFA`;
