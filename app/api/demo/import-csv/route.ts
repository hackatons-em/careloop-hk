import { z } from "zod";
import { requireAuth } from "@/lib/auth";
import { parseVitalsCsv } from "@/lib/csv";
import { importCsv } from "@/lib/store";
import { csvImportSchema, csvRowSchema, parseBody } from "@/lib/validation";

export const dynamic = "force-dynamic";

// POST /api/demo/import-csv — import wearable/vital CSV for a patient.
// Body: { patient_id?, csv?: string, rows?: CsvRow[] }.
// Nurse feature (not demo-gated): wearable CSV import is a real workflow.
// Range validation applies to BOTH input paths — pre-parsed `rows` are
// validated by the schema; a raw `csv` string is parsed server-side and the
// parsed rows re-validated here so out-of-range vitals can never be stored.
export async function POST(req: Request) {
  const auth = await requireAuth(req);
  if (auth.response) return auth.response;
  const body = await parseBody(req, csvImportSchema);
  if (!body.ok) return body.response;
  const patientId = body.data.patient_id;
  if (!patientId) {
    return Response.json({ error: "patient_id is required" }, { status: 400 });
  }

  let rows = body.data.rows ?? [];
  if (!rows.length && body.data.csv) {
    const parsed = z.array(csvRowSchema).safeParse(parseVitalsCsv(body.data.csv));
    if (!parsed.success) {
      return Response.json(
        {
          error: "CSV contains invalid or out-of-range values",
          issues: parsed.error.issues.slice(0, 10).map((i) => ({
            row: Number(i.path[0]) + 1,
            field: String(i.path[1] ?? ""),
            message: i.message,
          })),
        },
        { status: 400 },
      );
    }
    rows = parsed.data;
  }

  if (rows.length === 0) {
    return Response.json({ error: "No rows to import (provide csv or rows)" }, { status: 400 });
  }
  const risk = await importCsv(auth.ctx.orgId, patientId, rows, auth.ctx.email);
  if (!risk) return Response.json({ error: "Patient not found" }, { status: 404 });
  return Response.json({ ok: true, imported: rows.length, risk }, { status: 201 });
}
