import { getAuditEvents } from "@/lib/store";

export const dynamic = "force-dynamic";

// GET /api/audit-events?limit=50 — append-only audit trail (newest first)
export async function GET(req: Request) {
  const raw = Number(new URL(req.url).searchParams.get("limit"));
  const limit = Number.isFinite(raw) && raw > 0 ? Math.floor(raw) : undefined;
  return Response.json(await getAuditEvents(limit));
}
