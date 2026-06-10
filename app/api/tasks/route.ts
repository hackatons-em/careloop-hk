import { requireAuth } from "@/lib/auth";
import { createTask, getOpenTasks } from "@/lib/store";
import { parseBody, taskCreateSchema } from "@/lib/validation";

export const dynamic = "force-dynamic";

// GET /api/tasks — open follow-up tasks for the org, soonest due first.
export async function GET(req: Request) {
  const auth = await requireAuth(req);
  if (auth.response) return auth.response;
  return Response.json(await getOpenTasks(auth.ctx.orgId));
}

// POST /api/tasks — create a follow-up task (e.g. from the alert ack flow).
export async function POST(req: Request) {
  const auth = await requireAuth(req);
  if (auth.response) return auth.response;
  const body = await parseBody(req, taskCreateSchema);
  if (!body.ok) return body.response;
  const task = await createTask(auth.ctx.orgId, body.data, auth.ctx.email);
  if (!task) return Response.json({ error: "Patient not found" }, { status: 404 });
  return Response.json(task, { status: 201 });
}
