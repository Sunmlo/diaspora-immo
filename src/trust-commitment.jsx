import './trust-commitment.css';

export function TrustCommitment(){
 return <section className="sok-trust" aria-labelledby="sok-trust-title">
  <div className="sok-trust-heading"><div><span className="sok-trust-eyebrow">L’engagement Sokilé</span><h2 id="sok-trust-title">La confiance commence par des vérifications.</h2></div><a href="/verification-professionnels">Voir comment nous contrôlons <span aria-hidden="true">↗</span></a></div>
  <div className="sok-trust-points">
   <div><span aria-hidden="true">01</span><h3>Des annonces modérées</h3><p>Les annonces sont examinées avant leur publication.</p></div>
   <div><span aria-hidden="true">02</span><h3>Des justificatifs examinés</h3><p>Un justificatif professionnel pour l’annuaire, des pièces adaptées pour les annonces.</p></div>
   <div><span aria-hidden="true">03</span><h3>Une méthode transparente</h3><p>Nous expliquons ce qui est contrôlé, les compléments possibles et les limites du contrôle.</p></div>
  </div>
  <p className="sok-trust-scope">Un examen documentaire avant publication, qui ne remplace pas les vérifications nécessaires avant une transaction. Les exemples de démonstration sont signalés.</p>
 </section>;
}
