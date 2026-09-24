export const MIN_RESPONSE_LENGTH = 30;
export const MAX_RESPONSE_LENGTH = 4000;

const refusals = new Set(["rejetee", "refusee", "modifications_demandees"]);
export function validateModerationResponse(status, response) {
  if (!refusals.has(status)) return "";
  const length = Array.from(String(response || "").trim()).length;
  if (length < MIN_RESPONSE_LENGTH) return "Expliquez précisément votre décision et les suites possibles (30 caractères minimum).";
  if (length > MAX_RESPONSE_LENGTH) return "La réponse doit contenir au maximum 4 000 caractères.";
  return "";
}

const types = {
  properties: { label: "annonce", accepted: "validee", refused: "rejetee" },
  professionals: { label: "fiche prestataire", accepted: "validee", refused: "refusee" },
  advertising_requests: { label: "demande de publicité", accepted: "acceptee", refused: "refusee" },
  development_programs: { label: "programme neuf", accepted: "validee", refused: "refusee" },
};
const oneLine = value => String(value || "").replace(/[\r\n\u0000-\u001f\u007f]/g, " ").trim();
export function moderationResponse(table, record) {
  return String((table === "properties" ? record.motif_rejet : record.moderation_note) || "").trim();
}

// Le texte de décision est rédigé par l'administration, jamais inventé ici.
// La même fonction compose l'aperçu et l'email envoyé.
export function buildDecisionMessage(table, record) {
  const type = types[table];
  if (!type) return null;
  const refused = record.status === type.refused;
  const incomplete = record.status === "modifications_demandees" && table !== "properties";
  const accepted = record.status === type.accepted;
  if (!refused && !incomplete && !accepted) return null;
  const response = moderationResponse(table, record);
  const error = validateModerationResponse(record.status, response);
  if (error) throw new Error(error);
  const email = String(table === "properties" ? record.user_email || "" : record.email || "").trim();
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) throw new Error("Le dossier ne contient pas d'adresse email valide.");
  const name = oneLine(record.user_name || record.contact_name || record.business_name);
  const title = oneLine(record.title || record.business_name || record.company || record.format || `Dossier ${record.id}`);
  const decision = refused ? "Suivi" : incomplete ? "Précisions demandées" : "Validation";
  const introduction = refused
    ? `Merci pour votre confiance. Votre ${type.label} « ${title} » nécessite quelques ajustements avant sa publication. Voici les points à revoir et la marche à suivre.`
    : incomplete
      ? `Nous avons besoin de précisions pour poursuivre l'examen de votre ${type.label} « ${title} ».`
      : table === "advertising_requests"
        ? `Votre demande de publicité « ${title} » a été acceptée. L'équipe Sokilé vous contactera pour organiser la diffusion.`
        : table === "development_programs"
          ? `Votre programme neuf « ${title} » a été validé et publié sur Sokilé.`
          : `Votre ${type.label} « ${title} » a été validée et publiée sur Sokilé.`;
  return {
    to: [email], reply_to: "contact@sokile.com",
    subject: `Sokilé — ${decision} de votre ${type.label} : ${title}`,
    text: [name ? `Bonjour ${name},` : "Bonjour,", introduction,
      refused || incomplete ? response : "",
      accepted && table === "properties" && record.expires_at
        ? `Votre annonce reste publiée jusqu'au ${new Date(record.expires_at).toLocaleDateString("fr-FR", { timeZone: "UTC" })} (${(record.transaction || (/location/i.test(record.type || "") ? "location" : "vente")) === "location" ? "6 mois" : "1 an"}). À cette date, elle sera retirée de la recherche. Vous pourrez la soumettre à nouveau depuis votre compte si le bien est toujours disponible.` : "",
      accepted && table === "development_programs" && record.expires_at
        ? `Votre programme reste publié jusqu'au ${new Date(record.expires_at).toLocaleDateString("fr-FR", { timeZone: "UTC" })} (1 an). Actualisez les disponibilités depuis « Mon compte → Mes programmes neufs ». Un programme entièrement vendu est retiré de la recherche.` : "",
      "Retrouvez notre réponse dans votre compte : https://www.sokile.com/?tab=compte",
      "Pour échanger avec nous, répondez directement à cet email.", "L'équipe Sokilé",
    ].filter(Boolean).join("\n\n"),
  };
}
