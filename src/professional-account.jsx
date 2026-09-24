import './professional-account.css';

export function ProfessionalActions({onListing,onProgram,onDirectory,onAdvertising}) {
  const actions=[
    {title:'Publier une annonce',text:'Proposez un bien à vendre ou à louer.',onClick:onListing,primary:true},
    {title:'Présenter un programme neuf',text:'Présentez une résidence et ses logements.',onClick:onProgram},
    {title:'Rejoindre l’annuaire',text:'Faites connaître votre agence ou votre activité.',onClick:onDirectory},
    {title:'Publicité et mise en lumière',text:'Consultez les tarifs. Options payantes pas encore ouvertes.',onClick:onAdvertising},
  ];
  return <section className="pro-workspace" aria-label="Actions professionnelles">
    <h2>Développez votre activité sur Sokilé</h2>
    <p>Un seul compte pour vos biens, vos programmes, votre fiche professionnelle et vos demandes publicitaires.</p>
    <div className="pro-actions">{actions.map(a=><button key={a.title} type="button" className={a.primary?'pro-action pro-action-primary':'pro-action'} onClick={a.onClick}><strong>{a.title}<span aria-hidden="true"> →</span></strong><span>{a.text}</span></button>)}</div>
    <p className="pro-review-note">Vos annonces, programmes et fiches annuaire sont soumis à validation. Le référencement normal reste gratuit. La publicité et la mise en avant seront payantes à leur ouverture ; aucun achat n’est possible pour le moment.</p>
  </section>;
}

export function PersonalAccountTools({professional,children}) {
  return professional?<details className="pro-personal-tools"><summary>Mes favoris et mes alertes</summary><div>{children}</div></details>:<div style={{display:'grid',gap:7}}>{children}</div>;
}
