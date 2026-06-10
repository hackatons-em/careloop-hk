// Weekly family digest (server-only) — shared by the Monday leg of the
// afternoon sweep cron and the manual admin trigger.
//
// For every active patient whose family consented: generate (and store) the
// weekly summary, then deliver the bilingual caregiver text by email and/or
// WhatsApp. Good news is sent too — families shouldn't only hear from
// CareLoop when something is wrong.

import "server-only";
import { sendWithFallback } from "./channels";
import { emailFamilyDigest } from "./notify";
import { getPatients, getTimeline, recordAudit, saveWeeklySummary } from "./store";
import { generateWeeklySummary } from "./summaryService";
import type { WeeklySummary } from "./types";

export interface DigestResult {
  eligible: number;
  sent: number;
}

export async function runWeeklyDigest(orgId: string): Promise<DigestResult> {
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
      const r = await sendWithFallback(
        ["whatsapp", "sms"],
        patient.caregiver_phone.replace(/\s+/g, ""),
        `${text.zh}\n\n${text.en}`,
      );
      if (r.delivered) channels.push(r.delivered);
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
