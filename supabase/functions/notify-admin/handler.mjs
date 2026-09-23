import { buildDecisionMessage, moderationResponse } from "./moderation.mjs";

const ADMIN = "contact@sokile.com";
const allowed = new Set(["properties", "professionals", "advertising_requests", "reports", "development_programs", "program_inquiries"]);
const json = (body, status = 200) => new Response(JSON.stringify(body), { status, headers: { "Content-Type": "application/json" } });

export function createNotificationHandler({ env, send = fetch, digest = value => crypto.subtle.digest("SHA-256", new TextEncoder().encode(value)) }) {
  return async req => {
    if (req.method !== "POST") return json({ error: "Method not allowed" }, 405);
    const secret = env("WEBHOOK_SECRET");
    if (!secret || req.headers.get("x-webhook-secret") !== secret) return json({ error: "Unauthorized" }, 401);
    const payload = await req.json().catch(() => null);
    const table = payload?.table;
    if (!allowed.has(table) || !["INSERT", "UPDATE", "REMINDER"].includes(payload?.type)) return json({ ignored: true });
    if (payload.type === "REMINDER" && table !== "development_programs") return json({ ignored: true });
    const record = payload.record || {}, previous = payload.old_record || {};
    let message;
    let kind = "admin";
    if (payload.type === "REMINDER") {
      if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(record.email || "")) return json({ error: "Invalid recipient" }, 422);
      kind = "program-reminder";
      message = { to: [record.email], reply_to: ADMIN, subject: `Sokilé — Actualisez les disponibilités de votre programme`, text: `Bonjour,\n\nLes disponibilités de votre programme « ${record.title} » n'ont pas été confirmées depuis 90 jours.\n\nMerci de vérifier les logements disponibles, réservés et vendus dans « Mon compte → Mes programmes neufs ». Vous pouvez aussi retirer le programme si sa commercialisation est terminée.\n\nhttps://www.sokile.com/?tab=compte\n\nL'équipe Sokilé` };
    } else if (table === "program_inquiries") {
      if (payload.type !== "INSERT") return json({ ignored: true });
      if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(record.recipient_email || "")) return json({ error: "Invalid recipient" }, 422);
      kind = "program-inquiry";
      message = { to: [...new Set([record.recipient_email, ADMIN])], reply_to: ADMIN, subject: "Sokilé — Nouvelle demande pour votre programme neuf", text: `Bonjour,\n\nUne demande a été enregistrée pour « ${record.title} ».\n\nContact : ${record.contact_name}\nEmail : ${record.email}\nTéléphone : ${record.phone || "Non renseigné"}\n\n${record.message}\n\nRetrouvez la demande dans « Mon compte → Mes programmes neufs » : https://www.sokile.com/?tab=compte\n\nL'équipe Sokilé` };
    } else if (table !== "reports" && record.status !== "en_attente") {
      const responseChanged = ["rejetee", "refusee", "modifications_demandees"].includes(record.status) && moderationResponse(table, record) !== moderationResponse(table, previous);
      if (payload.type !== "UPDATE" || (record.status === previous.status && !responseChanged)) return json({ ignored: true });
      try { message = buildDecisionMessage(table, record); }
      catch (error) { return json({ error: error.message, table, record_id: record.id }, 422); }
      if (!message) return json({ ignored: true });
      kind = "decision";
    } else {
      if (table === "reports" && payload.type !== "INSERT") return json({ ignored: true });
      const action = payload.type === "UPDATE" ? "Modification" : "Nouvelle demande";
      const labels = { properties: "annonce", professionals: "fiche prestataire", advertising_requests: "publicité", reports: "signalement", development_programs: "programme neuf" };
      const title = record.title || record.business_name || record.company || record.reason || `Dossier #${record.id || ""}`;
      const details = [`Type : ${labels[table]}`, `Action : ${action}`, `Titre : ${title}`,
        record.email ? `Email : ${record.email}` : "", record.user_email ? `Email : ${record.user_email}` : "",
        record.country ? `Pays : ${record.country}` : "", record.status ? `Statut : ${record.status}` : "",
        previous.status ? `Ancien statut : ${previous.status}` : ""].filter(Boolean).join("\n");
      message = { to: [ADMIN], subject: `Sokilé — ${action} : ${labels[table]}`, text: `Un dossier nécessite votre attention.\n\n${details}\n\nOuvrez Gestion sur https://www.sokile.com/ pour le contrôler.` };
    }
    const key = env("RESEND_API_KEY");
    if (!key) return json({ error: "Email service unavailable" }, 503);
    const event = JSON.stringify([kind, table, record.id, payload.type, record.status, record.updated_at || record.modere_le || record.created_at, moderationResponse(table, record)]);
    const hash = Array.from(new Uint8Array(await digest(event)), b => b.toString(16).padStart(2, "0")).join("");
    try {
      const result = await send("https://api.resend.com/emails", {
        method: "POST", headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json", "Idempotency-Key": `sokile-${hash}` },
        body: JSON.stringify({ from: env("MAIL_FROM") || "Sokilé <alertes@notifications.sokile.com>", ...message }),
      });
      const body = await result.json().catch(() => ({}));
      if (!result.ok || !body.id) return json({ error: "Email provider rejected request", provider_status: result.status, table, record_id: record.id }, 502);
      return json({ accepted: true, id: body.id, kind, table, record_id: record.id });
    } catch {
      return json({ error: "Email provider unreachable", table, record_id: record.id }, 502);
    }
  };
}
