// Check-in agent — outbound initiation (server-only).
//
// sendDailyCheckIn() is the "we message first" step: it sends the bilingual
// morning prompt to a patient's WhatsApp and opens a fresh session waiting on
// their reply. Shared by the manual trigger (button / API), Vercel Cron, and
// the self-hosted scheduler (lib/scheduler.ts), so all behave identically.

import {
  appendMessage,
  beginSession,
  getMessageCountsSince,
  getOrgPhoneMap,
  getPatientPhone,
} from "./conversation";
import { localMidnightUtcISO, todayISO } from "./dates";
import { logger } from "./logger";
import { getPatient, getPatients } from "./store";
import type { Patient } from "./types";
import { sendWhatsApp } from "./whatsapp";

const ZH_SURNAME: Record<string, string> = { Chan: "陳", Lee: "李", Wong: "黃", Ho: "何", Lam: "林" };
function zhName(name: string): string {
  const m = name.match(/^(Mrs?\.)\s+(\w+)/);
  if (m) {
    const honorific = m[1].toLowerCase().startsWith("mrs") ? "女士" : "先生";
    const surname = ZH_SURNAME[m[2]];
    if (surname) return `${surname}${honorific}`;
  }
  return name;
}

export interface DailyCheckInResult {
  ok: boolean;
  to?: string;
  sid?: string;
  error?: string;
  /** Set by the round when a patient is intentionally not messaged (already
   * contacted today). `ok` stays true so a skip never counts as a failure. */
  skipped?: boolean;
  reason?: string;
}

export async function sendDailyCheckIn(
  orgId: string,
  patientId: string,
  // The round pre-resolves the patient row + phone in bulk and passes them here
  // to avoid two per-patient DB round-trips; the single-patient callers omit
  // opts and fall back to the per-patient lookups below.
  opts?: { patient?: Patient; phone?: string },
): Promise<DailyCheckInResult> {
  const patient = opts?.patient ?? (await getPatient(orgId, patientId));
  if (!patient) return { ok: false, error: "Patient not found" };

  const to =
    opts?.phone ??
    (await getPatientPhone(orgId, patientId)) ??
    (patient.phone ? `whatsapp:${patient.phone}` : undefined) ??
    process.env.CARELOOP_DEMO_PATIENT_PHONE;
  if (!to) {
    return {
      ok: false,
      error:
        "No patient phone known yet. Add the patient's WhatsApp number on their profile, or have the patient send one WhatsApp message first so we capture the number.",
    };
  }

  // Outbound language follows the patient's preference. "auto" (the default)
  // keeps the historical bilingual zh+en prompt; inbound replies are always
  // auto-detected regardless, so the thread can still switch language naturally.
  const pref = patient.preferred_language ?? "auto";
  const zhPrompt = `早晨，${zhName(patient.name)}。係時候做你今日嘅每日報到。今日覺得點呀？`;
  const enPrompt = `Good morning, ${patient.name}. It is time for your daily check-in. How are you feeling today?`;
  const arPrompt = `صباح الخير، ${patient.name}. حان وقت تسجيل الدخول اليومي. كيف تشعر اليوم؟`;
  let prompt: string;
  let language: "zh" | "en" | "ar";
  if (pref === "ar") {
    prompt = arPrompt;
    language = "ar";
  } else if (pref === "en") {
    prompt = enPrompt;
    language = "en";
  } else if (pref === "zh-HK") {
    prompt = zhPrompt;
    language = "zh";
  } else {
    prompt = `${zhPrompt}\n\n${enPrompt}`;
    language = "zh";
  }

  const sent = await sendWhatsApp(to, prompt);
  if (!sent.ok) return { ok: false, error: sent.error };

  await beginSession(orgId, patientId, todayISO());
  await appendMessage(orgId, {
    patient_id: patientId,
    direction: "outbound",
    channel: "whatsapp",
    kind: "text",
    body: prompt,
    language,
  });

  return { ok: true, to, sid: sent.sid };
}

// Bounded concurrency for the round: parallel sends are far faster than a
// strict sequential loop (which times out the Vercel function past a handful of
// patients) while staying well under Twilio's rate limits. Matches DIGEST_BATCH
// — the round's per-patient work is lighter (one Twilio send + two writes, no
// AI), so 8 is conservative.
const ROUND_BATCH = 8;

/** The agent's daily "round": message every ACTIVE patient we have a WhatsApp
 * number for. Vercel Cron / the scheduler calls this; the demo triggers it
 * manually. Idempotent — a patient already contacted today (any outbound
 * message since local midnight) is skipped, so a timeout-then-retry or a
 * cron/manual overlap never double-messages anyone. */
export async function sendDailyCheckInRound(orgId: string): Promise<{
  sent: number;
  total: number;
  skipped: number;
  results: (DailyCheckInResult & { patientId: string })[];
}> {
  const tz = process.env.CARELOOP_TZ ?? "Asia/Hong_Kong";
  // "Already contacted today" is bounded on REAL wall-clock local midnight (like
  // lib/silence.ts) — careloop_messages.created_at is real time, whereas
  // todayISO() is frozen to the demo week in DEMO_MODE and would over-skip.
  const realToday = new Date().toLocaleDateString("en-CA", { timeZone: tz });
  const sinceUtc = localMidnightUtcISO(realToday, tz);
  // Three queries total (not 2N): patients + every phone link + today's message
  // counts, all resolved up front and matched in memory.
  const [patients, phoneMap, counts] = await Promise.all([
    getPatients(orgId),
    getOrgPhoneMap(orgId),
    getMessageCountsSince(orgId, sinceUtc),
  ]);

  const results: (DailyCheckInResult & { patientId: string })[] = [];
  const targets: { patient: Patient; phone: string }[] = [];
  for (const p of patients) {
    // Only nurse-confirmed patients are proactively messaged; pending_review
    // (auto-created from an unknown inbound number) and archived are excluded.
    if (p.status !== "active") continue;
    const phone = phoneMap.get(p.id) ?? (p.phone ? `whatsapp:${p.phone}` : undefined);
    if (!phone) continue;
    const c = counts.get(p.id);
    if (c && c.outbound > 0) {
      // Already contacted today → skip (idempotency). Observable, not a failure.
      results.push({
        patientId: p.id,
        ok: true,
        skipped: true,
        reason: c.inbound > 0 ? "already_conversing" : "already_prompted",
      });
      continue;
    }
    targets.push({ patient: p, phone });
  }

  for (let i = 0; i < targets.length; i += ROUND_BATCH) {
    const batch = targets.slice(i, i + ROUND_BATCH);
    const outcomes = await Promise.all(
      batch.map((t) =>
        sendDailyCheckIn(orgId, t.patient.id, { patient: t.patient, phone: t.phone })
          .then((r) => ({ patientId: t.patient.id, ...r }))
          // Per-patient isolation: a thrown DB/network error logs and skips,
          // never aborting the rest of the round.
          .catch((err) => {
            logger.error("Daily round: patient send failed.", {
              patient_id: t.patient.id,
              message: err instanceof Error ? err.message : String(err),
            });
            return { patientId: t.patient.id, ok: false, error: "send failed" };
          }),
      ),
    );
    results.push(...outcomes);
  }

  return {
    sent: results.filter((r) => r.ok && !r.skipped).length,
    total: targets.length,
    skipped: results.filter((r) => r.skipped).length,
    results,
  };
}
