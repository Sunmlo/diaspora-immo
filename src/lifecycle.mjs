// Les mois calendaires sont calculés en UTC, comme dans la base de données.
export function addCalendarMonths(value, months) {
  const date = new Date(value);
  if (!Number.isFinite(date.getTime())) throw new Error("Date invalide");
  const day = date.getUTCDate();
  date.setUTCDate(1);
  date.setUTCMonth(date.getUTCMonth() + months);
  const last = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth() + 1, 0)).getUTCDate();
  date.setUTCDate(Math.min(day, last));
  return date.toISOString();
}
export const publicationMonths = p => (p?.transaction || (/location/i.test(p?.type || "") ? "location" : "vente")) === "location" ? 6 : 12;
export const isExpired = (p, now = Date.now()) => p.status === "validee" && Boolean(p.expires_at) && new Date(p.expires_at).getTime() <= now;
export const alertState = (a, now = Date.now()) => a.cancelled_at ? "Annulée" : new Date(a.expires_at).getTime() <= now ? "Expirée" : "Active";
export function alertSummary(f = {}) {
  return [f.transaction === "location" ? "Location" : f.transaction === "vente" ? "Vente" : "Achat et location",
    f.country && f.country !== "Tous" ? f.country : f.region && f.region !== "Tous" ? f.region : "Tous les pays",
    f.natureLabel || (f.nature !== "Tous" ? f.nature : ""), f.search,
    f.priceMin || f.priceMax ? `Budget : ${f.priceMin || 0} à ${f.priceMax || "sans limite"} €` : "",
    f.surfaceMin || f.surfaceMax ? `Surface : ${f.surfaceMin || 0} à ${f.surfaceMax || "sans limite"} m²` : "",
    f.rooms && f.rooms !== "Tous" ? `${f.rooms} pièces` : "", ...(f.equipements || []), f.verified ? "Annonces modérées" : "",
  ].filter(Boolean).join(" · ");
}
