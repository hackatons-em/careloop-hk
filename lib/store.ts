// CareLoop — in-memory demo store (server-only)
//
// Single source of truth for the running demo. Cached on globalThis so it
// survives dev hot-reloads and warm serverless instances. Seeded
// deterministically from lib/seed.ts, so a cold start self-heals to a known
// state and the demo is reproducible (this is documented in HONESTY.md).
//
// NOTE: import this only from server code (route handlers). Never from a
// Client Component.

import { evaluateRisk, riskTrend } from "./riskEngine";
import {
  buildSeed,
  DEMO_DATES,
  RISKY_CHECKIN_PATIENT_ID,
  WEEK_END,
  WEEK_START,
} from "./seed";
import type {
  AlertStatus,
  AuditAction,
  AuditEvent,
  DailyCheckIn,
  Patient,
  PatientRow,
  PatientTimeline,
  RiskAlert,
  RiskResult,
  VitalReading,
  VitalType,
  WeeklySummary,
} from "./types";
import { SEVERITY_ORDER } from "./types";
import { toDailyVitals } from "./vitals";

interface StoreState {
  patients: Patient[];
  vitals: VitalReading[];
  checkins: DailyCheckIn[];
  alerts: RiskAlert[];
  audit: AuditEvent[];
  summaries: WeeklySummary[];
}

const g = globalThis as unknown as { __careloopStore?: StoreState };

function now(): string {
  return new Date().toISOString();
}

function genId(prefix: string): string {
  const rand =
    typeof crypto !== "undefined" && "randomUUID" in crypto
      ? crypto.randomUUID()
      : Math.random().toString(36).slice(2);
  return `${prefix}-${rand}`;
}

function freshState(seedAudit: boolean): StoreState {
  const seed = buildSeed();
  const state: StoreState = {
    patients: seed.patients,
    vitals: seed.vitals,
    checkins: seed.checkins,
    alerts: [],
    audit: [],
    summaries: [],
  };
  // Compute initial alerts deterministically from the seeded data.
  for (const p of state.patients) {
    upsertAlertFor(state, p.id, "system");
  }
  if (seedAudit) {
    pushAudit(state, "demo_data_seeded", "system", "dataset", "demo", {
      patients: state.patients.length,
      alerts: state.alerts.length,
    });
  }
  return state;
}

function getState(): StoreState {
  if (!g.__careloopStore) g.__careloopStore = freshState(true);
  return g.__careloopStore;
}

// --- audit ---------------------------------------------------------------

function pushAudit(
  state: StoreState,
  action: AuditAction,
  actor: string,
  target_type: string,
  target_id: string,
  metadata: Record<string, unknown> = {},
): AuditEvent {
  const event: AuditEvent = {
    id: genId("audit"),
    actor,
    action,
    target_type,
    target_id,
    metadata,
    created_at: now(),
  };
  state.audit.unshift(event); // newest first
  return event;
}

// --- risk + alerts -------------------------------------------------------

function patientVitals(state: StoreState, patientId: string): VitalReading[] {
  return state.vitals.filter((v) => v.patient_id === patientId);
}
function patientCheckins(state: StoreState, patientId: string): DailyCheckIn[] {
  return state.checkins.filter((c) => c.patient_id === patientId);
}

function computeRisk(state: StoreState, patientId: string): RiskResult {
  const patient = state.patients.find((p) => p.id === patientId)!;
  return evaluateRisk(patient, patientVitals(state, patientId), patientCheckins(state, patientId));
}

function activeAlert(state: StoreState, patientId: string): RiskAlert | undefined {
  return state.alerts.find((a) => a.patient_id === patientId && a.status !== "resolved");
}

/**
 * Re-run the deterministic engine for a patient and create/refresh the active
 * alert. Returns the computed risk + the alert (if any).
 */
