import { buildDecisionMessage, moderationResponse } from "./moderation.mjs";

const ADMIN = "contact@sokile.com";
const allowed = new Set(["properties", "professionals", "advertising_requests", "reports"]);
const json = (body, status = 200) => new Response(JSON.stringify(body), { status, headers: { "Content-Type": "application/json" } });

export function createNotificationHandler({ env, send = fetch, digest = value => crypto.subtle.digest("SHA-256", new TextEncoder().encode(value)) }) {
  return async req => {
    if (req.method !== "POST") return json({ error: "Method not allowed" }, 405);
    const secret = env("WEBHOOK_SECRET");
    if (!secret || req.headers.get("x-webhook-secret") !== secret) return json({ error: "Unauthorized" }, 401);
    const payload = await req.json().catch(() => null);
    const table = payload?.table;
    if (!allowed.has(table) || !["INSERT", "UPDATE"].includes(payload?.type)) return json({ ignored: true });
    const record = payload.record || {}, previous = payload.old_record || {};
    let message;
    let kind = "admin";
    if (table !== "reports" && record.status !== "en_attente") {
      const responseChanged = ["rejetee", "refusee", "modifications_demandees"].includes(record.status) && moderationResponse(table, record) !== moderationResponse(table, previous);
      if (payload.type !== "UPDATE" || (record.status === previous.status && !responseChanged)) return json({ ignored: true });
      try { message = buildDecisionMessage(table, record); }
      catch (error) { return json({ error: error.message, table, record_id: record.id }, 422); }
      if (!message) return json({ ignored: true });
      kind = "decision";
    } else {
      if (table === "reports" && payload.type !== "INSERT") return json({ ignored: true });
      const action = payload.type === "UPDATE" ? "Modification" : "Nouvelle demande";
      const labels = { properties: "annonce", professionals: "fiche prestataire", advertising_requests: "publicité", reports: "signalement" };
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
