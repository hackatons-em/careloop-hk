import { logger } from "@/lib/logger";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

// POST /api/auth/signout — clears the Supabase session cookies server-side.
// No requireAuth: a session WITHOUT a profile (no-access state) must still be
// able to sign out. Origin is checked instead so a cross-site page can't
// force-logout users, and failures still return ok — the client redirects to
// /login either way and the cookie is invalid there.
export async function POST(req: Request) {
  const origin = req.headers.get("origin");
  if (origin) {
    try {
      const originHost = new URL(origin).host;
      const requestHost = req.headers.get("x-forwarded-host") ?? new URL(req.url).host;
      if (originHost !== requestHost) {
        return Response.json({ error: "Cross-origin request rejected" }, { status: 403 });
      }
    } catch {
      return Response.json({ error: "Cross-origin request rejected" }, { status: 403 });
    }
  }

  try {
    const sb = await createSupabaseServerClient();
    await sb.auth.signOut();
  } catch (err) {
    logger.warn("Sign-out failed (auth service unreachable?)", { err });
  }
  return Response.json({ ok: true });
}
