import { requireAuth } from "@/lib/auth";
import { completeTask } from "@/lib/store";
import { parseBody, taskPatchSchema } from "@/lib/validation";

export const dynamic = "force-dynamic";

// PATCH /api/tasks/:id — mark a follow-up task done.
export async function PATCH(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const auth = await requireAuth(req);
  if (auth.response) return auth.response;
  const { id } = await ctx.params;
  const body = await parseBody(req, taskPatchSchema);
  if (!body.ok) return body.response;
  const task = await completeTask(auth.ctx.orgId, id, auth.ctx.email);
  if (!task) return Response.json({ error: "Task not found" }, { status: 404 });
  return Response.json(task);
}
