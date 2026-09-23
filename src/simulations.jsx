import { useId, useState } from 'react';
import { amount, CFA_PER_EURO, COSTS, SIM_COUNTRIES, localCurrency, purchaseBudget, rentalReturn, savingsGoal, goalDate, changeCurrency, restoreSimulation } from './simulations.mjs';
import './simulations.css';

const STORAGE_KEY = 'sokile-simulation-v1';
const OPTIONS = [
  ['purchase', '01', 'Acheter', 'Préparer mon budget'],
  ['rental', '02', 'Investir pour louer', 'Estimer ce qu’il me reste'],
  ['savings', '03', 'Épargner', 'Atteindre mon objectif'],
  ['construction', '04', 'Construire', 'Compléter mon devis'],
];
const parsed = values => Object.fromEntries(Object.entries(values).map(([k, v]) => [k, amount(v)]));
const money = (n, currency) => new Intl.NumberFormat('fr-FR', { style: 'currency', currency, maximumFractionDigits: currency === 'EUR' ? 2 : 0 }).format(Math.abs(n) < 0.00001 ? 0 : n);
const percent = n => `${new Intl.NumberFormat('fr-FR', { maximumFractionDigits: 2 }).format(n)} %`;
const duration = months => months > 1200 ? 'Plus de 100 ans' : [Math.floor(months / 12) ? `${Math.floor(months / 12)} an${months >= 24 ? 's' : ''}` : '', months % 12 ? `${months % 12} mois` : ''].filter(Boolean).join(' et ');

function Field({ label, value, onChange, suffix, hint, min = 0, max, integer, id: givenId }) {
  const generated = useId(); const id = givenId || generated;
  const n = amount(value);
  const invalid = Number.isNaN(n) || (n !== null && (n < min || (max !== undefined && n > max) || (integer && !Number.isInteger(n))));
  return <div className="sim-field">
    <label htmlFor={id}>{label}</label>
    <div className={`sim-input${invalid ? ' sim-invalid' : ''}`}>
      <input id={id} type="text" inputMode="decimal" autoComplete="off" value={value} onChange={e => onChange(e.target.value)} aria-invalid={invalid} aria-describedby={hint || invalid ? `${id}-help` : undefined} placeholder="À renseigner" />
      {suffix && <span aria-hidden="true">{suffix}</span>}
    </div>
    {(hint || invalid) && <small id={`${id}-help`} className={invalid ? 'sim-error' : ''}>{invalid ? `Saisissez un nombre ${integer ? 'entier ' : ''}${min > 0 ? `d’au moins ${min}` : 'positif ou nul'}${max !== undefined ? `, au maximum ${max}` : ''}.` : hint}</small>}
  </div>;
}
function Result({ eyebrow, title, amount: total, currency, country, children, empty, negative }) {
  const other = currency === 'EUR' ? localCurrency(country) : 'EUR';
  const converted = total === null || total === undefined ? null : total * (currency === 'EUR' ? CFA_PER_EURO : 1 / CFA_PER_EURO);
  return <aside className={`sim-result${negative ? ' sim-result-negative' : ''}`} aria-label="Résultat de la simulation" aria-live="polite" aria-atomic="true">
    <span className="sim-eyebrow">{eyebrow}</span>
    <h3>{title}</h3>
    {Number.isFinite(total) && <><div className="sim-total">{money(total, currency)}</div><p className="sim-equivalent">≈ {money(converted, other)}</p></>}
    {empty && <p className="sim-empty">{empty}</p>}
    {children}
  </aside>;
}
function Row({ label, value }) { return <div className="sim-result-row"><span>{label}</span><strong>{value}</strong></div>; }
function Intro({ tag, title, children }) { return <div className="sim-intro"><span className="sim-eyebrow">{tag}</span><h3>{title}</h3><p>{children}</p></div>; }
function Action({ children, ...props }) { return <button type="button" className="sim-action" {...props}>{children}</button>; }

