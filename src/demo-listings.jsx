import { useEffect, useRef, useState } from "react";
import "./demo-listings.css";

// Editorial examples only: never merge these into properties, search or alerts.
const EXAMPLES = [
  {
    id: "demo-location", kind: "Location", title: "Un appartement lumineux avec balcon",
    place: "Exemple à Dakar · Sénégal", price: "300 000 FCFA", period: "/ mois",
    photo: "https://images.unsplash.com/photo-1600210492486-724fe5c67fb0?w=1200&q=82",
    alt: "Photo d’illustration : salon lumineux avec canapé et grandes fenêtres",
    features: ["80 m² habitables", "3 pièces", "2 chambres"],
    description: "Imaginez votre annonce ici : un appartement avec un séjour lumineux, deux chambres, une cuisine et un balcon. Une description précise permet aux visiteurs de comprendre l’agencement et de préparer leurs questions avant une visite.",
    equipment: ["Balcon", "Cuisine équipée", "Climatisation", "Meublé"],
    conditionsTitle: "Exemple de conditions de location",
    conditions: [["Loyer mensuel", "300 000 FCFA"], ["Charges mensuelles", "20 000 FCFA en supplément"], ["Dépôt de garantie", "600 000 FCFA (2 mois de loyer)"], ["Loyer d’avance", "1 mois"], ["Ameublement", "Meublé"]],
    hint: "Pour une location, précisez la périodicité du loyer, les charges et les conditions d’entrée lorsqu’elles sont connues.",
  },
  {
    id: "demo-terrain", kind: "Vente de terrain", title: "Un terrain pour imaginer votre projet",
    place: "Exemple à Yaoundé · Cameroun", price: "12 000 000 FCFA", period: "",
    photo: "https://images.unsplash.com/photo-1500382017468-9049fed747ef?w=1200&q=82",
    alt: "Photo d’illustration : paysage de champs ensoleillés",
    features: ["500 m² de terrain", "Parcelle non bâtie"],
    description: "Cet exemple montre comment présenter un terrain : sa surface, son environnement, son accès et les aménagements existants. Pour votre propre annonce, décrivez uniquement les caractéristiques que vous connaissez et indiquez les points à vérifier lors de la visite.",
    equipment: ["Terrain non bâti", "Accès par piste"],
    conditionsTitle: "Exemple d’informations de vente",
    conditions: [["Prix total demandé", "12 000 000 FCFA"], ["Surface de la parcelle", "500 m²"], ["Raccordements", "Non réalisés"], ["Clôture", "Non clôturé"]],
    hint: "Pour un terrain, présentez la surface, les accès et les raccordements. La constructibilité et la situation foncière doivent être vérifiées pour chaque bien réel.",
  },
  {
    id: "demo-maison", kind: "Vente de maison", title: "Une maison familiale avec jardin",
    place: "Exemple à Abidjan · Côte d’Ivoire", price: "65 000 000 FCFA", period: "",
    photo: "https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=1200&q=82",
    alt: "Photo d’illustration : maison contemporaine entourée d’un jardin",
    features: ["140 m² habitables", "4 pièces", "3 chambres"],
    description: "Cette fiche illustre la présentation d’une maison à vendre : un séjour, trois chambres, deux salles d’eau et un jardin sur une parcelle de 400 m². Dans votre annonce, détaillez les volumes, l’état du bien et les espaces extérieurs pour aider les visiteurs à se projeter.",
    equipment: ["Jardin", "Terrasse", "Stationnement"],
    conditionsTitle: "Exemple d’informations de vente",
    conditions: [["Prix total demandé", "65 000 000 FCFA"], ["Surface habitable", "140 m²"], ["Surface du terrain", "400 m²"], ["Salles d’eau", "2"], ["État du bien", "Bon état"]],
    hint: "Pour une maison, distinguez la surface habitable de celle du terrain et décrivez l’état général ainsi que les équipements.",
  },
];

const NOTICE = "DÉMONSTRATION — Bien fictif, non disponible";

function Illustration({ example, large = false }) {
  const [failed, setFailed] = useState(false);
  return <div className={`sok-demo-picture${large ? " sok-demo-picture-large" : ""}`}>
    {!failed ? <img src={example.photo} alt={example.alt} loading={large ? "eager" : "lazy"} decoding="async" onError={() => setFailed(true)} /> : <span className="sok-demo-photo-fallback">Exemple de présentation · {example.kind}</span>}
    <span className="sok-demo-photo-label">Photo d’illustration</span>
  </div>;
}

