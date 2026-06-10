import { requireAuth } from "@/lib/auth";
import { requireCronAuthIfConfigured } from "@/lib/cronAuth";
import { logger } from "@/lib/logger";
import { emailFamilyDigest } from "@/lib/notify";
import { getDefaultOrgId } from "@/lib/org";
import { getPatients, getTimeline, recordAudit, saveWeeklySummary } from "@/lib/store";
import { generateWeeklySummary } from "@/lib/summaryService";
import type { WeeklySummary } from "@/lib/types";
import { sendWhatsApp } from "@/lib/whatsapp";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

// Weekly family digest: for every active patient whose family consented,
// generate (and store) the weekly summary, then deliver the bilingual
// caregiver text by email and/or WhatsApp. Good news is sent too — families
// shouldn't only hear from CareLoop when something is wrong.
async function runDigest(orgId: string) {
  const patients = (await getPatients(orgId)).filter(
    (p) =>
      p.status === "active" &&
      p.consent_family_digest &&
      (p.caregiver_email || p.caregiver_phone),
  );

  let sent = 0;
  for (const patient of patients) {
    const timeline = await getTimeline(orgId, patient.id);
    if (!timeline) continue;
    const partial = await generateWeeklySummary(timeline);
    const summary: WeeklySummary = {
      id: `summary-${crypto.randomUUID()}`,
      patient_id: patient.id,
      created_at: new Date().toISOString(),
      ...partial,
    };
    await saveWeeklySummary(orgId, summary, "system");

    const text = { en: summary.caregiver_text_en, zh: summary.caregiver_text_zh };
    const channels: string[] = [];
    if (patient.caregiver_email) {
      if (await emailFamilyDigest(patient.caregiver_email, patient.name, text)) {
        channels.push("email");
      }
    }
    if (patient.caregiver_phone) {
      const r = await sendWhatsApp(
        patient.caregiver_phone.replace(/\s+/g, ""),
        `${text.zh}\n\n${text.en}`,
      );
      if (r.ok) channels.push("whatsapp");
    }
    if (channels.length > 0) {
      sent += 1;
      await recordAudit(orgId, "weekly_digest_sent", "system", "patient", patient.id, {
        channels,
        week_start: summary.week_start,
        week_end: summary.week_end,
      });
    }
  }
  return { eligible: patients.length, sent };
}

// GET /api/agent/weekly-digest — Vercel Cron weekly trigger (vercel.json).
export async function GET(req: Request) {
  const denied = requireCronAuthIfConfigured(req);
  if (denied) return denied;
  const orgId = await getDefaultOrgId();
  const result = await runDigest(orgId);
  logger.info("Weekly digest finished.", result);
  return Response.json(result);
}

// POST /api/agent/weekly-digest — in-app manual trigger (signed-in users).
export async function POST(req: Request) {
  const auth = await requireAuth(req);
  if (auth.response) return auth.response;
  return Response.json(await runDigest(auth.ctx.orgId));
}
