const json = (body, status = 200) => new Response(JSON.stringify(body), { status, headers: { "Content-Type": "application/json" } });
export function buildAlertEmail(payload) {
  const p = payload.property;
  const clean = value => String(value || "").replace(/[\r\n\u0000-\u001f]/g, " ").trim();
  const title = clean(p.title);
  return {
    to: [payload.email], reply_to: "contact@sokile.com",
    subject: `Sokilé — Un bien correspond à votre recherche : ${title}`,
    text: ["Bonjour,", "Une nouvelle annonce correspond aux critères de votre alerte :",
      title, `${clean(p.city)}, ${clean(p.country)}`,
      p.price_eur != null ? `${new Intl.NumberFormat("fr-FR").format(p.price_eur)} €` : "",
      `Voir l'annonce : https://www.sokile.com/annonce/${encodeURIComponent(p.id)}`,
      `Cette alerte est valable jusqu'au ${new Date(payload.expires_at).toLocaleDateString("fr-FR", { timeZone: "UTC" })}.`,
      `Annuler cette alerte : https://www.sokile.com/?annuler_alerte=${encodeURIComponent(payload.token)}`,
      "Gérer mes alertes : https://www.sokile.com/?tab=compte", "L'équipe Sokilé",
    ].filter(Boolean).join("\n\n"),
  };
}

export function createAlertsHandler({ env, send = fetch }) {
  return async req => {
    if (req.method !== "POST") return json({ error: "Method not allowed" }, 405);
    if (!env("WEBHOOK_SECRET") || req.headers.get("x-webhook-secret") !== env("WEBHOOK_SECRET")) return json({ error: "Unauthorized" }, 401);
    const supabase = env("SUPABASE_URL"), service = env("SUPABASE_SERVICE_ROLE_KEY"), resend = env("RESEND_API_KEY");
    if (!supabase || !service || !resend) return json({ error: "Configuration incomplete" }, 503);
    const rpc = async (name, body = {}) => {
      const response = await send(`${supabase}/rest/v1/rpc/${name}`, { method: "POST", headers: { apikey: service, Authorization: `Bearer ${service}`, "Content-Type": "application/json" }, body: JSON.stringify(body), signal: AbortSignal.timeout(10000) });
      if (!response.ok) throw new Error(`Database request failed (${response.status})`);
      return response.json();
    };
    let sent = 0, skipped = 0, failed = 0;
    try {
      if (!await rpc("sokile_alerts_available")) return json({ paused: true });
      const deliveries = await rpc("sokile_claim_alert_deliveries");
      const started = Date.now();
      for (const delivery of deliveries) {
        if (Date.now() - started > 60000) break; // Les réservations restantes seront reprises.
        const params = { p_id: delivery.id, p_lease: delivery.lease_token };
        try {
          const payload = await rpc("sokile_alert_delivery_payload", params);
          if (!payload) { skipped++; continue; }
          const response = await send("https://api.resend.com/emails", {
            method: "POST", headers: { Authorization: `Bearer ${resend}`, "Content-Type": "application/json", "Idempotency-Key": `sokile-search-${delivery.id}` },
            body: JSON.stringify({ from: env("MAIL_FROM") || "Sokilé <alertes@notifications.sokile.com>", ...buildAlertEmail(payload) }),
            signal: AbortSignal.timeout(10000),
          });
          const body = await response.json().catch(() => ({}));
          if (!response.ok || !body.id) throw new Error(`Email provider rejected request (${response.status})`);
          const recorded = await rpc("sokile_finish_alert_delivery", { ...params, p_provider_id: body.id, p_error: null });
          if (!recorded) throw new Error("Delivery acknowledgement failed");
          sent++;
        } catch (error) {
          failed++;
          await rpc("sokile_finish_alert_delivery", { ...params, p_provider_id: null, p_error: String(error.message).slice(0, 200) }).catch(() => {});
        }
      }
      return json({ sent, skipped, failed }, failed ? 502 : 200);
    } catch { return json({ error: "Alert processing unavailable", sent, skipped, failed }, 503); }
  };
}