function DemoDetails({ example, onClose, onPublish }) {
  const dialog = useRef(null);
  useEffect(() => {
    const el = dialog.current;
    const previous = document.activeElement;
    const oldOverflow = document.body.style.overflow;
    el.showModal();
    document.body.style.overflow = "hidden";
    return () => {
      el.close();
      document.body.style.overflow = oldOverflow;
      if (previous?.isConnected) previous.focus();
    };
  }, []);

  return <dialog ref={dialog} className="sok-demo-dialog" aria-labelledby="sok-demo-detail-title" aria-describedby="sok-demo-detail-notice" onCancel={onClose} onClick={event => { if (event.target === event.currentTarget) onClose(); }}>
    <div className="sok-demo-dialog-top">
      <span id="sok-demo-detail-notice">{NOTICE}</span>
      <button type="button" autoFocus onClick={onClose} aria-label="Fermer la démonstration">Fermer <span aria-hidden="true">×</span></button>
    </div>
    <div className="sok-demo-dialog-content">
      <Illustration example={example} large />
      <div className="sok-demo-detail-heading">
        <span className="sok-demo-kicker">{example.kind} · Exemple de fiche</span>
        <h2 id="sok-demo-detail-title">{example.title}</h2>
        <p>{example.place} · Localisation fictive</p>
        <div className="sok-demo-price">{example.price} <small>{example.period}</small></div>
        <p className="sok-demo-price-note">Prix fictif, sans valeur d’estimation.</p>
      </div>
      <ul className="sok-demo-features" aria-label="Caractéristiques de l’exemple">{example.features.map(item => <li key={item}>{item}</li>)}</ul>
      <div className="sok-demo-detail-columns">
        <section>
          <h3>Description de l’exemple</h3>
          <p>{example.description}</p>
          <h3>Caractéristiques illustrées</h3>
          <ul className="sok-demo-equipment">{example.equipment.map(item => <li key={item}>{item}</li>)}</ul>
          <p className="sok-demo-help">{example.hint}</p>
        </section>
        <section>
          <h3>{example.conditionsTitle}</h3>
          <dl className="sok-demo-conditions">{example.conditions.map(([label, value]) => <div key={label}><dt>{label}</dt><dd>{value}</dd></div>)}</dl>
        </section>
      </div>
      <p className="sok-demo-disclaimer">Ce bien n’existe pas à la vente ou à la location. Les photos d’illustration (Unsplash) ne représentent pas un bien disponible aux caractéristiques ou à l’emplacement indiqués. Aucun contact ni demande de visite n’est possible pour cette démonstration.</p>
    </div>
    <div className="sok-demo-dialog-bottom">
      <span>À votre tour de présenter votre bien.</span>
      <button type="button" className="sok-demo-publish" onClick={onPublish}>Publier mon bien gratuitement <span aria-hidden="true">→</span></button>
    </div>
  </dialog>;
}

export function DemoListings({ onPublish }) {
  const [selected, setSelected] = useState(null);
  return <section className="sok-demos" aria-labelledby="sok-demo-heading">
    <div className="sok-demo-section-heading">
      <div>
        <span className="sok-demo-kicker">Votre annonce, en pratique</span>
        <h2 id="sok-demo-heading">Découvrez à quoi ressemblera votre annonce</h2>
      </div>
      <p>Trois exemples à explorer pour préparer la vôtre. Ce sont des biens fictifs, non disponibles.</p>
    </div>
    <div className="sok-demo-grid">
      {EXAMPLES.map(example => <article key={example.id} className="sok-demo-card">
        <div className="sok-demo-notice">{NOTICE}</div>
        <button type="button" className="sok-demo-open" onClick={() => setSelected(example)} aria-label={`Voir la démonstration : ${example.kind}`}>
          <Illustration example={example} />
          <div className="sok-demo-card-content">
            <span className="sok-demo-kicker">{example.kind}</span>
            <h3>{example.title}</h3>
            <p className="sok-demo-place">{example.place}</p>
            <p className="sok-demo-card-features">{example.features.join(" · ")}</p>
            <div className="sok-demo-card-price">{example.price} <small>{example.period}</small></div>
            <span className="sok-demo-price-note">Prix fictif à titre d’exemple</span>
            <span className="sok-demo-card-link">Découvrir l’exemple <span aria-hidden="true">↗</span></span>
          </div>
        </button>
      </article>)}
    </div>
    <p className="sok-demo-section-note">Ces exemples sont séparés des annonces réelles et des résultats de recherche.</p>
    {selected && <DemoDetails example={selected} onClose={() => setSelected(null)} onPublish={() => { setSelected(null); onPublish(); }} />}
  </section>;
}
