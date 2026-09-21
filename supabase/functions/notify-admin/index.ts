import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const ADMIN = "contact@sokile.com";
const allowed = new Set(["properties","professionals","advertising_requests","reports"]);

Deno.serve(async (req) => {
  if (req.method !== "POST") return new Response("Method not allowed", { status:405 });
  if (req.headers.get("x-webhook-secret") !== Deno.env.get("WEBHOOK_SECRET")) return new Response("Unauthorized", {status:401});
  const payload = await req.json().catch(()=>null);
  const table = payload?.table;
  if (!payload || !allowed.has(table)) return new Response("Ignored", {status:200});
  const record = payload.record || {};
  const previous = payload.old_record || {};
  if (table !== "reports" && record.status !== "en_attente") return new Response("Ignored", {status:200});
  const action = payload.type === "UPDATE" ? "Modification" : "Nouvelle demande";
  const labels:Record<string,string> = {properties:"annonce",professionals:"fiche prestataire",advertising_requests:"publicité",reports:"signalement"};
  const title = record.title || record.business_name || record.company || record.reason || `Dossier #${record.id||""}`;
  const details = [
    `Type : ${labels[table]}`, `Action : ${action}`, `Titre : ${title}`,
    record.email ? `Email : ${record.email}` : "", record.user_email ? `Email : ${record.user_email}` : "",
    record.country ? `Pays : ${record.country}` : "", record.status ? `Statut : ${record.status}` : "",
    previous.status ? `Ancien statut : ${previous.status}` : "",
  ].filter(Boolean).join("\n");
  const resend = await fetch("https://api.resend.com/emails", {method:"POST",headers:{"Authorization":`Bearer ${Deno.env.get("RESEND_API_KEY")}`,"Content-Type":"application/json"},body:JSON.stringify({from:Deno.env.get("MAIL_FROM")||"Sokilé <alertes@notifications.sokile.com>",to:[ADMIN],subject:`Sokilé — ${action} : ${labels[table]}`,text:`Un dossier nécessite votre attention.\n\n${details}\n\nOuvrez Supabase > Table Editor pour le contrôler.`})});
  return new Response(await resend.text(), {status:resend.ok?200:502,headers:{"Content-Type":"application/json"}});
});
