import { NextResponse, type NextRequest } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

// GET /auth/callback — completes the PKCE flow for invite / recovery links
// (?code=...), establishing the session cookie, then forwards to `next`
// (default: the set-password screen for fresh invites).
export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const code = url.searchParams.get("code");
  const rawNext = url.searchParams.get("next") ?? "/auth/update-password";
  // Same-site paths only — "//evil.example" is protocol-relative, reject it.
  const next =
    rawNext.startsWith("/") && !rawNext.startsWith("//") ? rawNext : "/auth/update-password";

  if (code) {
    const supabase = await createSupabaseServerClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      return NextResponse.redirect(new URL(next, url.origin));
    }
  }
  return NextResponse.redirect(new URL("/login", url.origin));
}