function upsertAlertFor(
  state: StoreState,
  patientId: string,
  actor: string,
): { risk: RiskResult; alert: RiskAlert | null } {
  const patient = state.patients.find((p) => p.id === patientId)!;
  const risk = computeRisk(state, patientId);
  pushAudit(state, "risk_evaluated", actor, "patient", patientId, {
    severity: risk.severity,
    matched_rules: risk.matched_rules.map((m) => m.code),
  });

  // Most recent alert for this patient (the array is newest-first).
  const recent = state.alerts.find((a) => a.patient_id === patientId);
  const openAlert = recent && recent.status !== "resolved" ? recent : null;

  if (risk.severity === "stable") {
    return { risk, alert: openAlert };
  }

  // Refresh the open alert in place.
  if (openAlert) {
    openAlert.severity = risk.severity;
    openAlert.matched_rules = risk.matched_rules.map((m) => m.code);
    openAlert.reason = risk.reason;
    openAlert.recommended_action = risk.recommended_action;
    pushAudit(state, "alert_updated", actor, "alert", openAlert.id, {
      severity: risk.severity,
      patient_id: patientId,
    });
    return { risk, alert: openAlert };
  }

  // A resolved alert already covers this severity (or worse) — don't recreate a
  // duplicate. Only mint a new alert on genuine worsening after resolution.
  if (
    recent &&
    recent.status === "resolved" &&
    SEVERITY_ORDER[risk.severity] <= SEVERITY_ORDER[recent.severity]
  ) {
    return { risk, alert: recent };
  }

  const alert: RiskAlert = {
    id: genId("alert"),
    patient_id: patientId,
    created_at: now(),
    severity: risk.severity,
    matched_rules: risk.matched_rules.map((m) => m.code),
    reason: risk.reason,
    recommended_action: risk.recommended_action,
    status: "new",
    assigned_to: patient.assigned_nurse,
    nurse_note: null,
  };
  state.alerts.unshift(alert);
  pushAudit(state, "alert_created", actor, "alert", alert.id, {
    severity: alert.severity,
    matched_rules: alert.matched_rules,
    patient_id: patientId,
  });
  return { risk, alert };
}

// --- public read API -----------------------------------------------------

export function getPatients(): Patient[] {
  return [...getState().patients];
}

export function getPatient(id: string): Patient | undefined {
  const p = getState().patients.find((x) => x.id === id);
  return p ? { ...p, conditions: [...p.conditions] } : undefined;
}

export function getPatientRows(): PatientRow[] {
  const state = getState();
  return state.patients.map((patient) => {
    const risk = computeRisk(state, patient.id);
    const checkins = patientCheckins(state, patient.id);
    const lastCheckin = checkins.map((c) => c.date).sort().pop() ?? null;
    const daily = toDailyVitals(patientVitals(state, patient.id));
    let latestWeight: number | null = null;
    for (let i = daily.length - 1; i >= 0; i--) {
      if (daily[i].weight !== null) {
        latestWeight = daily[i].weight;
        break;
      }
    }
    return {
      patient,
      risk,
      last_checkin_date: lastCheckin,
      alert_status: activeAlert(state, patient.id)?.status ?? null,
      latest_weight: latestWeight,
    };
  });
}

export function getTimeline(id: string): PatientTimeline | undefined {
  const state = getState();
  const patient = state.patients.find((p) => p.id === id);
  if (!patient) return undefined;
  const vitals = patientVitals(state, id);
  const checkins = patientCheckins(state, id).sort((a, b) => a.date.localeCompare(b.date));
  return {
    patient,
    daily: toDailyVitals(vitals),
    checkins,
    risk: evaluateRisk(patient, vitals, checkins),
    risk_trend: riskTrend(patient, vitals, checkins),
  };
}

export function getRisk(id: string): RiskResult | undefined {
  if (!getPatient(id)) return undefined;
  return computeRisk(getState(), id);
}

export function getAlerts(): RiskAlert[] {
  return [...getState().alerts];
}
export function getAlert(id: string): RiskAlert | undefined {
  return getState().alerts.find((a) => a.id === id);
}
export function getActiveAlert(patientId: string): RiskAlert | undefined {
  return activeAlert(getState(), patientId);
}

export function getAuditEvents(limit?: number): AuditEvent[] {
  const all = getState().audit;
  return limit ? all.slice(0, limit) : [...all];
}

// --- public write API ----------------------------------------------------

export interface CheckInInput {
  date?: string;
  mood?: string;
  shortness_of_breath?: boolean;
  swelling?: boolean;
  dizziness?: boolean;
  chest_discomfort?: boolean;
  medication_taken?: boolean;
  weight?: number;
  free_text_note?: string | null;
  source?: DailyCheckIn["source"];
}