function Purchase({ state, update, useBudget, onFindPro }) {
  const { purchase: values, confirmed, currency, country } = state;
  const nums = parsed(values), result = purchaseBudget(nums.price, nums);
  const known = COSTS.filter(([key]) => nums[key] !== null && Number.isFinite(nums[key]));
  const estimates = known.filter(([key]) => !confirmed[key]).length;
  const unit = currency === 'EUR' ? '€' : currency;
  return <>
    <Intro tag="Mon budget d’achat" title="Au-delà du prix affiché.">Rassemblez le prix et les dépenses liées à votre achat. Une case vide reste un frais à chiffrer ; indiquez 0 si le poste ne s’applique pas.</Intro>
    {state.listing && <p className="sim-note">Prix repris de l’annonce : <strong>{state.listing}</strong>. Vérifiez-le auprès de l’annonceur.</p>}
    <div className="sim-layout">
      <div className="sim-form">
        <Field label="Prix du bien" value={values.price} onChange={v => update('purchase', 'price', v)} suffix={unit} />
        <div className="sim-section-heading"><h4>Les frais à prévoir</h4><span>{known.length} / {COSTS.length} renseignés</span></div>
        <p className="sim-help">Les frais d’acquisition dépendent du pays et de votre opération. Saisissez un décompte local ou une estimation à faire confirmer par votre notaire.</p>
        {COSTS.map(([key, label, hint]) => <div className="sim-cost" key={key}>
          <Field label={label} value={values[key]} onChange={v => update('purchase', key, v)} suffix={unit} hint={hint} />
          {nums[key] !== null && Number.isFinite(nums[key]) ? <label className="sim-check"><input type="checkbox" checked={confirmed[key]} onChange={e => update('confirmed', key, e.target.checked)} />Montant confirmé par mes informations ou mon devis</label> : <span className="sim-status">À chiffrer</span>}
        </div>)}
      </div>
      <Result eyebrow={result?.complete ? 'Budget renseigné' : 'Budget en cours'} title={result ? result.complete ? 'Enveloppe selon vos montants' : 'Sous-total connu' : 'Votre budget prend forme ici'} amount={result?.total} currency={currency} country={country} empty={!result ? 'Indiquez un prix supérieur à zéro et des montants valides pour commencer.' : ''}>
        {result && <>
          <Row label="Prix du bien" value={money(result.price, currency)} />
          <Row label="Frais et réserve renseignés" value={money(result.fees, currency)} />
          {result.missing.length > 0 && <div className="sim-result-note"><strong>{result.missing.length} poste{result.missing.length > 1 ? 's' : ''} encore à chiffrer</strong><p>{COSTS.filter(([key]) => result.missing.includes(key)).map(([, label]) => label).join(' · ')}</p><p>Ce sous-total ne constitue pas votre budget complet.</p></div>}
          {known.length > 0 && <p className="sim-result-note">{estimates} estimation{estimates > 1 ? 's' : ''} personnelle{estimates > 1 ? 's' : ''} · {known.length - estimates} montant{known.length - estimates > 1 ? 's' : ''} indiqué{known.length - estimates > 1 ? 's' : ''} comme confirmé{known.length - estimates > 1 ? 's' : ''} par vous. Sokilé ne vérifie pas les devis.</p>}
          {result.complete && <div className="sim-result-actions"><Action onClick={() => useBudget(result.total, 'savings')}>Épargner pour ce budget →</Action><Action onClick={() => useBudget(result.total, 'rental')}>Étudier sa rentabilité →</Action></div>}
        </>}
        {onFindPro && <button type="button" className="sim-text-link" onClick={() => onFindPro(country)}>Trouver un notaire dans ce pays →</button>}
        <p className="sim-footnote">Montants à actualiser avant votre engagement. Le coût total du crédit au fil des années n’est pas inclus dans ce budget d’achat.</p>
      </Result>
    </div>
  </>;
}

