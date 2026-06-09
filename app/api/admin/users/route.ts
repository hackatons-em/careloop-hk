import { createClient } from "@supabase/supabase-js";
import { getProfiles, requireAuth } from "@/lib/auth";
import { logger } from "@/lib/logger";
import { enforceRateLimit, clientIp } from "@/lib/rateLimit";
import { recordAudit } from "@/lib/store";
import { supa } from "@/lib/supabase";
import { inviteUserSchema, parseBody } from "@/lib/validation";

export const dynamic = "force-dynamic";

// GET /api/admin/users — list the organization's user profiles (admin only).
export async function GET(req: Request) {
  const auth = await requireAuth(req, "admin");
  if (auth.response) return auth.response;
  return Response.json(await getProfiles(auth.ctx.orgId));
}

// POST /api/admin/users — invite a nurse/admin by email (admin only).
// Sends a Supabase Auth invite email; the profile row (org + role) is created
// here so the invitee has access the moment they set a password.
export async function POST(req: Request) {
  const auth = await requireAuth(req, "admin");
  if (auth.response) return auth.response;

  const limited = await enforceRateLimit("auth", clientIp(req));
  if (limited) return limited;

  const body = await parseBody(req, inviteUserSchema);
  if (!body.ok) return body.response;
  const { email, name, role } = body.data;

  // auth.admin requires the service-role key; reuse the data client's creds.
  const admin = createClient(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false, autoRefreshToken: false } },
  );

  const redirectTo = process.env.NEXT_PUBLIC_SITE_URL
    ? `${process.env.NEXT_PUBLIC_SITE_URL}/auth/callback?next=/auth/update-password`
    : undefined;
  const { data, error } = await admin.auth.admin.inviteUserByEmail(email, { redirectTo });
  if (error || !data.user) {
    logger.warn("User invite failed.", { email, err: error?.message });
    const status = error?.status === 422 ? 409 : 502;
    return Response.json(
      { error: error?.message ?? "Invite failed" },
      { status },
    );
  }

  const { error: profileErr } = await supa().from("careloop_profiles").insert({
    id: data.user.id,
    org_id: auth.ctx.orgId,
    role,
    name,
    email,
  });
  if (profileErr) {
    // Don't leave an orphaned auth user without a profile (it would have no access).
    await admin.auth.admin.deleteUser(data.user.id).catch((err) => {
      logger.error("Orphan cleanup after profile insert failure also failed.", { err });
    });
    return Response.json({ error: `Profile creation failed: ${profileErr.message}` }, { status: 500 });
  }

  await recordAudit(auth.ctx.orgId, "user_invited", auth.ctx.email, "user", data.user.id, {
    email,
    role,
  });
  return Response.json({ ok: true, id: data.user.id, email, name, role }, { status: 201 });
}
