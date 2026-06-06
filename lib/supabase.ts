// Server-only Supabase client (service-role). Uses the REST/PostgREST API over
// HTTP, which is serverless-safe (no connection pooling to manage). NEVER import
// this from a Client Component — the service-role key must stay on the server.
//
// Lazily constructed so importing this module never requires env at build time;
// the client is created on first use (request time) and throws clearly if the
// Supabase env is missing.

import "server-only"; // hard build-time guard: never bundle the service-role key into a client component
import { createClient, type SupabaseClient } from "@supabase/supabase-js";

let client: SupabaseClient | null = null;

export function supa(): SupabaseClient {
  if (client) return client;
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    throw new Error(
      "Supabase is not configured. Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY (.env.local / Vercel env).",
    );
  }
  client = createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  return client;
}

/** True when Supabase env is present (used by tests to skip when no DB). */
export function supabaseConfigured(): boolean {
  return Boolean(process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY);
}
