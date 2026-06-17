import { logger } from "@/lib/logger";
import { getDefaultOrgId } from "@/lib/org";
import { clientIp, enforceRateLimit } from "@/lib/rateLimit";
import { createPatientFromIntake } from "@/lib/store";
import { parseBody, patientIntakeSchema } from "@/lib/validation";

export const dynamic = "force-dynamic";

// POST /api/intake — public QR self-intake. Rate-limited per IP; a hidden
// honeypot field gets a silent success (don't teach bots). Creates a
// pending_review patient from the submitted data; never overwrites an existing
// active/archived patient, and always responds the same shape so the endpoint
// can't be used to probe whether a phone number is already registered.
export async function POST(req: Request) {
  const limited = await enforceRateLimit("intake", clientIp(req));
  if (limited) return limited;

  const body = await parseBody(req, patientIntakeSchema);
  if (!body.ok) return body.response;

  if (body.data.website) {
    logger.info("Intake honeypot tripped.", { ip: clientIp(req) });
    return Response.json({ ok: true }, { status: 201 });
  }

  try {
    const orgId = await getDefaultOrgId();
    await createPatientFromIntake(orgId, body.data);
  } catch (err) {
    logger.error("Intake create failed.", {
      err: err instanceof Error ? err.message : String(err),
    });
    return Response.json({ error: "Could not complete registration" }, { status: 500 });
  }
  return Response.json({ ok: true }, { status: 201 });
}
