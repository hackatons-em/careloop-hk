import { getAlerts } from "@/lib/store";

export const dynamic = "force-dynamic";

// GET /api/alerts — nurse review queue
export async function GET() {
  return Response.json(getAlerts());
}
