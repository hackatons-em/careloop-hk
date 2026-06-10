import { requireAuth } from "@/lib/auth";
import { runWeeklyDigest } from "@/lib/digest";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

// POST /api/agent/weekly-digest — manual admin trigger. The scheduled run
// rides the Monday leg of /api/agent/sweep (Vercel Hobby allows two crons).
export async function POST(req: Request) {
  const auth = await requireAuth(req, "admin");
  if (auth.response) return auth.response;
  return Response.json(await runWeeklyDigest(auth.ctx.orgId));
}
