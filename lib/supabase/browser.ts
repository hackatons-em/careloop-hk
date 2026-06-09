// Browser Supabase client (anon key) — used ONLY for the login session
// (sign-in, sign-out, password update). RLS denies the anon key all table
// access; data flows exclusively through the server APIs.

import { createBrowserClient } from "@supabase/ssr";

export function createSupabaseBrowserClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  );
}
