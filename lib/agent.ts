// Check-in agent — outbound initiation (server-only).
//
// sendDailyCheckIn() is the "we message first" step: it sends the bilingual
// morning prompt to a patient's WhatsApp and opens a fresh session waiting on
// their reply. Shared by the manual trigger (button / API), Vercel Cron, and
// the self-hosted scheduler (lib/scheduler.ts), so all behave identically.

import { appendMessage, beginSession, getPatientPhone } from "./conversation";
import { todayISO } from "./dates";
import { getPatient, getPatients } from "./store";
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
}

export async function sendDailyCheckIn(
  orgId: string,
  patientId: string,
): Promise<DailyCheckInResult> {
  const patient = await getPatient(orgId, patientId);
  if (!patient) return { ok: false, error: "Patient not found" };

  const to =
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

/** The agent's daily "round": message every patient we have a WhatsApp number
 * for. Vercel Cron / the scheduler calls this; the demo triggers it manually. */
export async function sendDailyCheckInRound(orgId: string): Promise<{
  sent: number;
  total: number;
  results: (DailyCheckInResult & { patientId: string })[];
}> {
  const patients = await getPatients(orgId);
  const targets: typeof patients = [];
  for (const p of patients) {
    if (p.phone || (await getPatientPhone(orgId, p.id))) targets.push(p);
  }
  const results: (DailyCheckInResult & { patientId: string })[] = [];
  for (const p of targets) {
    results.push({ patientId: p.id, ...(await sendDailyCheckIn(orgId, p.id)) });
  }
  return { sent: results.filter((r) => r.ok).length, total: targets.length, results };
}
