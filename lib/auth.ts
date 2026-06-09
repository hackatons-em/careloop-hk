// Authentication + authorization (server-only).
//
// Sessions come from Supabase Auth (cookie-based via @supabase/ssr); the
// app-level role + organization live in careloop_profiles. The proxy only
// handles session refresh and redirect UX — EVERY page and API handler
// re-checks here (defense in depth; never trust the proxy alone).

import "server-only";
import { cache } from "react";
import { redirect } from "next/navigation";
import { supa } from "./supabase";
import { createSupabaseServerClient, supabaseAuthConfigured } from "./supabase/server";

export type Role = "admin" | "nurse";

const ROLE_ORDER: Record<Role, number> = { nurse: 0, admin: 1 };

export interface AuthContext {
  userId: string;
  email: string;
  name: string;
  orgId: string;
  role: Role;
}

export interface Profile {
  id: string;
  org_id: string;
  role: Role;
  name: string;
  email: string;
  created_at: string;
}

/**
 * The signed-in user's auth context, or null. Cached per request. Returns null
 * when there is no session OR the session has no careloop_profiles row (an
 * invited-but-never-provisioned or deactivated account has no access).
 */
export const getAuthContext = cache(async (): Promise<AuthContext | null> => {
  if (!supabaseAuthConfigured()) return null;
  const sb = await createSupabaseServerClient();
  const {
    data: { user },
  } = await sb.auth.getUser();
  if (!user) return null;

  const { data, error } = await supa()
    .from("careloop_profiles")
    .select("*")
    .eq("id", user.id)
    .maybeSingle();
  if (error) throw new Error(`Supabase: ${error.message}`);
  if (!data) return null;

  const profile = data as Profile;
  return {
    userId: user.id,
    email: profile.email || user.email || "",
    name: profile.name || user.email || "User",
    orgId: profile.org_id,
    role: profile.role,
  };
});

/** True when the request's Origin (if present) matches the request host —
 * blocks cross-site form/fetch CSRF on cookie-authenticated mutations. */
function csrfOk(req: Request): boolean {
  const method = req.method.toUpperCase();
  if (method === "GET" || method === "HEAD" || method === "OPTIONS") return true;
  const origin = req.headers.get("origin");
  if (!origin) return true; // non-browser clients send no Origin (and no session cookie)
  try {
    const originHost = new URL(origin).host;
    const requestHost = req.headers.get("x-forwarded-host") ?? new URL(req.url).host;
    return originHost === requestHost;
  } catch {
    return false;
  }
}

export type AuthResult =
  | { ctx: AuthContext; response?: never }
  | { ctx?: never; response: Response };

/** Auth gate for API route handlers. 401 anonymous, 403 insufficient role or
 * cross-origin mutation. */
export async function requireAuth(req: Request, minRole: Role = "nurse"): Promise<AuthResult> {
  const ctx = await getAuthContext();
  if (!ctx) {
    return { response: Response.json({ error: "Unauthorized" }, { status: 401 }) };
  }
  if (ROLE_ORDER[ctx.role] < ROLE_ORDER[minRole]) {
    return { response: Response.json({ error: "Forbidden" }, { status: 403 }) };
  }
  if (!csrfOk(req)) {
    return {
      response: Response.json({ error: "Cross-origin request rejected" }, { status: 403 }),
    };
  }
  return { ctx };
}

/** Auth gate for pages (server components). Redirects instead of returning.
 * A session WITHOUT a careloop_profiles row (invited-but-unprovisioned or
 * deactivated account) goes to /auth/no-access — NOT /login, where the proxy
 * would bounce the still-valid session straight back (redirect loop). */
export async function requireAuthOrRedirect(minRole: Role = "nurse"): Promise<AuthContext> {
  const ctx = await getAuthContext();
  if (!ctx) {
    const sb = await createSupabaseServerClient();
    const {
      data: { user },
    } = await sb.auth.getUser();
    redirect(user ? "/auth/no-access" : "/login");
  }
  if (ROLE_ORDER[ctx.role] < ROLE_ORDER[minRole]) redirect("/dashboard");
  return ctx;
}

/** All user profiles in an organization (admin settings page). */
export async function getProfiles(orgId: string): Promise<Profile[]> {
  const { data, error } = await supa()
    .from("careloop_profiles")
    .select("*")
    .eq("org_id", orgId)
    .order("created_at", { ascending: true });
  if (error) throw new Error(`Supabase: ${error.message}`);
  return (data ?? []) as Profile[];
}
