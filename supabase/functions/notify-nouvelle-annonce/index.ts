// Ancien point d’entrée conservé pour les webhooks existants.
// Les dépôts sont suivis dans Gestion, sans email administrateur.
Deno.serve(() => new Response(JSON.stringify({ ok: true, ignored: true, reason: "managed_in_admin" }), { status: 200, headers: { "Content-Type": "application/json" } }));
