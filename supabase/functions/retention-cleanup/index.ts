import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createRetentionHandler } from "./handler.mjs";
Deno.serve(createRetentionHandler({env:key=>Deno.env.get(key)}));
