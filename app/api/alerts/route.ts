import { requireAuth } from "@/lib/auth";
import { getAlerts } from "@/lib/store";

export const dynamic = "force-dynamic";

// GET /api/alerts — nurse review queue
export async function GET(req: Request) {
  const auth = await requireAuth(req);
  if (auth.response) return auth.response;
  return Response.json(await getAlerts(auth.ctx.orgId));
}
