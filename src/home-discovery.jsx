import './home-discovery.css';

function DiscoveryIcon({kind}){
  const paths={
    buy:<><path d="m3 11 9-8 9 8M5 10v11h14V10M9 21v-7h6v7"/></>,
    rent:<><circle cx="8" cy="9" r="5"/><path d="m12 13 8 8m-5-5 3-3m0 6 3-3"/></>,
    land:<><path d="m3 8 7-4 11 4v12l-11-4-7 4V8Zm7-4v12M3 8l18 12M16 3v8"/></>,
    building:<><path d="M5 21V3h14v18M3 21h18M9 7h1m4 0h1M9 11h1m4 0h1M9 15h1m4 0h1M10 21v-3h4v3"/></>,
    shop:<><path d="M4 10v11h16V10M3 10l2-7h14l2 7M3 10c0 4 6 4 6 0 0 4 6 4 6 0 0 4 6 4 6 0M9 21v-6h6v6"/></>,
    new:<><path d="M4 21V9h9v12M13 21V3h7v18M7 13h3m-3 4h3m6-10h1m-1 4h1M2 21h20"/></>,
    pro:<><circle cx="12" cy="7" r="4"/><path d="M4 21v-3a8 8 0 0 1 16 0v3M8 16l4 4 4-4"/></>,
    guide:<><path d="M12 5C8 2 4 3 2 4v16c3-2 7-2 10 0 3-2 7-2 10 0V4c-2-1-6-2-10 1Zm0 0v15"/></>,
  };
  return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{paths[kind]}</svg>;
}

export function HomeDiscovery({onBrowse,onPrograms,onProfessionals,onGuides}){
  const choices=[
    ['buy','Acheter','vente','Tous'],['rent','Louer','location','Tous'],
    ['land','Terrains','tous','terrain'],['building','Immeubles','tous','immeuble'],
    ['shop','Locaux pro','tous','commerce'],['new','Programmes neufs'],
  ];
  return <section className="home-discovery" aria-label="Explorer Sokilé">
    <div className="discovery-heading"><h2>Quel est votre projet ?</h2><span>Les bons accès pour avancer</span></div>
    <nav className="discovery-categories" aria-label="Rechercher par type de projet">{choices.map(([kind,label,transaction,nature])=><button type="button" key={kind} onClick={()=>kind==='new'?onPrograms():onBrowse(transaction,nature)}><span className="discovery-icon"><DiscoveryIcon kind={kind}/></span><span>{label}</span><span className="discovery-arrow" aria-hidden="true">↗</span></button>)}</nav>
    <div className="discovery-support">
      <button type="button" onClick={onProfessionals}><span className="discovery-support-icon"><DiscoveryIcon kind="pro"/></span><span><strong>Trouvez le bon professionnel</strong><small>Agences, notaires, architectes… près de votre projet.</small></span><span aria-hidden="true">→</span></button>
      <button type="button" onClick={onGuides}><span className="discovery-support-icon"><DiscoveryIcon kind="guide"/></span><span><strong>Préparez votre projet</strong><small>Des guides pratiques pour faire les bons choix.</small></span><span aria-hidden="true">→</span></button>
    </div>
  </section>;
}
