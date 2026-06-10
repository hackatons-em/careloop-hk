import { requireAuth } from "@/lib/auth";
import { getOrgSettings, updateOrgSettings } from "@/lib/orgSettings";
import { recordAudit } from "@/lib/store";
import { orgSettingsSchema, parseBody } from "@/lib/validation";

export const dynamic = "force-dynamic";

// GET /api/admin/org-settings — current org operational settings (admin).
export async function GET(req: Request) {
  const auth = await requireAuth(req, "admin");
  if (auth.response) return auth.response;
  return Response.json(await getOrgSettings(auth.ctx.orgId));
}

// PATCH /api/admin/org-settings — update notification/SLA settings (admin).
export async function PATCH(req: Request) {
  const auth = await requireAuth(req, "admin");
  if (auth.response) return auth.response;
  const body = await parseBody(req, orgSettingsSchema);
  if (!body.ok) return body.response;

  const updated = await updateOrgSettings(auth.ctx.orgId, body.data);
  await recordAudit(auth.ctx.orgId, "org_settings_updated", auth.ctx.email, "organization", auth.ctx.orgId, {
    fields: Object.keys(body.data),
  });
  return Response.json(updated);
}
