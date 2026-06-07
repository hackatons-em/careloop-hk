import { assignPatientForSender, getPatientPhone, setPatientPhone } from "@/lib/conversation";
import { ingestCheckInMessage } from "@/lib/ingest";
import { getPatient } from "@/lib/store";

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
// The conversational check-in agent (lib/ingest -> lib/conversation) handles the
// message: STT if it's a voice note, AI symptom extraction, the deterministic
// engine, and it decides the reply — a follow-up question when info is still
// missing, or a confirmation (complete / escalated). The reply is returned as
// TwiML, closing the loop right back in the patient's WhatsApp chat.
export async function POST(req: Request) {
  let form: FormData;
  try {
    form = await req.formData();
  } catch {
    return twiml("多謝！我哋暫時處理唔到你嘅訊息，請再試一次。");
  }

  const body = (form.get("Body")?.toString() ?? "").trim();
  const numMedia = Number.parseInt(form.get("NumMedia")?.toString() ?? "0", 10) || 0;
  const from = form.get("From")?.toString() ?? "";

  // Personalised onboarding: a register message from a patient's own QR carries
  // "careloop-link:<patientId>". Bind THIS sender to THAT patient so we know who
  // they are and route their check-ins. This is registration, not a check-in.
  const link = body.match(/careloop-link:([\w-]+)/i);
  if (link && from) {
    const patient = await getPatient(link[1]);
    if (patient) {
      // 1:1 — once a patient is connected to a phone, no other phone may take it.
      const existing = await getPatientPhone(patient.id);
      if (existing && existing !== from) {
        return twiml(
          `Sorry — ${patient.name} is already connected to another phone. Add a fresh demo patient and scan its own QR.`,
        );
      }
      await setPatientPhone(patient.id, from);
      return twiml(
        `You're connected, ${patient.name}. CareLoop will send your daily check-in here — just reply each day.`,
      );
    }
  }

  // Map the sender to a patient (sticky), and remember the number so the agent
  // can message them first next time.
  const patientId = await assignPatientForSender(from);
  if (from) await setPatientPhone(patientId, from);

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
    patientId,
    text: body,
    audioUrl,
    audioContentType,
  });
  if (!result) {
    return twiml("多謝！我哋收到咗你嘅訊息。Thank you — we've received your message.");
  }
  return twiml(result.reply);
}