function Rental({ state, update }) {
  const { rental: v, currency, country } = state; const n = parsed(v);
  const result = rentalReturn(n);
  const stress = result && rentalReturn({ ...n, vacancy: Math.min(12, n.vacancy + 1), charges: n.charges * 1.1, maintenance: n.maintenance * 1.1 });
  const unit = currency === 'EUR' ? '€' : currency;
  return <>
    <Intro tag="Mon investissement locatif" title="Ce qui reste après les dépenses.">Testez votre propre hypothèse de loyer, les périodes sans locataire et les frais de gestion. Aucun loyer de marché ni rendement n’est présumé.</Intro>
    <div className="sim-layout"><div className="sim-form">
      <Field label="Budget total investi" value={v.investment} onChange={x => update('rental', 'investment', x)} suffix={unit} hint="Prix + acquisition + agence + travaux + mobilier + autres frais et réserve. Ne déduisez pas le prêt de ce montant." />
      <div className="sim-fields-grid">
        <Field label="Loyer mensuel hors charges" value={v.rent} onChange={x => update('rental', 'rent', x)} suffix={unit} />
        <Field label="Mois sans locataire par an" value={v.vacancy} onChange={x => update('rental', 'vacancy', x)} max={12} suffix="mois" hint="1 mois par défaut : une hypothèse à adapter." />
        <Field label="Gestion locative" value={v.management} onChange={x => update('rental', 'management', x)} max={100} suffix="%" hint="Pourcentage des loyers encaissés. 0 si vous gérez vous-même." />
        <Field label="Charges annuelles du propriétaire" value={v.charges} onChange={x => update('rental', 'charges', x)} suffix={unit} hint="Assurance du bien, charges non récupérables, taxes locales… Hors impôt sur le revenu." />
        <Field label="Entretien annuel à prévoir" value={v.maintenance} onChange={x => update('rental', 'maintenance', x)} suffix={unit} hint="Réserve annuelle pour réparations. Évitez de la compter aussi dans les charges." />
        <Field label="Mensualité du crédit, assurance comprise" value={v.loan} onChange={x => update('rental', 'loan', x)} suffix={unit} hint="0 par défaut pour un achat sans crédit. Saisissez votre mensualité si vous empruntez." />
      </div>
      <p className="sim-note">Tous les postes sont à renseigner, même avec 0. Les résultats sont <strong>avant impôt sur les revenus locatifs</strong> ; aucune fiscalité française ou locale n’est appliquée automatiquement.</p>
    </div><Result eyebrow="Trésorerie mensuelle moyenne" title={result ? result.cashMonthly < 0 ? 'Montant à compléter chaque mois' : 'Solde après charges et crédit' : 'Votre scénario locatif'} amount={result ? Math.abs(result.cashMonthly) : undefined} currency={currency} country={country} negative={result?.cashMonthly < 0} empty={!result ? 'Complétez le budget, le loyer et les dépenses pour obtenir votre résultat.' : ''}>
      {result && <>
        <Row label="Loyers encaissés / an" value={money(result.collectedRent, currency)} />
        <Row label="Charges, gestion et entretien / an" value={money(result.operatingCosts, currency)} />
        <Row label="Crédit et assurance / an" value={money(n.loan * 12, currency)} />
        <Row label="Rendement brut théorique" value={percent(result.grossYield)} />
        <Row label="Rendement après charges, avant crédit et impôt" value={percent(result.netYield)} />
        <div className="sim-result-note"><strong>Et si le scénario était moins favorable ?</strong><p>{n.vacancy < 12 ? 'Un mois sans locataire supplémentaire (plafond : 12 mois), ' : 'Toujours 12 mois sans locataire, '}charges du propriétaire et entretien majorés de 10 %, même loyer et même crédit.</p><Row label="Solde mensuel dans ce scénario" value={money(stress.cashMonthly, currency)} /></div>
        <p className="sim-footnote">Le rendement brut suppose 12 mois de loyer. Le rendement après charges tient compte des mois sans locataire, mais pas du financement. Le solde mensuel déduit aussi le crédit. La réserve initiale reste incluse dans le budget investi. Aucun gain à la revente n’est supposé.</p>
      </>}
    </Result></div>
  </>;
}