function upsertVital(
  state: StoreState,
  patientId: string,
  date: string,
  type: VitalType,
  value: number,
  unit: string,
): void {
  const existing = state.vitals.find(
    (v) => v.patient_id === patientId && v.timestamp.slice(0, 10) === date && v.type === type,
  );
  if (existing) {
    existing.value = value;
    existing.source = "manual";
  } else {
    state.vitals.push({
      id: genId(`vital-${type}`),
      patient_id: patientId,
      timestamp: `${date}T09:00:00Z`,
      type,
      value,
      unit,
      source: "manual",
    });
  }
}

/** Submit a daily check-in, then re-evaluate risk. */
export function submitCheckIn(
  patientId: string,
  input: CheckInInput,
  actor = "patient",
): { checkin: DailyCheckIn; risk: RiskResult; alert: RiskAlert | null } | null {
  const state = getState();
  const patient = state.patients.find((p) => p.id === patientId);
  if (!patient) return null;

  const date = input.date ?? WEEK_END;
  const existing = state.checkins.find((c) => c.patient_id === patientId && c.date === date);
  const checkin: DailyCheckIn = existing ?? {
    id: `checkin-${patientId.replace(/^patient-/, "")}-${date}`,
    patient_id: patientId,
    date,
    mood: "",
    shortness_of_breath: false,
    swelling: false,
    dizziness: false,
    chest_discomfort: false,
    medication_taken: true,
    free_text_note: null,
    source: input.source ?? "web_form",
  };

  checkin.mood = input.mood ?? checkin.mood;
  if (input.shortness_of_breath !== undefined) checkin.shortness_of_breath = input.shortness_of_breath;
  if (input.swelling !== undefined) checkin.swelling = input.swelling;
  if (input.dizziness !== undefined) checkin.dizziness = input.dizziness;
  if (input.chest_discomfort !== undefined) checkin.chest_discomfort = input.chest_discomfort;
  if (input.medication_taken !== undefined) checkin.medication_taken = input.medication_taken;
  if (input.free_text_note !== undefined) checkin.free_text_note = input.free_text_note;
  if (input.source) checkin.source = input.source;

  if (!existing) state.checkins.push(checkin);
  if (input.weight !== undefined) {
    upsertVital(state, patientId, date, "weight", input.weight, "kg");
  }

  pushAudit(state, "checkin_submitted", actor, "patient", patientId, { date });
  const { risk, alert } = upsertAlertFor(state, patientId, actor);
  return { checkin, risk, alert };
}

/** Add a single vital reading, then re-evaluate. */
export function addVital(
  patientId: string,
  type: VitalType,
  value: number,
  unit: string,
  date = WEEK_END,
): RiskResult | null {
  const state = getState();
  if (!state.patients.find((p) => p.id === patientId)) return null;
  upsertVital(state, patientId, date, type, value, unit);
  return upsertAlertFor(state, patientId, "nurse").risk;
}

export function evaluatePatient(patientId: string): RiskResult | null {
  const state = getState();
  if (!state.patients.find((p) => p.id === patientId)) return null;
  return upsertAlertFor(state, patientId, "nurse").risk;
}

export interface AlertPatch {
  status?: AlertStatus;
  nurse_note?: string | null;
}

export function updateAlert(id: string, patch: AlertPatch, actor = "Nurse"): RiskAlert | null {
  const state = getState();
  const alert = state.alerts.find((a) => a.id === id);
  if (!alert) return null;
  if (patch.status) alert.status = patch.status;
  if (patch.nurse_note !== undefined) alert.nurse_note = patch.nurse_note;
  const action: AuditAction = patch.status === "acknowledged" ? "alert_acknowledged" : "alert_updated";
  pushAudit(state, action, actor, "alert", alert.id, {
    status: alert.status,
    patient_id: alert.patient_id,
  });
  return alert;
}

