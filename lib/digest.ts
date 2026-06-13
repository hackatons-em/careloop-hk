// Weekly family digest (server-only) — shared by the Monday leg of the
// afternoon sweep cron and the manual admin trigger.
//
// For every active patient whose family consented: generate (and store) the
// weekly summary, then deliver the bilingual caregiver text by email and/or
// WhatsApp. Good news is sent too — families shouldn't only hear from
// Miruwa when something is wrong.

import "server-only";
import { formatCaregiverMessage } from "./caregiver";
import { sendWithFallback } from "./channels";
import { logger } from "./logger";
import { emailFamilyDigest } from "./notify";
import { digestAlreadySent, getPatients, getTimeline, recordAudit, saveWeeklySummary } from "./store";
import { generateWeeklySummary } from "./summaryService";
import type { Patient, WeeklySummary } from "./types";

export interface DigestResult {
  eligible: number;
  sent: number;
  skipped: number;
  failed: number;
}

/** Per-family outcome — keeps the batch runner's aggregation simple. */
type DigestOutcome = "sent" | "skipped" | "nochannel" | "failed";

async function digestOne(orgId: string, patient: Patient): Promise<DigestOutcome> {
  const timeline = await getTimeline(orgId, patient.id);
  if (!timeline) return "skipped";
  const partial = await generateWeeklySummary(timeline);
  const summary: WeeklySummary = {
    id: `summary-${crypto.randomUUID()}`,
    patient_id: patient.id,
    created_at: new Date().toISOString(),
    ...partial,
  };
  // Idempotency: cron delivery is at-least-once and the manual admin endpoint
  // can fire on a Monday the cron already ran. Skip if the family digest was
  // already SENT this week (audit-keyed, so a nurse's manual summary doesn't
  // block the send) — never double-send or double-charge SMS.
  if (await digestAlreadySent(orgId, patient.id, summary.week_start)) return "skipped";
  await saveWeeklySummary(orgId, summary, "system");

  const text = {
    en: summary.caregiver_text_en,
    zh: summary.caregiver_text_zh,
    ar: summary.caregiver_text_ar,
  };
  const channels: string[] = [];
  if (patient.caregiver_email) {
    if (await emailFamilyDigest(patient.caregiver_email, patient.name, text, patient.preferred_language))
      channels.push("email");
  }
  if (patient.caregiver_phone) {
    const r = await sendWithFallback(
      ["whatsapp", "sms"],
      patient.caregiver_phone.replace(/\s+/g, ""),
      formatCaregiverMessage(text, patient.preferred_language),
    );
    if (r.delivered) channels.push(r.delivered);
  }
  if (channels.length === 0) return "nochannel";
  await recordAudit(orgId, "weekly_digest_sent", "system", "patient", patient.id, {
    channels,
    week_start: summary.week_start,
    week_end: summary.week_end,
  });
  return "sent";
}

const DIGEST_BATCH = 8;

export async function runWeeklyDigest(orgId: string): Promise<DigestResult> {
  const patients = (await getPatients(orgId)).filter(
    (p) =>
      p.status === "active" &&
      p.consent_family_digest &&
      (p.caregiver_email || p.caregiver_phone),
  );

  let sent = 0;
  let skipped = 0;
  let failed = 0;
  // Bounded concurrency: each family needs a Claude summary + sends; a strict
  // sequential loop would risk the cron timeout at ward scale, while unbounded
  // parallelism could swamp the AI/Twilio rate limits. Per-family try/catch
  // isolates a transient failure so the rest still go out.
  for (let i = 0; i < patients.length; i += DIGEST_BATCH) {
    const batch = patients.slice(i, i + DIGEST_BATCH);
    const outcomes = await Promise.all(
      batch.map((p) =>
        digestOne(orgId, p).catch((err) => {
          logger.error("Weekly digest: patient skipped.", {
            patient_id: p.id,
            message: err instanceof Error ? err.message : String(err),
          });
          return "failed" as DigestOutcome;
        }),
      ),
    );
    for (const o of outcomes) {
      if (o === "sent") sent += 1;
      else if (o === "skipped" || o === "nochannel") skipped += 1;
      else failed += 1;
    }
  }
  return { eligible: patients.length, sent, skipped, failed };
}