function Savings({ state, update }) {
  const { savings: v, currency, country } = state;
  const result = savingsGoal({ ...parsed(v), mode: v.mode });
  const end = result && goalDate(result.months);
  const unit = currency === 'EUR' ? '€' : currency;
  const progress = result ? Math.min(100, (amount(v.saved) / amount(v.target)) * 100) : 0;
  return <>
    <Intro tag="Mon objectif immobilier" title="Un montant, un rythme, une échéance.">Partez du budget de votre projet. Découvrez quand vous pourrez le réunir, ou combien mettre de côté pour respecter votre calendrier.</Intro>
    <div className="sim-layout"><div className="sim-form">
      <div className="sim-fields-grid">
        <Field label="Budget cible du projet" value={v.target} onChange={x => update('savings', 'target', x)} suffix={unit} hint="Incluez les frais d’achat, les travaux et votre réserve." />
        <Field label="Épargne déjà disponible" value={v.saved} onChange={x => update('savings', 'saved', x)} suffix={unit} />
      </div>
      <fieldset className="sim-choice"><legend>Que souhaitez-vous calculer ?</legend>
        {[['duration', 'Quand pourrai-je acheter ?'], ['monthly', 'Combien épargner chaque mois ?']].map(([value, label]) => <label key={value} className={v.mode === value ? 'is-selected' : ''}><input type="radio" name="savings-mode" checked={v.mode === value} onChange={() => update('savings', 'mode', value)} />{label}</label>)}
      </fieldset>
      {v.mode === 'duration' ? <Field label="Épargne mensuelle possible" value={v.monthly} onChange={x => update('savings', 'monthly', x)} suffix={unit} /> : <Field label="Délai souhaité" value={v.horizon} onChange={x => update('savings', 'horizon', x)} suffix="mois" min={1} max={600} integer hint="De 1 à 600 mois. Le premier versement est prévu le mois prochain." />}
      <p className="sim-note">Projection à prix constant, sans intérêts, inflation ni frais de transfert. Le budget cible devra être révisé si le coût de votre projet évolue.</p>
    </div><Result eyebrow="Mon cap" title={result?.reached ? 'Votre objectif est déjà atteint' : v.mode === 'monthly' ? 'À épargner chaque mois' : 'Votre calendrier'} amount={result && v.mode === 'monthly' ? result.monthly : undefined} currency={currency} country={country} empty={!result ? 'Indiquez un budget supérieur à zéro et complétez les montants pour calculer votre objectif.' : ''}>
      {result && <>
        {v.mode === 'duration' && !result.reached && <div className="sim-duration">{result.months === null ? 'Un versement est nécessaire' : duration(result.months)}</div>}
        <div className="sim-progress" role="progressbar" aria-label="Part du budget déjà épargnée" aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round(progress)}><span style={{ width: `${progress}%` }} /></div>
        <Row label="Objectif déjà financé" value={percent(progress)} />
        <Row label="Reste à réunir" value={money(result.remaining, currency)} />
        {!result.reached && result.months === null && <p className="sim-result-note">Avec une épargne mensuelle de 0, le budget cible ne peut pas être atteint. Essayez un montant mensuel supérieur à zéro.</p>}
        {!result.reached && end && <Row label="Échéance estimée" value={end.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })} />}
        {!result.reached && result.months !== null && <p className="sim-footnote">Versements réguliers à partir du mois prochain. {v.mode === 'duration' ? 'Le dernier versement peut être plus faible.' : 'Montant mensuel arrondi au centime supérieur.'}</p>}
      </>}
    </Result></div>
  </>;
}

