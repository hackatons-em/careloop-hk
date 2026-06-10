import { requireAuth } from "@/lib/auth";
import { resolveTask } from "@/lib/store";
import { parseBody, taskPatchSchema } from "@/lib/validation";

export const dynamic = "force-dynamic";

// PATCH /api/tasks/:id — resolve a follow-up task: done (completed) or
// cancelled (created in error). Org-scoped in the store layer.
export async function PATCH(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const auth = await requireAuth(req);
  if (auth.response) return auth.response;
  const { id } = await ctx.params;
  const body = await parseBody(req, taskPatchSchema);
  if (!body.ok) return body.response;
  const task = await resolveTask(auth.ctx.orgId, id, body.data.status, auth.ctx.email);
  if (!task) return Response.json({ error: "Task not found" }, { status: 404 });
  return Response.json(task);
}
