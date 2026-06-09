import { requireAuth } from "@/lib/auth";
import { getAuditEvents } from "@/lib/store";
import { auditQuerySchema } from "@/lib/validation";

export const dynamic = "force-dynamic";

// GET /api/audit-events?limit=50 — append-only audit trail (newest first)
export async function GET(req: Request) {
  const auth = await requireAuth(req);
  if (auth.response) return auth.response;
  const raw = new URL(req.url).searchParams.get("limit");
  const parsed = auditQuerySchema.safeParse(raw ?? 50);
  const limit = parsed.success ? parsed.data : 50;
  return Response.json(await getAuditEvents(auth.ctx.orgId, limit));
}
