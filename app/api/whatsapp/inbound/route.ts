import { getPatientForPhone, setPatientPhone } from "@/lib/conversation";
import { ingestCheckInMessage } from "@/lib/ingest";
import { getDefaultOrgId } from "@/lib/org";
import { enforceRateLimit } from "@/lib/rateLimit";
import { createPatientFromWhatsApp, getPatient } from "@/lib/store";
import { requireTwilioSignature } from "@/lib/twilioSig";

export const dynamic = "force-dynamic";

const XML_ESCAPE: Record<string, string> = {
  "<": "&lt;",
  ">": "&gt;",
  "&": "&amp;",
  "'": "&apos;",
  '"': "&quot;",
};
function twiml(message: string): Response {
  const safe = message.replace(/[<>&'"]/g, (c) => XML_ESCAPE[c] ?? c);
  const xml = `<?xml version="1.0" encoding="UTF-8"?><Response><Message>${safe}</Message></Response>`;
  return new Response(xml, { headers: { "Content-Type": "text/xml; charset=utf-8" } });
}

// POST /api/whatsapp/inbound — Twilio WhatsApp inbound webhook.
//
// Security: X-Twilio-Signature validation (lib/twilioSig.ts) + per-phone rate
// limit. The conversational check-in agent (lib/ingest -> lib/conversation)
// handles the message: STT if it's a voice note, AI symptom extraction, the
// deterministic engine, and it decides the reply — a follow-up question when
// info is still missing, or a confirmation (complete / escalated). The reply is
// returned as TwiML, closing the loop right back in the patient's WhatsApp chat.
export async function POST(req: Request) {
  let form: FormData;
  try {
    form = await req.formData();
  } catch {
    return twiml("多謝！我哋暫時處理唔到你嘅訊息，請再試一次。");
  }

  const forged = requireTwilioSignature(req, form);
  if (forged) return forged;

  const body = (form.get("Body")?.toString() ?? "").trim();
  const numMedia = Number.parseInt(form.get("NumMedia")?.toString() ?? "0", 10) || 0;
  const from = form.get("From")?.toString() ?? "";

  const limited = await enforceRateLimit("webhook", from || "unknown");
  if (limited) return limited;

  const orgId = await getDefaultOrgId();

  // Map the sender to a patient. Existing number -> its patient. New number ->
  // auto-create: DEMO_MODE clones a realistic mock; production creates a
  // minimal record flagged pending_review for a nurse to confirm.
  const fixed = process.env.CARELOOP_WHATSAPP_PATIENT || undefined;
  let linked = !fixed && from ? await getPatientForPhone(orgId, from) : null;
  // a link pointing at a patient that no longer exists (e.g. after a demo reset)
  // is treated as a new number — recreate rather than dead-end.
  if (linked && !(await getPatient(orgId, linked))) linked = null;
  const isNewPatient = !fixed && !linked;
  // createPatientFromWhatsApp is race-safe: a unique (org_id, phone) index on
  // patients makes the loser of two concurrent first messages re-read the winner.
  const patientId = fixed ?? linked ?? (await createPatientFromWhatsApp(orgId, from));
  if (from) await setPatientPhone(orgId, patientId, from);

  let audioUrl: string | null = null;
  let audioContentType: string | null = null;
  if (numMedia > 0) {
    const ct = form.get("MediaContentType0")?.toString() ?? "";
    if (ct.startsWith("audio")) {
      audioUrl = form.get("MediaUrl0")?.toString() ?? null;
      audioContentType = ct;
    }
  }

  const result = await ingestCheckInMessage({
    orgId,
    patientId,
    text: body,
    audioUrl,
    audioContentType,
  });
  if (!result) {
    return twiml("多謝！我哋收到咗你嘅訊息。Thank you — we've received your message.");
  }
  // On the first message, confirm enrolment to the sender.
  if (isNewPatient) {
    return twiml(
      `多謝！你已經登記咗 CareLoop 每日報到。Thank you — you're now enrolled in CareLoop daily check-ins. A nurse will review your details.\n\n${result.reply}`,
    );
  }
  return twiml(result.reply);
}
