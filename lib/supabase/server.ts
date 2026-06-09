// Supabase SSR client bound to the request cookies (server components, route
// handlers, proxy). Uses the ANON key — this client exists ONLY to read and
// refresh the auth session. All data access stays in lib/store.ts behind the
// service-role client (lib/supabase.ts); RLS denies the anon key everything.

import "server-only";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

export async function createSupabaseServerClient() {
  const cookieStore = await cookies();
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options),
            );
          } catch {
            // Called from a Server Component (no cookie write access) — fine:
            // the proxy refreshes sessions, so writes here are best-effort.
          }
        },
      },
    },
  );
}

export function supabaseAuthConfigured(): boolean {
  return Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  );
}
