// Weekly clinician summary service (server-only).
//
// The deterministic template is the source of truth. If ANTHROPIC_API_KEY is
// set, Claude rewrites ONLY the wording into plainer clinical prose — it never
// invents data, decides severity, or gives treatment advice. If the key is
// missing or the call fails, we return the deterministic template, so the demo
// never breaks. (Prompt caching is used on the safety system prompt.)

import Anthropic from "@anthropic-ai/sdk";
import { buildCaregiverAlert } from "./caregiver";
import { addDays, todayISO } from "./dates";
import { logger } from "./logger";
import { weightGain3d as computeWeightGain3d } from "./riskEngine";
import { SEVERITY_LABEL, type PatientTimeline, type Severity, type WeeklySummary } from "./types";
import { series } from "./vitals";

const SUMMARY_WINDOW_DAYS = 7;

export interface SummaryStats {
  weekStart: string;
  weekEnd: string;
  weightStart: number | null;
  weightEnd: number | null;
  weightGainTotal: number | null;
  weightGain3d: number | null;
  sysMin: number | null;
  sysMax: number | null;
  diaMin: number | null;
  diaMax: number | null;
  hrMin: number | null;
  hrMax: number | null;
  stepsAvg: number | null;
  stepsPctBelow: number | null; // % below baseline (positive = below)
  baselineSteps: number;
  sobDays: number;
  swellDays: number;
  medTakenDays: number;
  totalCheckins: number;
  matchedCodes: string[];
  startSeverity: Severity;
  endSeverity: Severity;
  dataCompleteness: number; // 0..1
  reviewItems: string[];
}

function range(values: number[]): { min: number | null; max: number | null } {
  if (values.length === 0) return { min: null, max: null };
  return { min: Math.min(...values), max: Math.max(...values) };
}

function reviewItems(severity: Severity, codes: string[]): string[] {
  const items: string[] = [];
  if (severity === "escalate" || severity === "review_today") {
    items.push("Nurse review today");
  } else if (severity === "watch") {
    items.push("Continue monitoring; nurse review if the trend continues");
  } else {
    items.push("Continue routine monitoring");
  }
  if (codes.includes("HF-001") || codes.includes("HF-002"))
    items.push("Confirm weight trend and fluid status with the care team");
  if (codes.includes("MED-001")) items.push("Review medication adherence");
  if (codes.includes("BP-001")) items.push("Confirm blood-pressure readings");
  if (codes.includes("ACT-001")) items.push("Check on mobility and activity");
  return items;
}

export function summaryStats(timeline: PatientTimeline): SummaryStats {
  const { patient, risk } = timeline;
  // Clamp to the trailing 7 clinical days so "week" is a TRUE calendar week:
  // weekStart/weekEnd are derived deterministically from the window end (not
  // from the earliest backfilled vital), keeping the digest dedup key
  // (week_start) stable and the stats scoped to the reporting week.
  const allDates = [
    ...timeline.daily.map((d) => d.date),
    ...timeline.checkins.map((c) => c.date),
    ...timeline.risk_trend.map((r) => r.date),
  ]
    .filter(Boolean)
    .sort();
  const weekEnd = allDates[allDates.length - 1] ?? todayISO();
  const weekStart = addDays(weekEnd, -(SUMMARY_WINDOW_DAYS - 1));
  const inWindow = (date: string) => date >= weekStart && date <= weekEnd;
  const daily = timeline.daily.filter((d) => inWindow(d.date));
  const checkins = timeline.checkins.filter((c) => inWindow(c.date));
  const risk_trend = timeline.risk_trend.filter((r) => inWindow(r.date));

  const weights = series(daily, "weight").map((s) => s.value);
  const weightStart = weights[0] ?? null;
  const weightEnd = weights[weights.length - 1] ?? null;
  const weightGainTotal =
    weightStart !== null && weightEnd !== null ? round1(weightEnd - weightStart) : null;
  const wg3dRaw = computeWeightGain3d(daily);
  const weightGain3d = wg3dRaw === null ? null : round1(wg3dRaw);

  const sys = range(series(daily, "systolic").map((s) => s.value));
  const dia = range(series(daily, "diastolic").map((s) => s.value));
  const hr = range(series(daily, "heart_rate").map((s) => s.value));

  const steps = series(daily, "steps").map((s) => s.value);
  const stepsAvg = steps.length ? Math.round(steps.reduce((a, b) => a + b, 0) / steps.length) : null;
  const stepsPctBelow =
    stepsAvg !== null && patient.baseline_steps > 0
      ? Math.round((1 - stepsAvg / patient.baseline_steps) * 100)
      : null;

  const sobDays = checkins.filter((c) => c.shortness_of_breath).length;
  const swellDays = checkins.filter((c) => c.swelling).length;
  const medTakenDays = checkins.filter((c) => c.medication_taken).length;

  const matchedCodes = risk.matched_rules.map((m) => m.code);
  const startSeverity = risk_trend[0]?.severity ?? "stable";
  const endSeverity = risk.severity;

  const weightDays = series(daily, "weight").length;
  const dataCompleteness = Math.min(
    1,
    Math.round(((weightDays + checkins.length) / (SUMMARY_WINDOW_DAYS * 2)) * 100) / 100,
  );

  return {
    weekStart,
    weekEnd,
    weightStart,
    weightEnd,
    weightGainTotal,
    weightGain3d,
    sysMin: sys.min,
    sysMax: sys.max,
    diaMin: dia.min,
    diaMax: dia.max,
    hrMin: hr.min,
    hrMax: hr.max,
    stepsAvg,
    stepsPctBelow,
    baselineSteps: patient.baseline_steps,
    sobDays,
    swellDays,
    medTakenDays,
    totalCheckins: checkins.length,
    matchedCodes,
    startSeverity,
    endSeverity,
    dataCompleteness,
    reviewItems: reviewItems(endSeverity, matchedCodes),
  };
}

