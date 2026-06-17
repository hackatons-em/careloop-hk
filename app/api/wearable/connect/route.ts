import { requireAuth } from "@/lib/auth";
import { logger } from "@/lib/logger";
import { getPatient } from "@/lib/store";
import { generateWidgetSession, terraConfigured } from "@/lib/terra";
import { parseBody, wearableConnectSchema } from "@/lib/validation";

export const dynamic = "force-dynamic";

// POST /api/wearable/connect — nurse/admin starts a device-connect session for a
// patient. Returns the Terra widget URL (shown as a QR / link for the patient to
// open on their own phone). reference_id = our patient id, so the resulting Terra
// `auth` webhook tells us which patient connected.
export async function POST(req: Request) {
  const auth = await requireAuth(req);
  if (auth.response) return auth.response;

  if (!terraConfigured()) {
    return Response.json({ error: "Wearable sync is not configured" }, { status: 503 });
  }

  const body = await parseBody(req, wearableConnectSchema);
  if (!body.ok) return body.response;

  const patient = await getPatient(auth.ctx.orgId, body.data.patient_id);
  if (!patient) return Response.json({ error: "Patient not found" }, { status: 404 });

  try {
    const site = process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/+$/, "");
    const session = await generateWidgetSession({
      referenceId: patient.id,
      successUrl: site ? `${site}/patients/${patient.id}?connected=1` : undefined,
      failureUrl: site ? `${site}/patients/${patient.id}?connected=0` : undefined,
    });
    return Response.json({ url: session.url, expires_in: session.expires_in });
  } catch (err) {
    logger.error("Wearable connect failed.", {
      err: err instanceof Error ? err.message : String(err),
    });
    return Response.json({ error: "Could not start device connection" }, { status: 502 });
  }
}
