import { requireAuth } from "@/lib/auth";
import { updateAlert } from "@/lib/store";
import { alertPatchSchema, parseBody } from "@/lib/validation";

export const dynamic = "force-dynamic";

// PATCH /api/alerts/:id — acknowledge / change status / add nurse note.
// The audit actor is always the signed-in user (never client-supplied).
export async function PATCH(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const auth = await requireAuth(req);
  if (auth.response) return auth.response;
  const { id } = await ctx.params;
  const body = await parseBody(req, alertPatchSchema);
  if (!body.ok) return body.response;
  const alert = await updateAlert(auth.ctx.orgId, id, body.data, auth.ctx.email);
  if (!alert) return Response.json({ error: "Alert not found" }, { status: 404 });
  return Response.json(alert);
}
