import { parseVitalsCsv } from "@/lib/csv";
import { importCsv, type CsvRow } from "@/lib/store";

export const dynamic = "force-dynamic";

// POST /api/demo/import-csv — import wearable/vital CSV for a patient.
// Body: { patient_id?, csv?: string, rows?: CsvRow[] }. Defaults to Mrs. Chan.
export async function POST(req: Request) {
  const body = (await req.json().catch(() => ({}))) as {
    patient_id?: string;
    csv?: string;
    rows?: CsvRow[];
  };
  const patientId = body.patient_id ?? "patient-mrs-chan";
  const rows = body.rows ?? (body.csv ? parseVitalsCsv(body.csv) : []);
  if (rows.length === 0) {
    return Response.json({ error: "No rows to import (provide csv or rows)" }, { status: 400 });
  }
  const risk = await importCsv(patientId, rows, "nurse");
  if (!risk) return Response.json({ error: "Patient not found" }, { status: 404 });
  return Response.json({ ok: true, imported: rows.length, risk }, { status: 201 });
}
