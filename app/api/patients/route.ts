import { getPatientRows } from "@/lib/store";

export const dynamic = "force-dynamic";

// GET /api/patients — dashboard rows (patient + deterministic risk + status)
export async function GET() {
  return Response.json(await getPatientRows());
}
