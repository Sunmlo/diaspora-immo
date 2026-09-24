import {useState} from 'react';
import {PAID_SERVICES,PAID_OFFERS,offerPrice,formatCfa} from './paid-offers.mjs';
import './paid-offers.css';

export function PaidOffers(){
  const [days,setDays]=useState(30);
  const [selected,setSelected]=useState(null);
  return <section className="paid-offers" aria-label="Tarifs des options de visibilité">
    <div className="paid-notice"><strong>Options payantes — ouverture à venir</strong><p>Consultez les formules et leurs tarifs. Pendant cette phase de test, ces options ne peuvent pas être achetées ni réservées. Aucun paiement n’est possible.</p></div>
    <p>Le dépôt d’annonces et le référencement normal dans le catalogue des professionnels restent gratuits. La mise en avant et la publicité sont facultatives.</p>
    <label className="paid-duration">Durée envisagée<select value={days} onChange={e=>{setDays(Number(e.target.value));setSelected(null);}}><option value={30}>30 jours</option><option value={90}>90 jours · remise de 10 %</option></select></label>
    <div className="paid-grid">{PAID_OFFERS.map(offer=><article className="paid-card" key={offer.id}>
      <span className="paid-kind">{offer.kind}</span><h3>{offer.name}</h3>
      <p className="paid-price">{formatCfa(offerPrice(offer.id,days))}<span> pour {days} jours</span></p>
      <p>{offer.description}</p>
      <button type="button" onClick={()=>setSelected(offer.id)} aria-expanded={selected===offer.id} aria-controls={`availability-${offer.id}`}>Consulter la disponibilité</button>
      <div id={`availability-${offer.id}`} role="status">{selected===offer.id&&<p className="paid-unavailable"><strong>{PAID_SERVICES.message}</strong><br/>Cette formule sera proposée à l’ouverture des services payants. Aucune commande n’a été créée.</p>}</div>
    </article>)}</div>
    <p className="paid-terms">Tarifs prévus à l’ouverture, en francs CFA (XOF ou XAF selon le pays). Emplacements partagés en rotation, sans exclusivité ni garantie de contacts. La durée commencera à la mise en ligne effective, après validation du contenu. Aucun renouvellement automatique.</p>
  </section>;
}