function round1(n: number): number {
  return Math.round(n * 10) / 10;
}

/** Deterministic clinician narrative — also the input Claude rewrites. */
export function buildClinicianDraft(timeline: PatientTimeline, s: SummaryStats): string {
  const p = timeline.patient;
  const parts: string[] = [];
  parts.push(
    `${p.name} is a ${p.age}-year-old ${p.gender} patient with ${p.conditions.join(" and ")}, monitored remotely this week. Risk level moved from ${SEVERITY_LABEL[s.startSeverity]} to ${SEVERITY_LABEL[s.endSeverity]}.`,
  );
  if (s.weightStart !== null && s.weightEnd !== null) {
    parts.push(
      `Body weight went from ${s.weightStart} kg to ${s.weightEnd} kg (${signed(s.weightGainTotal)} kg over the week${s.weightGain3d !== null ? `, ${signed(s.weightGain3d)} kg over the last 3 days` : ""}).`,
    );
  }
  if (s.sysMin !== null) {
    parts.push(
      `Blood pressure ranged ${s.sysMin}–${s.sysMax}/${s.diaMin}–${s.diaMax} mmHg; resting heart rate ${s.hrMin}–${s.hrMax} bpm.`,
    );
  }
  if (s.stepsAvg !== null) {
    parts.push(
      `Average activity was ${s.stepsAvg} steps/day, about ${Math.abs(s.stepsPctBelow ?? 0)}% ${(s.stepsPctBelow ?? 0) >= 0 ? "below" : "above"} the ${s.baselineSteps}-step baseline.`,
    );
  }
  const symptomBits: string[] = [];
  if (s.sobDays > 0) symptomBits.push(`shortness of breath on ${s.sobDays} day(s)`);
  if (s.swellDays > 0) symptomBits.push(`swelling on ${s.swellDays} day(s)`);
  parts.push(
    symptomBits.length
      ? `Reported ${symptomBits.join(" and ")}. Medication taken on ${s.medTakenDays} of ${s.totalCheckins} days.`
      : `No significant symptoms reported. Medication taken on ${s.medTakenDays} of ${s.totalCheckins} days.`,
  );
  parts.push(
    s.matchedCodes.length
      ? `The deterministic rule engine matched ${s.matchedCodes.join(", ")}. Recommended review items: ${s.reviewItems.join("; ")}.`
      : `No monitoring rules were triggered. Recommended review items: ${s.reviewItems.join("; ")}.`,
  );
  parts.push(
    `Data completeness this week was ${Math.round(s.dataCompleteness * 100)}%. This summary is based on monitoring data only and is not a diagnosis or treatment recommendation; please review with the nurse, clinician, or pharmacist.`,
  );
  return parts.join(" ");
}

function signed(n: number | null): string {
  if (n === null) return "0";
  return n >= 0 ? `+${n}` : `${n}`;
}

const SYSTEM_PROMPT = `You are a clinical documentation assistant for CareLoop, a remote chronic-care MONITORING tool for elderly Hong Kong patients.
Rewrite the provided weekly monitoring summary into clear, plain clinical language for a nurse or clinician.
Hard rules:
- Do NOT diagnose or speculate about causes.
- Do NOT recommend, change, or stop any medication, and do NOT prescribe.
- Do NOT invent any data, numbers, or clinical claims not present in the input.
- Keep all numbers and matched rule codes (e.g. HF-001) exactly as given.
- Frame everything as monitoring data for professional review.
- Always keep a closing note that this is based on monitoring data and is not a diagnosis or treatment recommendation, and to review with the nurse/clinician/pharmacist.
Use British English. Be concise: one or two short paragraphs, under 180 words.`;

async function polishWithClaude(draft: string): Promise<string | null> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) return null;
  try {
    const client = new Anthropic({ apiKey });
    const model = process.env.CARELOOP_SUMMARY_MODEL ?? "claude-sonnet-4-6";
    const msg = await client.messages.create(
      {
        model,
        max_tokens: 600,
        system: [{ type: "text", text: SYSTEM_PROMPT, cache_control: { type: "ephemeral" } }],
        messages: [
          {
            role: "user",
            content: `Rewrite this weekly monitoring summary into plain clinical prose, keeping every number and rule code:\n\n${draft}`,
          },
        ],
      },
      // Cap a single call so one hung request can't blow the cron budget — the
      // catch falls back to the deterministic template, so a timeout degrades
      // gracefully rather than failing the digest.
      { timeout: 8000, maxRetries: 1 },
    );
    const text = msg.content
      .filter((b): b is Anthropic.TextBlock => b.type === "text")
      .map((b) => b.text)
      .join("")
      .trim();
    return text || null;
  } catch (err) {
    logger.error("AI summary wording failed; falling back to deterministic template.", { err });
    return null;
  }
}

export async function generateWeeklySummary(
  timeline: PatientTimeline,
): Promise<Omit<WeeklySummary, "id" | "patient_id" | "created_at">> {
  const stats = summaryStats(timeline);
  const draft = buildClinicianDraft(timeline, stats);
  const caregiver = buildCaregiverAlert(
    timeline.patient,
    timeline.daily,
    timeline.checkins,
    timeline.risk.severity,
  );

  const polished = await polishWithClaude(draft);

  return {
    week_start: stats.weekStart,
    week_end: stats.weekEnd,
    generated_text: polished ?? draft,
    caregiver_text_en: caregiver.en,
    caregiver_text_zh: caregiver.zh,
    data_completeness: stats.dataCompleteness,
    generated_by: polished ? "ai" : "template",
  };
}
