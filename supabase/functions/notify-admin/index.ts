import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createNotificationHandler } from "./handler.mjs";

Deno.serve(createNotificationHandler({ env: key => Deno.env.get(key) }));
