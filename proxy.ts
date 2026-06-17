// Route protection + Supabase session refresh (Next.js 16 proxy — the renamed
// middleware.ts). This layer is redirect UX and cookie refresh ONLY: every page
// and API handler independently re-checks auth via lib/auth.ts, so a bypassed
// proxy never exposes data.

import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

const PUBLIC_PAGES = new Set([
  "/",
  "/login",
  "/business",
  "/presentation",
  "/architecture",
  "/privacy",
  "/terms",
  "/pricing",
  "/security",
  "/contact",
  "/intake",
]);

// Routes that manage their own authentication (webhook signature, cron bearer
// token, the auth flow itself, or per-route checks like the public lead form).
const PUBLIC_PREFIXES = [
  "/auth",
  "/api/whatsapp",
  "/api/agent",
  "/api/auth",
  "/api/health",
  "/api/leads",
  "/api/intake",
  "/api/wearable/terra",
];

function isPublic(path: string): boolean {
  if (PUBLIC_PAGES.has(path)) return true;
  return PUBLIC_PREFIXES.some((p) => path === p || path.startsWith(`${p}/`));
}

export default async function proxy(request: NextRequest) {
  const path = request.nextUrl.pathname;

  // Without auth env (early local dev) pass everything through; the page/API
  // layer still denies whatever needs a session.
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !anonKey) return NextResponse.next();

  let response = NextResponse.next({ request });
  const supabase = createServerClient(url, anonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
        response = NextResponse.next({ request });
        cookiesToSet.forEach(({ name, value, options }) =>
          response.cookies.set(name, value, options),
        );
      },
    },
  });

  // Refreshes the session cookie when expired — required on every request.
  // Fail open on auth-service outages: public pages keep working, and every
  // protected page/handler re-checks auth itself (defense in depth), so a
  // skipped proxy check never exposes data.
  let user: { id: string } | null = null;
  try {
    const { data } = await supabase.auth.getUser();
    user = data.user;
  } catch (err) {
    console.error("[careloop] proxy session check failed (auth service unreachable?):", err);
    if (!isPublic(path)) {
      if (path.startsWith("/api/")) {
        return NextResponse.json({ error: "Service unavailable" }, { status: 503 });
      }
      const login = request.nextUrl.clone();
      login.pathname = "/login";
      login.search = "";
      return NextResponse.redirect(login);
    }
    return response;
  }

  if (!user && !isPublic(path)) {
    if (path.startsWith("/api/")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const login = request.nextUrl.clone();
    login.pathname = "/login";
    login.search = "";
    if (path !== "/") login.searchParams.set("next", path);
    return NextResponse.redirect(login);
  }

  if (user && path === "/login") {
    const home = request.nextUrl.clone();
    home.pathname = "/dashboard";
    home.search = "";
    return NextResponse.redirect(home);
  }

  return response;
}

export const config = {
  // Everything except Next internals and static assets.
  matcher: [
    "/((?!_next/static|_next/image|favicon\\.ico|icon\\.svg|robots\\.txt|sitemap\\.xml|manifest\\.webmanifest|opengraph-image|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