function Construction({ state, update }) {
  const { construction: v, currency, country } = state, n = parsed(v);
  const ready = Object.values(n).every(x => x !== null && Number.isFinite(x)) && n.surface > 0 && n.perM2 > 0;
  const works = n.surface * n.perM2, total = works + n.land + n.extras + n.reserve;
  const unit = currency === 'EUR' ? '€' : currency;
  return <>
    <Intro tag="Mon budget de construction" title="Partir d’un devis, compléter l’enveloppe.">Utilisez un devis adapté à votre terrain. Ajoutez les dépenses qui n’y figurent pas, sans les compter deux fois.</Intro>
    <div className="sim-layout"><div className="sim-form"><div className="sim-fields-grid">
      <Field label="Surface à construire" value={v.surface} onChange={x => update('construction', 'surface', x)} suffix="m²" hint="La surface de plancher facturée dans le devis, tous niveaux inclus." />
      <Field label="Prix au m² du devis" value={v.perM2} onChange={x => update('construction', 'perM2', x)} suffix={unit} />
      <Field label="Terrain et frais d’acquisition" value={v.land} onChange={x => update('construction', 'land', x)} suffix={unit} hint="0 si vous possédez déjà le terrain et ne comptez que les dépenses à venir." />
      <Field label="Dépenses hors devis" value={v.extras} onChange={x => update('construction', 'extras', x)} suffix={unit} hint="Études, autorisations, architecte, raccordements, clôture : uniquement ce qui n’est pas déjà inclus." />
      <Field label="Imprévus de chantier" value={v.reserve} onChange={x => update('construction', 'reserve', x)} suffix={unit} />
    </div><p className="sim-note">Le périmètre du devis doit être confirmé avec le professionnel. La répartition des travaux dépend du chantier ; aucun pourcentage standard n’est imposé.</p></div>
    <Result eyebrow="Enveloppe du chantier" title={ready ? 'Selon votre devis et vos ajouts' : 'Votre devis, dans son ensemble'} amount={ready ? total : undefined} currency={currency} country={country} empty={!ready ? 'Renseignez chaque poste, même avec 0, pour calculer l’enveloppe.' : ''}>
      {ready && <><Row label="Construction selon le devis" value={money(works, currency)} /><Row label="Terrain et acquisition" value={money(n.land, currency)} /><Row label="Hors devis et imprévus" value={money(n.extras + n.reserve, currency)} /><p className="sim-footnote">Hors coût du crédit. Ce calcul ne détermine ni les quantités de matériaux ni le calendrier des paiements.</p></>}
    </Result></div>
  </>;
}