/** Canonical risky check-in for the demo replay button (Mrs. Chan). */
export function runRiskyCheckIn(): {
  checkin: DailyCheckIn;
  risk: RiskResult;
  alert: RiskAlert | null;
} | null {
  const state = getState();
  const patientId = RISKY_CHECKIN_PATIENT_ID;
  const patient = state.patients.find((p) => p.id === patientId);
  if (!patient) return null;
  const date = WEEK_END;

  // Force the canonical deteriorating numbers so the engine always escalates.
  upsertVital(state, patientId, date, "weight", 64.3, "kg");
  upsertVital(state, patientId, date, "blood_pressure_systolic", 158, "mmHg");
  upsertVital(state, patientId, date, "blood_pressure_diastolic", 94, "mmHg");
  upsertVital(state, patientId, date, "heart_rate", 88, "bpm");
  upsertVital(state, patientId, date, "steps", 1750, "steps");
  upsertVital(state, patientId, date, "sleep_hours", 5.4, "h");

  pushAudit(state, "risky_checkin_replayed", "demo", "patient", patientId, {});
  const result = submitCheckIn(
    patientId,
    {
      date,
      mood: "very tired",
      shortness_of_breath: true,
      swelling: true,
      dizziness: false,
      chest_discomfort: false,
      medication_taken: false,
      free_text_note:
        "Reported during daily call: short of breath, ankle swelling, and missed evening medicine.",
      source: "simulated_call",
    },
    "demo",
  );
  return result;
}

export interface CsvRow {
  date: string;
  weight_kg?: number;
  systolic_bp?: number;
  diastolic_bp?: number;
  heart_rate?: number;
  steps?: number;
  sleep_hours?: number;
  medication_taken?: boolean;
  shortness_of_breath?: boolean;
  swelling?: boolean;
}

/** Import wearable/vital CSV rows for a patient. */
export function importCsv(patientId: string, rows: CsvRow[], actor = "nurse"): RiskResult | null {
  const state = getState();
  if (!state.patients.find((p) => p.id === patientId)) return null;
  for (const row of rows) {
    if (!row.date) continue;
    if (row.weight_kg !== undefined) upsertVital(state, patientId, row.date, "weight", row.weight_kg, "kg");
    if (row.systolic_bp !== undefined) upsertVital(state, patientId, row.date, "blood_pressure_systolic", row.systolic_bp, "mmHg");
    if (row.diastolic_bp !== undefined) upsertVital(state, patientId, row.date, "blood_pressure_diastolic", row.diastolic_bp, "mmHg");
    if (row.heart_rate !== undefined) upsertVital(state, patientId, row.date, "heart_rate", row.heart_rate, "bpm");
    if (row.steps !== undefined) upsertVital(state, patientId, row.date, "steps", row.steps, "steps");
    if (row.sleep_hours !== undefined) upsertVital(state, patientId, row.date, "sleep_hours", row.sleep_hours, "h");
    if (
      row.medication_taken !== undefined ||
      row.shortness_of_breath !== undefined ||
      row.swelling !== undefined
    ) {
      submitCheckIn(
        patientId,
        {
          date: row.date,
          medication_taken: row.medication_taken,
          shortness_of_breath: row.shortness_of_breath,
          swelling: row.swelling,
          source: "imported",
        },
        actor,
      );
    }
  }
  pushAudit(state, "csv_imported", actor, "patient", patientId, { rows: rows.length });
  return upsertAlertFor(state, patientId, actor).risk;
}

// --- weekly summary persistence -----------------------------------------

export function saveWeeklySummary(summary: WeeklySummary): void {
  const state = getState();
  state.summaries.unshift(summary);
  pushAudit(state, "weekly_summary_generated", "nurse", "patient", summary.patient_id, {
    generated_by: summary.generated_by,
  });
}

export function getLatestSummary(patientId: string): WeeklySummary | undefined {
  return getState().summaries.find((s) => s.patient_id === patientId);
}

export function recordAudit(
  action: AuditAction,
  actor: string,
  target_type: string,
  target_id: string,
  metadata: Record<string, unknown> = {},
): void {
  pushAudit(getState(), action, actor, target_type, target_id, metadata);
}

// --- demo controls -------------------------------------------------------

export function resetDemo(): void {
  g.__careloopStore = freshState(false);
  pushAudit(getState(), "demo_data_reset", "demo", "dataset", "demo", {});
}

export const DEMO_WEEK = { start: WEEK_START, end: WEEK_END, dates: DEMO_DATES };
