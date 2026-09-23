// Calculs déterministes : aucun taux fiscal, prix de marché ou rendement promis.
export const CFA_PER_EURO = 655.957;
export const SIM_COUNTRIES = ['Bénin', 'Burkina Faso', "Côte d'Ivoire", 'Mali', 'Niger', 'Sénégal', 'Togo', 'Cameroun', 'Centrafrique', 'Congo', 'Gabon', 'Tchad'];
export const localCurrency = country => ['Cameroun', 'Centrafrique', 'Congo', 'Gabon', 'Tchad'].includes(country) ? 'XAF' : 'XOF';
export const COSTS = [
  ['acquisition', 'Frais d’acquisition', 'Droits, notaire et formalités : demandez un décompte local.'],
  ['agency', 'Frais d’agence', 'Uniquement les frais à votre charge, hors prix déjà saisi.'],
  ['works', 'Travaux et raccordements', 'Rénovation, eau, électricité, assainissement…'],
  ['furniture', 'Mobilier et équipement', 'Si vous prévoyez de meubler ou d’équiper le bien.'],
  ['other', 'Autres frais', 'Expertise, déplacements, frais de financement ou de transfert…'],
  ['reserve', 'Réserve pour imprévus', 'Une enveloppe que vous choisissez selon votre projet.'],
];

// Une case vide reste inconnue. Ne jamais la transformer silencieusement en zéro.
export function amount(value) {
  if (value === null || value === undefined || String(value).trim() === '') return null;
  const raw = String(value).replace(/[\s\u00a0\u202f]/g, '').replace(',', '.');
  if (!/^(?:\d+(?:\.\d*)?|\.\d+)$/.test(raw)) return NaN;
  const n = Number(raw);
  return Number.isFinite(n) && n <= 1e15 ? n : NaN;
}
const valid = n => typeof n === 'number' && Number.isFinite(n) && n >= 0 && n <= 1e15;
export function convertAmount(value, from, to) {
  if (from === to || value === '') return value;
  const n = amount(value);
  if (!valid(n)) return value;
  const converted = n * (from === 'EUR' ? CFA_PER_EURO : 1) / (to === 'EUR' ? CFA_PER_EURO : 1);
  return String(Math.round(converted * 1e6) / 1e6);
}

export function purchaseBudget(price, costs) {
  if (!valid(price) || price <= 0) return null;
  if (COSTS.some(([key]) => costs[key] !== null && !valid(costs[key]))) return null;
  const missing = COSTS.filter(([key]) => costs[key] === null).map(([key]) => key);
  const fees = COSTS.reduce((sum, [key]) => sum + (costs[key] ?? 0), 0);
  return { price, fees, total: price + fees, missing, complete: missing.length === 0 };
}

export function rentalReturn({ investment, rent, vacancy, management, charges, maintenance, loan }) {
  if (![investment, rent, vacancy, management, charges, maintenance, loan].every(valid) || investment <= 0 || vacancy > 12 || management > 100) return null;
  const potentialRent = rent * 12;
  const collectedRent = rent * (12 - vacancy);
  const managementCost = collectedRent * management / 100;
  const operatingCosts = charges + maintenance + managementCost;
  const netBeforeFinancing = collectedRent - operatingCosts;
  const cashAnnual = netBeforeFinancing - loan * 12;
  return {
    potentialRent, collectedRent, managementCost, operatingCosts, netBeforeFinancing,
    grossYield: potentialRent / investment * 100,
    netYield: netBeforeFinancing / investment * 100,
    cashAnnual, cashMonthly: cashAnnual / 12,
  };
}

export function savingsGoal({ target, saved, monthly, horizon, mode }) {
  if (!valid(target) || target <= 0 || !valid(saved) || !['duration', 'monthly'].includes(mode)) return null;
  const remaining = Math.max(0, target - saved);
  if (mode === 'monthly') {
    if (!Number.isInteger(horizon) || horizon < 1 || horizon > 600) return null;
    // Arrondir au centime supérieur garantit que l'objectif sera atteint.
    return { remaining, reached: remaining === 0, months: remaining === 0 ? 0 : horizon, monthly: Math.ceil(remaining / horizon * 100 - 1e-7) / 100 };
  }
  if (!valid(monthly)) return null;
  return { remaining, reached: remaining === 0, months: remaining === 0 ? 0 : monthly === 0 ? null : Math.max(1, Math.ceil(remaining / monthly - 1e-10)), monthly };
}

export function goalDate(months, now = new Date()) {
  if (!Number.isInteger(months) || months < 0 || months > 1200) return null;
  // Les versements sont supposés mensuels ; seule l'échéance au mois est affichée.
  return new Date(now.getFullYear(), now.getMonth() + months, 1);
}

export const initialSimulation = () => ({
  version: 1, country: 'Sénégal', currency: 'EUR', active: 'purchase', listing: '',
  purchase: { price: '', ...Object.fromEntries(COSTS.map(([key]) => [key, ''])) },
  confirmed: Object.fromEntries(COSTS.map(([key]) => [key, false])),
  rental: { investment: '', rent: '', vacancy: '1', management: '', charges: '', maintenance: '', loan: '0' },
  savings: { target: '', saved: '0', monthly: '', horizon: '36', mode: 'duration' },
  construction: { surface: '', perM2: '', land: '', extras: '', reserve: '' },
});
export const MONEY_FIELDS = {
  purchase: ['price', ...COSTS.map(([key]) => key)],
  rental: ['investment', 'rent', 'charges', 'maintenance', 'loan'],
  savings: ['target', 'saved', 'monthly'],
  construction: ['perM2', 'land', 'extras', 'reserve'],
};
export function changeCurrency(state, currency) {
  const next = { ...state, currency };
  for (const [section, fields] of Object.entries(MONEY_FIELDS)) {
    next[section] = { ...state[section] };
    for (const field of fields) next[section][field] = convertAmount(state[section][field], state.currency, currency);
  }
  return next;
}

export function restoreSimulation(raw) {
  try {
    const data = JSON.parse(raw);
    if (data?.version !== 1 || !SIM_COUNTRIES.includes(data.country) || !['EUR', localCurrency(data.country)].includes(data.currency)) return null;
    const clean = initialSimulation();
    clean.country = data.country; clean.currency = data.currency;
    if (['purchase', 'rental', 'savings', 'construction'].includes(data.active)) clean.active = data.active;
    clean.listing = typeof data.listing === 'string' ? data.listing.slice(0, 200) : '';
    for (const section of Object.keys(MONEY_FIELDS)) {
      for (const key of Object.keys(clean[section])) {
        const v = data[section]?.[key];
        if (section === 'savings' && key === 'mode') {
          if (['duration', 'monthly'].includes(v)) clean.savings.mode = v;
        } else if (typeof v === 'string' && v.length <= 40 && (v === '' || valid(amount(v)))) clean[section][key] = v;
      }
    }
    for (const [key] of COSTS) clean.confirmed[key] = data.confirmed?.[key] === true;
    return clean;
  } catch { return null; }
}

export function simulationFromListing(listing) {
  const state = initialSimulation();
  if (SIM_COUNTRIES.includes(listing.country)) state.country = listing.country;
  state.listing = String(listing.title || '').slice(0, 200);
  // L'annonce n'apporte que son prix. Les frais d'un autre projet ne sont pas repris.
  const local = amount(listing.price), euro = amount(listing.price_eur);
  if (valid(local) && local > 0) {
    state.currency = localCurrency(state.country); state.purchase.price = String(local);
  } else if (valid(euro) && euro > 0) state.purchase.price = String(euro);
  return state;
}