export function Simulateurs({ state, setState, onFindPro }) {
  const [notice, setNotice] = useState('');
  const [hasSaved, setHasSaved] = useState(() => { try { return Boolean(localStorage.getItem(STORAGE_KEY)); } catch { return false; } });
  const update = (section, key, value) => { setNotice(''); setState(prev => ({ ...prev, [section]: { ...prev[section], [key]: value }, ...(section === 'purchase' && key !== 'price' ? { confirmed: { ...prev.confirmed, [key]: false } } : {}) })); };
  const useBudget = (total, active) => { setNotice('Budget d’achat repris. Complétez les autres hypothèses de votre projet.'); setState(prev => ({ ...prev, active, [active]: { ...prev[active], [active === 'savings' ? 'target' : 'investment']: String(total) } })); };
  const save = () => { try { localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); setHasSaved(true); setNotice('Simulation enregistrée dans ce navigateur uniquement. Sur un appareil partagé, pensez à l’effacer après utilisation.'); } catch { setNotice('Ce navigateur ne permet pas l’enregistrement. Votre simulation reste disponible sur cette page.'); } };
  const restore = () => { try { const saved = restoreSimulation(localStorage.getItem(STORAGE_KEY)); if (!saved) throw new Error(); setState(saved); setNotice('Votre dernière simulation enregistrée a été reprise.'); } catch { setNotice('La simulation enregistrée ne peut pas être reprise. Vos saisies actuelles sont conservées.'); } };
  const remove = () => { try { localStorage.removeItem(STORAGE_KEY); setHasSaved(false); setNotice('La copie enregistrée dans ce navigateur a été effacée. Vos saisies actuelles restent affichées.'); } catch { setNotice('Impossible d’effacer la copie dans ce navigateur.'); } };
  return <section className="sim" aria-label="Simulateurs immobiliers">
    <div className="sim-heading"><div><span className="sim-eyebrow">Les outils de votre projet</span><h2>Quel est votre prochain pas ?</h2><p>Un budget lisible. Des hypothèses que vous maîtrisez.</p></div><span className="sim-free">Gratuit · Sans inscription</span></div>
    <div className="sim-navigation" role="group" aria-label="Choisir un simulateur">{OPTIONS.map(([id, number, title, subtitle]) => <button type="button" key={id} aria-pressed={state.active === id} onClick={() => { setNotice(''); setState(prev => ({ ...prev, active: id })); }}><span className="sim-nav-number">{number}</span><strong>{title}</strong><span>{subtitle}</span></button>)}</div>
    <div className="sim-context"><label>Pays du projet<select value={state.country} onChange={e => { const country = e.target.value; setNotice(''); setState(prev => ({ ...changeCurrency(prev, prev.currency === 'EUR' ? 'EUR' : localCurrency(country)), country, confirmed: Object.fromEntries(COSTS.map(([key]) => [key, false])) })); }}>{SIM_COUNTRIES.map(country => <option key={country}>{country}</option>)}</select></label><label>Devise des montants<select value={state.currency} onChange={e => { setNotice(''); setState(prev => changeCurrency(prev, e.target.value)); }}><option value="EUR">Euro (€)</option><option value={localCurrency(state.country)}>Franc CFA ({localCurrency(state.country)})</option></select></label><p>Changer de devise convertit vos montants. Un changement de pays conserve vos hypothèses : revérifiez les frais locaux.</p></div>
    {notice && <p className="sim-note" role="status">{notice}</p>}
    {state.active === 'purchase' && <Purchase state={state} update={update} useBudget={useBudget} onFindPro={onFindPro} />}
    {state.active === 'rental' && <Rental state={state} update={update} />}
    {state.active === 'savings' && <Savings state={state} update={update} />}
    {state.active === 'construction' && <Construction state={state} update={update} />}
    <div className="sim-save"><div><strong>Gardez votre point de départ.</strong><p>Enregistrez vos quatre outils dans ce navigateur. Vous choisissez quand mettre à jour la copie.</p></div><div className="sim-save-actions"><Action onClick={save}>Enregistrer sur cet appareil</Action>{hasSaved && <><button type="button" onClick={restore}>Reprendre ma simulation</button><button type="button" onClick={remove}>Effacer la copie enregistrée</button></>}</div></div>
    <details className="sim-method"><summary>Comprendre les calculs et les conversions</summary><p>Calculs indicatifs fondés sur vos saisies. Aucun taux fiscal national ni prix au m² moyen n’est prérempli. Les frais manquants du budget d’achat ne sont pas assimilés à zéro. Le loyer saisi est une hypothèse à vérifier sur place.</p><p>Conversion à la parité de 1 € = 655,957 francs CFA, hors commissions de change et de transfert. XOF : Afrique de l’Ouest ; XAF : Afrique centrale. Les calculs conservent les décimales ; l’affichage est arrondi.</p><p>Références vérifiées le 23 septembre 2026 : <a href="https://www.bceao.int/fr/cours/cours-des-devises-contre-Franc-CFA-appliquer-aux-transferts" target="_blank" rel="noopener noreferrer">BCEAO</a> · <a href="https://www.tresor.economie.gouv.fr/tresor-international/la-zone-franc/les-principes-et-modalites-de-fonctionnement-de-la-cooperation-monetaire" target="_blank" rel="noopener noreferrer">Direction générale du Trésor</a>.</p></details>
  </section>;
}
