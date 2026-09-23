import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createAlertsHandler } from "./handler.mjs";
Deno.serve(createAlertsHandler({ env: key => Deno.env.get(key) }));
