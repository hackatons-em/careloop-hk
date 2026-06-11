// Silence sweep (server-only) — "notice who DIDN'T answer".
//
// Runs after the morning round (Vercel Cron, lib/scheduler self-hosted):
//  1. finds active patients whose prompt got no reply today, sends ONE gentle
//     bilingual re-prompt, and
//  2. re-evaluates them with the NR context so the deterministic engine can
//     raise NR-001 (prompt unanswered) / NR-002 (silent ≥ 2 days).
// Self-healing: the moment the patient replies, the normal check-in pipeline
// re-evaluates WITHOUT the silence context and the NR rules stop matching.
//
// Clocks: session/check-in dates use the clinical date (todayISO — frozen in
// DEMO_MODE), while "did they message us since this morning" uses real
// wall-clock timestamps on careloop_messages.

import { appendMessage, getSession } from "./conversation";
import { localMidnightUtcISO, todayISO } from "./dates";
import { logger } from "./logger";
import { evaluatePatient, getPatients } from "./store";
import { supa } from "./supabase";
import { sendWhatsApp } from "./whatsapp";

const REMINDER =
  "提提你：今日仲未完成每日報到，得閒回覆一句就得喇。\n\n" +
  "A gentle reminder: today's check-in isn't finished yet. A short reply is all it takes.";

interface TodayTraffic {
  inbound: number;
  outbound: number;
  firstOutboundAt: string | null;
}

/** Per-patient inbound/outbound counts since local midnight (real clock). */
async function todaysTraffic(orgId: string): Promise<Map<string, TodayTraffic>> {
  const tz = process.env.CARELOOP_TZ ?? "Asia/Hong_Kong";
  const realToday = new Date().toLocaleDateString("en-CA", { timeZone: tz });
  // created_at is timestamptz; bound on the true UTC instant of local midnight
  // so a reply between local midnight and the DB-zone midnight (08:00 in HK)
  // still counts as "answered today" — otherwise the afternoon sweep would
  // raise a spurious NR-001 for a patient who actually replied.
  const sinceUtc = localMidnightUtcISO(realToday, tz);
  const { data, error } = await supa()
    .from("careloop_messages")
    .select("patient_id, direction, created_at")
    .eq("org_id", orgId)
    .gte("created_at", sinceUtc);
  if (error) throw new Error(`Supabase: ${error.message}`);
  const map = new Map<string, TodayTraffic>();
  for (const r of data ?? []) {
    const t = map.get(r.patient_id as string) ?? {
      inbound: 0,
      outbound: 0,
      firstOutboundAt: null,
    };
    if (r.direction === "inbound") t.inbound += 1;
    else {
      t.outbound += 1;
      const at = r.created_at as string;
      if (!t.firstOutboundAt || at < t.firstOutboundAt) t.firstOutboundAt = at;
    }
    map.set(r.patient_id as string, t);
  }
  return map;
}

export interface SilenceSweepResult {
  checked: number;
  reprompted: number;
  evaluated: number;
  failed: number;
}

export async function sweepSilence(orgId: string): Promise<SilenceSweepResult> {
  const today = todayISO();
  const patients = (await getPatients(orgId)).filter((p) => p.status === "active");
  const traffic = await todaysTraffic(orgId);

  let reprompted = 0;
  let evaluated = 0;
  let failed = 0;

  for (const patient of patients) {
    // Per-patient isolation: one patient's transient DB/send error logs and
    // skips, never aborting the rest of the sweep.
    try {
      const t = traffic.get(patient.id) ?? { inbound: 0, outbound: 0, firstOutboundAt: null };
      if (t.inbound > 0) continue; // they answered — nothing silent about today

      const session = await getSession(orgId, patient.id, today);
      const promptedToday = Boolean(session) && t.outbound > 0;

      if (promptedToday) {
        // One reminder only: morning prompt was outbound #1, the reminder is #2.
        if (t.outbound < 2 && patient.phone) {
          const sent = await sendWhatsApp(patient.phone, REMINDER);
          if (sent.ok) {
            reprompted += 1;
            await appendMessage(orgId, {
              patient_id: patient.id,
              direction: "outbound",
              channel: "whatsapp",
              kind: "text",
              body: REMINDER,
              language: "zh",
            });
          }
        }
        const sentAt = t.firstOutboundAt
          ? new Date(t.firstOutboundAt).toLocaleTimeString("en-GB", {
              hour: "2-digit",
              minute: "2-digit",
              timeZone: process.env.CARELOOP_TZ ?? "Asia/Hong_Kong",
            })
          : "this morning";
        await evaluatePatient(orgId, patient.id, "system", {
          today,
          promptUnansweredToday: { sentAt },
        });
        evaluated += 1;
      } else {
        // Not prompted today (round failure, no session) — still check for the
        // multi-day silence rule; the engine decides whether NR-002 applies.
        await evaluatePatient(orgId, patient.id, "system", { today });
        evaluated += 1;
      }
    } catch (err) {
      failed += 1;
      logger.error("Silence sweep: patient skipped.", {
        patient_id: patient.id,
        message: err instanceof Error ? err.message : String(err),
      });
    }
  }

  logger.info("Silence sweep finished.", {
    checked: patients.length,
    reprompted,
    evaluated,
    failed,
  });
  return { checked: patients.length, reprompted, evaluated, failed };
}
