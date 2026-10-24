import {propertyTransaction} from './form-fields.mjs';
export function listingPrice(p,currency='XOF'){
 const amount=currency==='EUR'?p.price_eur:p.price;
 const formatted=new Intl.NumberFormat('fr-FR').format(amount||0)+(currency==='EUR'?' €':' FCFA');
 const period=propertyTransaction(p)==='location'?(p.details?.rent_period==='a_confirmer'?' · périodicité à confirmer':' / mois'):'';
 return (p.details?.price_from?'À partir de ':'')+formatted+period;
}
