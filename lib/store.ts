// CareLoop — data layer (server-only, Supabase-backed)
//
// Single source of truth for the running app, persisted in Supabase Postgres
// (tables careloop_*). Every accessor/mutator is ASYNC (talks to the database
// over HTTP) and is ORG-SCOPED: the first parameter is always the caller's
// organization id (from the session via lib/auth.ts, or lib/org.ts
// getDefaultOrgId() for sessionless entry points like the WhatsApp webhook).
// Every query filters by org_id and every insert stamps it — a caller can
// never read or write another tenant's rows.
//
// The DETERMINISTIC risk engine (lib/riskEngine.ts) stays pure: we fetch the
// patient + vitals + check-ins and hand them to evaluateRisk(). Severity is
// never read from or written by an LLM.
//
// NOTE: import this only from server code (route handlers, server components).
// Never from a Client Component — it uses the service-role key.

import { todayISO } from "./dates";
import { isDemoMode } from "./flags";
import { evaluateRisk, riskTrend } from "./riskEngine";
import {
  buildSeed,
  DEMO_DATES,
  RISKY_CHECKIN_PATIENT_ID,
  WEEK_END,
  WEEK_START,
} from "./seed";
import { MOCK_NAMES } from "./names";
import { supa } from "./supabase";
import type {
  AlertStatus,
  AuditAction,
  AuditEvent,
  DailyCheckIn,
  Patient,
  PatientRow,
  PatientStatus,
  PatientTimeline,
  RiskAlert,
  RiskResult,
  VitalReading,
  VitalType,
  WeeklySummary,
} from "./types";
import { SEVERITY_ORDER } from "./types";
import { toDailyVitals } from "./vitals";
import type { PatientCreateInput, PatientUpdateInput } from "./validation";

// --- helpers --------------------------------------------------------------

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

function shortId(patientId: string): string {
  return patientId.replace(/^patient-/, "");
}

/** Throw on a Supabase error, otherwise return the rows (never null). */
function rows<T>(res: { data: T[] | null; error: { message: string } | null }): T[] {
  if (res.error) throw new Error(`Supabase: ${res.error.message}`);
  return res.data ?? [];
}
function maybe<T>(res: { data: T | null; error: { message: string } | null }): T | null {
  if (res.error) throw new Error(`Supabase: ${res.error.message}`);
  return res.data ?? null;
}

// --- row mappers (DB row <-> domain type) ---------------------------------
// Columns are snake_case and mostly match the types verbatim; the only real
// translation is vitals.ts <-> VitalReading.timestamp. We defensively coerce
// numerics (PostgREST returns them as JSON numbers, but be safe).

interface VitalRow {
  id: string;
  patient_id: string;
  ts: string;
  type: VitalType;
  value: number | string;
  unit: string;
  source: VitalReading["source"];
}

function rowToVital(r: VitalRow): VitalReading {
  return {
    id: r.id,
    patient_id: r.patient_id,
    timestamp: r.ts,
    type: r.type,
    value: Number(r.value),
    unit: r.unit,
    source: r.source,
  };
}

function rowToPatient(r: Record<string, unknown>): Patient {
  return {
    id: r.id as string,
    name: r.name as string,
    age: Number(r.age),
    gender: r.gender as string,
    language: r.language as string,
    living_status: r.living_status as string,
    conditions: (r.conditions as string[]) ?? [],
    caregiver_name: r.caregiver_name as string,
    caregiver_phone: r.caregiver_phone as string,
    assigned_nurse: r.assigned_nurse as string,
    baseline_weight: Number(r.baseline_weight),
    baseline_steps: Number(r.baseline_steps),
    phone: (r.phone as string | null) ?? null,
    status: ((r.status as PatientStatus) || "active") as PatientStatus,
  };
}

function rowToCheckin(r: Record<string, unknown>): DailyCheckIn {
  return {
    id: r.id as string,
    patient_id: r.patient_id as string,
    date: r.date as string,
    mood: (r.mood as string) ?? "",
    shortness_of_breath: Boolean(r.shortness_of_breath),
    swelling: Boolean(r.swelling),
    dizziness: Boolean(r.dizziness),
    chest_discomfort: Boolean(r.chest_discomfort),
    medication_taken: Boolean(r.medication_taken),
    free_text_note: (r.free_text_note as string | null) ?? null,
    source: r.source as DailyCheckIn["source"],
  };
}

function rowToAlert(r: Record<string, unknown>): RiskAlert {
  return {
    id: r.id as string,
    patient_id: r.patient_id as string,
    created_at: r.created_at as string,
    severity: r.severity as RiskAlert["severity"],
    matched_rules: (r.matched_rules as string[]) ?? [],
    reason: r.reason as string,
    recommended_action: r.recommended_action as string,
    status: r.status as AlertStatus,
    assigned_to: r.assigned_to as string,
    nurse_note: (r.nurse_note as string | null) ?? null,
  };
}

function rowToAudit(r: Record<string, unknown>): AuditEvent {
  return {
    id: r.id as string,
    actor: r.actor as string,
    action: r.action as AuditAction,
    target_type: r.target_type as string,
    target_id: r.target_id as string,
    metadata: (r.metadata as Record<string, unknown>) ?? {},
    created_at: r.created_at as string,
  };
}

function rowToSummary(r: Record<string, unknown>): WeeklySummary {
  return {
    id: r.id as string,
    patient_id: r.patient_id as string,
    week_start: r.week_start as string,
    week_end: r.week_end as string,
    generated_text: r.generated_text as string,
    caregiver_text_en: r.caregiver_text_en as string,
    caregiver_text_zh: r.caregiver_text_zh as string,
    data_completeness: Number(r.data_completeness),
    generated_by: r.generated_by as WeeklySummary["generated_by"],
    created_at: r.created_at as string,
  };
}

// --- fetchers -------------------------------------------------------------

async function fetchPatient(orgId: string, id: string): Promise<Patient | null> {
  const r = maybe(
    await supa()
      .from("careloop_patients")
      .select("*")
      .eq("org_id", orgId)
      .eq("id", id)
      .maybeSingle(),
  );
  return r ? rowToPatient(r as Record<string, unknown>) : null;
}

async function fetchPatients(orgId: string): Promise<Patient[]> {
  const data = rows(
    await supa()
      .from("careloop_patients")
      .select("*")
      .eq("org_id", orgId)
      .neq("status", "archived"),
  );
  return data.map((r) => rowToPatient(r as Record<string, unknown>));
}

async function fetchVitals(orgId: string, patientId: string): Promise<VitalReading[]> {
  const data = rows<VitalRow>(
    await supa()
      .from("careloop_vitals")
      .select("*")
      .eq("org_id", orgId)
      .eq("patient_id", patientId)
      .order("ts", { ascending: true }),
  );
  return data.map(rowToVital);
}

async function fetchCheckins(orgId: string, patientId: string): Promise<DailyCheckIn[]> {
  const data = rows(
    await supa()
      .from("careloop_checkins")
      .select("*")
      .eq("org_id", orgId)
      .eq("patient_id", patientId)
      .order("date", { ascending: true }),
  );
  return data.map((r) => rowToCheckin(r as Record<string, unknown>));
}

// --- audit ----------------------------------------------------------------

async function pushAudit(
  orgId: string,
  action: AuditAction,
  actor: string,
  target_type: string,
  target_id: string,
  metadata: Record<string, unknown> = {},
): Promise<AuditEvent> {
  const event: AuditEvent = {
    id: genId("audit"),
    actor,
    action,
    target_type,
    target_id,
    metadata,
    created_at: now(),
  };
  const { error } = await supa()
    .from("careloop_audit_events")
    .insert({ ...event, org_id: orgId });
  if (error) throw new Error(`Supabase: ${error.message}`);
  return event;
}

// --- risk + alerts --------------------------------------------------------

/**
 * Re-run the deterministic engine for a patient and create/refresh the active
 * alert. Mirrors the original in-memory dedup rules:
 *  - refresh an open alert in place,
 *  - don't recreate a duplicate already covered by a resolved alert,
 *  - only mint a new alert on genuine worsening.
 */
async function upsertAlertFor(
  orgId: string,
  patientId: string,
  actor: string,
): Promise<{ risk: RiskResult; alert: RiskAlert | null }> {
  const patient = await fetchPatient(orgId, patientId);
  if (!patient) return { risk: emptyRisk(), alert: null };

  const [vitals, checkins] = await Promise.all([
    fetchVitals(orgId, patientId),
    fetchCheckins(orgId, patientId),
  ]);
  const risk = evaluateRisk(patient, vitals, checkins);
  await pushAudit(orgId, "risk_evaluated", actor, "patient", patientId, {
    severity: risk.severity,
    matched_rules: risk.matched_rules.map((m) => m.code),
  });

  // Most recent alert for this patient (newest first).
  const recentRows = rows(
    await supa()
      .from("careloop_alerts")
      .select("*")
      .eq("org_id", orgId)
      .eq("patient_id", patientId)
      .order("created_at", { ascending: false })
      .limit(1),
  );
  const recent = recentRows.length ? rowToAlert(recentRows[0] as Record<string, unknown>) : null;
  const openAlert = recent && recent.status !== "resolved" ? recent : null;

  if (risk.severity === "stable") {
    return { risk, alert: openAlert };
  }

  if (openAlert) {
    const patch = {
      severity: risk.severity,
      matched_rules: risk.matched_rules.map((m) => m.code),
      reason: risk.reason,
      recommended_action: risk.recommended_action,
    };
    const { error } = await supa()
      .from("careloop_alerts")
      .update(patch)
      .eq("org_id", orgId)
      .eq("id", openAlert.id);
    if (error) throw new Error(`Supabase: ${error.message}`);
    await pushAudit(orgId, "alert_updated", actor, "alert", openAlert.id, {
      severity: risk.severity,
      patient_id: patientId,
    });
    return { risk, alert: { ...openAlert, ...patch } };
  }

  // A resolved alert already covers this severity (or worse) — don't recreate.
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
  const { error } = await supa()
    .from("careloop_alerts")
    .insert({ ...alert, org_id: orgId });
  if (error) {
    // 23505 = unique_violation on the careloop_alerts_one_open partial index: a
    // concurrent request already opened an alert for this patient in the race
    // window. Re-read that open alert and refresh it in place instead of
    // creating a duplicate.
    if ((error as { code?: string }).code === "23505") {
      const openRows = rows(
        await supa()
          .from("careloop_alerts")
          .select("*")
          .eq("org_id", orgId)
          .eq("patient_id", patientId)
          .neq("status", "resolved")
          .order("created_at", { ascending: false })
          .limit(1),
      );
      if (openRows.length) {
        const open = rowToAlert(openRows[0] as Record<string, unknown>);
        const patch = {
          severity: risk.severity,
          matched_rules: risk.matched_rules.map((m) => m.code),
          reason: risk.reason,
          recommended_action: risk.recommended_action,
        };
        const { error: updErr } = await supa()
          .from("careloop_alerts")
          .update(patch)
          .eq("org_id", orgId)
          .eq("id", open.id);
        if (updErr) throw new Error(`Supabase: ${updErr.message}`);
        return { risk, alert: { ...open, ...patch } };
      }
    }
    throw new Error(`Supabase: ${error.message}`);
  }
  await pushAudit(orgId, "alert_created", actor, "alert", alert.id, {
    severity: alert.severity,
    matched_rules: alert.matched_rules,
    patient_id: patientId,
  });
  return { risk, alert };
}

function emptyRisk(): RiskResult {
  return {
    severity: "stable",
    matched_rules: [],
    reason: "No data.",
    recommended_action: "No action needed. Continue routine monitoring.",
    reason_tags: [],
  };
}

// --- public read API ------------------------------------------------------

/** Non-archived patients in the organization. */
export async function getPatients(orgId: string): Promise<Patient[]> {
  return fetchPatients(orgId);
}

export async function getPatient(orgId: string, id: string): Promise<Patient | undefined> {
  return (await fetchPatient(orgId, id)) ?? undefined;
}

/** Dashboard rows. Fetches all four tables once and groups in memory (4 round
 * trips total, not per-patient). Archived patients are excluded. */
export async function getPatientRows(orgId: string): Promise<PatientRow[]> {
  const db = supa();
  const [patientsRes, vitalsRes, checkinsRes, alertsRes] = await Promise.all([
    db.from("careloop_patients").select("*").eq("org_id", orgId).neq("status", "archived"),
    db.from("careloop_vitals").select("*").eq("org_id", orgId).order("ts", { ascending: true }),
    db.from("careloop_checkins").select("*").eq("org_id", orgId).order("date", { ascending: true }),
    db
      .from("careloop_alerts")
      .select("*")
      .eq("org_id", orgId)
      .order("created_at", { ascending: false }),
  ]);
  const patients = rows(patientsRes).map((r) => rowToPatient(r as Record<string, unknown>));
  const allVitals = rows<VitalRow>(vitalsRes).map(rowToVital);
  const allCheckins = rows(checkinsRes).map((r) => rowToCheckin(r as Record<string, unknown>));
  const allAlerts = rows(alertsRes).map((r) => rowToAlert(r as Record<string, unknown>));

  const vitalsBy = groupBy(allVitals, (v) => v.patient_id);
  const checkinsBy = groupBy(allCheckins, (c) => c.patient_id);

  return patients.map((patient) => {
    const vitals = vitalsBy.get(patient.id) ?? [];
    const checkins = checkinsBy.get(patient.id) ?? [];
    const risk = evaluateRisk(patient, vitals, checkins);
    const lastCheckin = checkins.map((c) => c.date).sort().pop() ?? null;
    const daily = toDailyVitals(vitals);
    let latestWeight: number | null = null;
    for (let i = daily.length - 1; i >= 0; i--) {
      if (daily[i].weight !== null) {
        latestWeight = daily[i].weight;
        break;
      }
    }
    const open = allAlerts.find((a) => a.patient_id === patient.id && a.status !== "resolved");
    return {
      patient,
      risk,
      last_checkin_date: lastCheckin,
      alert_status: open?.status ?? null,
      latest_weight: latestWeight,
    };
  });
}

function groupBy<T, K>(items: T[], key: (t: T) => K): Map<K, T[]> {
  const m = new Map<K, T[]>();
  for (const item of items) {
    const k = key(item);
    const arr = m.get(k);
    if (arr) arr.push(item);
    else m.set(k, [item]);
  }
  return m;
}

export async function getTimeline(
  orgId: string,
  id: string,
): Promise<PatientTimeline | undefined> {
  const patient = await fetchPatient(orgId, id);
  if (!patient) return undefined;
  const [vitals, checkins] = await Promise.all([
    fetchVitals(orgId, id),
    fetchCheckins(orgId, id),
  ]);
  const sortedCheckins = [...checkins].sort((a, b) => a.date.localeCompare(b.date));
  return {
    patient,
    daily: toDailyVitals(vitals),
    checkins: sortedCheckins,
    risk: evaluateRisk(patient, vitals, checkins),
    risk_trend: riskTrend(patient, vitals, checkins),
  };
}

export async function getRisk(orgId: string, id: string): Promise<RiskResult | undefined> {
  const patient = await fetchPatient(orgId, id);
  if (!patient) return undefined;
  const [vitals, checkins] = await Promise.all([
    fetchVitals(orgId, id),
    fetchCheckins(orgId, id),
  ]);
  return evaluateRisk(patient, vitals, checkins);
}

export async function getAlerts(orgId: string): Promise<RiskAlert[]> {
  const data = rows(
    await supa()
      .from("careloop_alerts")
      .select("*")
      .eq("org_id", orgId)
      .order("created_at", { ascending: false }),
  );
  return data.map((r) => rowToAlert(r as Record<string, unknown>));
}

export async function getAlert(orgId: string, id: string): Promise<RiskAlert | undefined> {
  const r = maybe(
    await supa()
      .from("careloop_alerts")
      .select("*")
      .eq("org_id", orgId)
      .eq("id", id)
      .maybeSingle(),
  );
  return r ? rowToAlert(r as Record<string, unknown>) : undefined;
}

export async function getActiveAlert(
  orgId: string,
  patientId: string,
): Promise<RiskAlert | undefined> {
  const data = rows(
    await supa()
      .from("careloop_alerts")
      .select("*")
      .eq("org_id", orgId)
      .eq("patient_id", patientId)
      .neq("status", "resolved")
      .order("created_at", { ascending: false })
      .limit(1),
  );
  return data.length ? rowToAlert(data[0] as Record<string, unknown>) : undefined;
}

export async function getAuditEvents(orgId: string, limit?: number): Promise<AuditEvent[]> {
  let q = supa()
    .from("careloop_audit_events")
    .select("*")
    .eq("org_id", orgId)
    .order("created_at", { ascending: false })
    .order("id", { ascending: false }); // stable tiebreaker for same-millisecond inserts
  if (limit) q = q.limit(limit);
  const data = rows(await q);
  return data.map((r) => rowToAudit(r as Record<string, unknown>));
}

// --- patient CRUD -----------------------------------------------------------

/** Upsert the phone -> patient WhatsApp routing link. Twilio's From field uses
 * the `whatsapp:+<E.164>` form, so links are keyed that way. PK is
 * (phone, org_id) — per-org routing, no cross-tenant reassignment. */
async function upsertLink(orgId: string, phone: string, patientId: string): Promise<void> {
  const key = phone.startsWith("whatsapp:") ? phone : `whatsapp:${phone}`;
  const { error } = await supa()
    .from("careloop_links")
    .upsert({ phone: key, patient_id: patientId, org_id: orgId }, { onConflict: "phone,org_id" });
  if (error) throw new Error(`Supabase: ${error.message}`);
}

/** Create a patient (nurse-managed onboarding). */
export async function createPatient(
  orgId: string,
  input: PatientCreateInput,
  actor: string,
): Promise<Patient> {
  const patient: Patient = {
    id: genId("patient"),
    name: input.name,
    age: input.age,
    gender: input.gender,
    language: input.language,
    living_status: input.living_status,
    conditions: input.conditions,
    caregiver_name: input.caregiver_name ?? "",
    caregiver_phone: input.caregiver_phone ?? "",
    assigned_nurse: input.assigned_nurse,
    baseline_weight: input.baseline_weight,
    baseline_steps: input.baseline_steps,
    phone: input.phone ?? null,
    status: "active",
  };
  const { error } = await supa()
    .from("careloop_patients")
    .insert({ ...patient, org_id: orgId });
  if (error) throw new Error(`Supabase: ${error.message}`);
  if (patient.phone) await upsertLink(orgId, patient.phone, patient.id);
  await pushAudit(orgId, "patient_created", actor, "patient", patient.id, {
    name: patient.name,
  });
  return patient;
}

/** Update a patient. Archiving (status -> 'archived') is the soft delete. */
export async function updatePatient(
  orgId: string,
  id: string,
  input: PatientUpdateInput,
  actor: string,
): Promise<Patient | null> {
  const existing = await fetchPatient(orgId, id);
  if (!existing) return null;

  const patch: Record<string, unknown> = {};
  for (const key of [
    "name",
    "age",
    "gender",
    "language",
    "living_status",
    "conditions",
    "caregiver_name",
    "caregiver_phone",
    "assigned_nurse",
    "baseline_weight",
    "baseline_steps",
    "phone",
    "status",
  ] as const) {
    if (input[key] !== undefined) patch[key] = input[key];
  }
  if (Object.keys(patch).length === 0) return existing;

  const { error } = await supa()
    .from("careloop_patients")
    .update(patch)
    .eq("org_id", orgId)
    .eq("id", id);
  if (error) throw new Error(`Supabase: ${error.message}`);

  const updated = { ...existing, ...patch } as Patient;
  if (input.phone) await upsertLink(orgId, input.phone, id);

  // Archiving auto-resolves any open alert so the review queue never shows
  // ghost cards for patients no longer in the monitored population.
  if (input.status === "archived" && existing.status !== "archived") {
    const { error: alertErr } = await supa()
      .from("careloop_alerts")
      .update({ status: "resolved" })
      .eq("org_id", orgId)
      .eq("patient_id", id)
      .neq("status", "resolved");
    if (alertErr) throw new Error(`Supabase: ${alertErr.message}`);
  }

  const action: AuditAction = input.status === "archived" ? "patient_archived" : "patient_updated";
  await pushAudit(orgId, action, actor, "patient", id, { fields: Object.keys(patch) });
  return updated;
}

// --- public write API -----------------------------------------------------

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

/** Upsert one vital reading for a patient/day/type. The id mirrors the seed id
 * formula, so a manual reading overwrites the seeded value for that day. */
async function upsertVital(
  orgId: string,
  patientId: string,
  date: string,
  type: VitalType,
  value: number,
  unit: string,
): Promise<void> {
  const row = {
    id: `vital-${shortId(patientId)}-${date}-${type}`,
    patient_id: patientId,
    org_id: orgId,
    ts: `${date}T09:00:00Z`,
    type,
    value,
    unit,
    source: "manual" as const,
  };
  const { error } = await supa().from("careloop_vitals").upsert(row, { onConflict: "id" });
  if (error) throw new Error(`Supabase: ${error.message}`);
}

/** Submit a daily check-in (merge into any existing one), then re-evaluate. */
export async function submitCheckIn(
  orgId: string,
  patientId: string,
  input: CheckInInput,
  actor = "patient",
): Promise<{ checkin: DailyCheckIn; risk: RiskResult; alert: RiskAlert | null } | null> {
  const patient = await fetchPatient(orgId, patientId);
  if (!patient) return null;

  const date = input.date ?? todayISO();
  const existingRow = maybe(
    await supa()
      .from("careloop_checkins")
      .select("*")
      .eq("org_id", orgId)
      .eq("patient_id", patientId)
      .eq("date", date)
      .maybeSingle(),
  );
  const existing = existingRow ? rowToCheckin(existingRow as Record<string, unknown>) : null;

  const checkin: DailyCheckIn = existing ?? {
    id: `checkin-${shortId(patientId)}-${date}`,
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

  const { error: upsertErr } = await supa()
    .from("careloop_checkins")
    .upsert({ ...checkin, org_id: orgId }, { onConflict: "patient_id,date" });
  if (upsertErr) throw new Error(`Supabase: ${upsertErr.message}`);

  if (input.weight !== undefined) {
    await upsertVital(orgId, patientId, date, "weight", input.weight, "kg");
  }

  await pushAudit(orgId, "checkin_submitted", actor, "patient", patientId, { date });
  const { risk, alert } = await upsertAlertFor(orgId, patientId, actor);
  return { checkin, risk, alert };
}

/** Add a single vital reading, then re-evaluate. */
export async function addVital(
  orgId: string,
  patientId: string,
  type: VitalType,
  value: number,
  unit: string,
  date?: string,
): Promise<RiskResult | null> {
  if (!(await fetchPatient(orgId, patientId))) return null;
  await upsertVital(orgId, patientId, date ?? todayISO(), type, value, unit);
  return (await upsertAlertFor(orgId, patientId, "nurse")).risk;
}

export async function evaluatePatient(
  orgId: string,
  patientId: string,
  actor = "nurse",
): Promise<RiskResult | null> {
  if (!(await fetchPatient(orgId, patientId))) return null;
  return (await upsertAlertFor(orgId, patientId, actor)).risk;
}

export interface AlertPatch {
  status?: AlertStatus;
  nurse_note?: string | null;
}

export async function updateAlert(
  orgId: string,
  id: string,
  patch: AlertPatch,
  actor: string,
): Promise<RiskAlert | null> {
  const current = await getAlert(orgId, id);
  if (!current) return null;
  const next: Partial<RiskAlert> = {};
  if (patch.status) next.status = patch.status;
  if (patch.nurse_note !== undefined) next.nurse_note = patch.nurse_note;
  if (Object.keys(next).length > 0) {
    const { error } = await supa()
      .from("careloop_alerts")
      .update(next)
      .eq("org_id", orgId)
      .eq("id", id);
    if (error) throw new Error(`Supabase: ${error.message}`);
  }
  const updated: RiskAlert = { ...current, ...next };
  const action: AuditAction = patch.status === "acknowledged" ? "alert_acknowledged" : "alert_updated";
  await pushAudit(orgId, action, actor, "alert", id, {
    status: updated.status,
    patient_id: updated.patient_id,
  });
  return updated;
}

/** Canonical risky check-in for the demo replay button (Mrs. Chan). */
export async function runRiskyCheckIn(orgId: string): Promise<{
  checkin: DailyCheckIn;
  risk: RiskResult;
  alert: RiskAlert | null;
} | null> {
  const patientId = RISKY_CHECKIN_PATIENT_ID;
  const patient = await fetchPatient(orgId, patientId);
  if (!patient) return null;
  const date = todayISO();

  // Force the canonical deteriorating numbers so the engine always escalates.
  await upsertVital(orgId, patientId, date, "weight", 64.3, "kg");
  await upsertVital(orgId, patientId, date, "blood_pressure_systolic", 158, "mmHg");
  await upsertVital(orgId, patientId, date, "blood_pressure_diastolic", 94, "mmHg");
  await upsertVital(orgId, patientId, date, "heart_rate", 88, "bpm");
  await upsertVital(orgId, patientId, date, "steps", 1750, "steps");
  await upsertVital(orgId, patientId, date, "sleep_hours", 5.4, "h");

  await pushAudit(orgId, "risky_checkin_replayed", "demo", "patient", patientId, {});
  return submitCheckIn(
    orgId,
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
export async function importCsv(
  orgId: string,
  patientId: string,
  csvRows: CsvRow[],
  actor = "nurse",
): Promise<RiskResult | null> {
  if (!(await fetchPatient(orgId, patientId))) return null;
  for (const row of csvRows) {
    if (!row.date) continue;
    if (row.weight_kg !== undefined)
      await upsertVital(orgId, patientId, row.date, "weight", row.weight_kg, "kg");
    if (row.systolic_bp !== undefined)
      await upsertVital(orgId, patientId, row.date, "blood_pressure_systolic", row.systolic_bp, "mmHg");
    if (row.diastolic_bp !== undefined)
      await upsertVital(orgId, patientId, row.date, "blood_pressure_diastolic", row.diastolic_bp, "mmHg");
    if (row.heart_rate !== undefined)
      await upsertVital(orgId, patientId, row.date, "heart_rate", row.heart_rate, "bpm");
    if (row.steps !== undefined)
      await upsertVital(orgId, patientId, row.date, "steps", row.steps, "steps");
    if (row.sleep_hours !== undefined)
      await upsertVital(orgId, patientId, row.date, "sleep_hours", row.sleep_hours, "h");
    if (
      row.medication_taken !== undefined ||
      row.shortness_of_breath !== undefined ||
      row.swelling !== undefined
    ) {
      await submitCheckIn(
        orgId,
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
  await pushAudit(orgId, "csv_imported", actor, "patient", patientId, { rows: csvRows.length });
  return (await upsertAlertFor(orgId, patientId, actor)).risk;
}

// --- weekly summary persistence -------------------------------------------

export async function saveWeeklySummary(
  orgId: string,
  summary: WeeklySummary,
  actor = "nurse",
): Promise<void> {
  const { error } = await supa()
    .from("careloop_summaries")
    .insert({ ...summary, org_id: orgId });
  if (error) throw new Error(`Supabase: ${error.message}`);
  await pushAudit(orgId, "weekly_summary_generated", actor, "patient", summary.patient_id, {
    generated_by: summary.generated_by,
  });
}

export async function getLatestSummary(
  orgId: string,
  patientId: string,
): Promise<WeeklySummary | undefined> {
  const data = rows(
    await supa()
      .from("careloop_summaries")
      .select("*")
      .eq("org_id", orgId)
      .eq("patient_id", patientId)
      .order("created_at", { ascending: false })
      .limit(1),
  );
  return data.length ? rowToSummary(data[0] as Record<string, unknown>) : undefined;
}

export async function recordAudit(
  orgId: string,
  action: AuditAction,
  actor: string,
  target_type: string,
  target_id: string,
  metadata: Record<string, unknown> = {},
): Promise<void> {
  await pushAudit(orgId, action, actor, target_type, target_id, metadata);
}

// --- seed + demo controls -------------------------------------------------

/** Insert the synthetic seed dataset: core rows upsert by deterministic id (so a
 * direct re-seed is safe and won't duplicate them), then compute each patient's
 * alert deterministically. Normally reached via resetDemo() which wipes the org
 * first, so the append-only audit rows don't accumulate in practice. */
// Only this subset is pre-seeded as the starting "nurse queue" (the Sockel).
// Every other profile in lib/seed is a clone template that appears only when a
// new WhatsApp number onboards (createPatientFromWhatsApp in DEMO_MODE).
const BASELINE_IDS = new Set([
  "patient-mrs-chan",
  "patient-mr-lee",
  "patient-mrs-wong",
  "patient-mr-ho",
  "patient-mrs-lam",
]);

export async function seedDatabase(orgId: string, seedAudit = true): Promise<void> {
  const all = buildSeed();
  const seed = {
    patients: all.patients.filter((p) => BASELINE_IDS.has(p.id)),
    vitals: all.vitals.filter((v) => BASELINE_IDS.has(v.patient_id)),
    checkins: all.checkins.filter((c) => BASELINE_IDS.has(c.patient_id)),
  };
  const db = supa();

  const patientRows = seed.patients.map((p) => ({ ...p, org_id: orgId }));
  const e1 = (await db.from("careloop_patients").upsert(patientRows, { onConflict: "id" })).error;
  if (e1) throw new Error(`Supabase: ${e1.message}`);

  const vitalRows = seed.vitals.map((v) => ({
    id: v.id,
    patient_id: v.patient_id,
    org_id: orgId,
    ts: v.timestamp,
    type: v.type,
    value: v.value,
    unit: v.unit,
    source: v.source,
  }));
  const e2 = (await db.from("careloop_vitals").upsert(vitalRows, { onConflict: "id" })).error;
  if (e2) throw new Error(`Supabase: ${e2.message}`);

  const checkinRows = seed.checkins.map((c) => ({ ...c, org_id: orgId }));
  const e3 = (
    await db.from("careloop_checkins").upsert(checkinRows, { onConflict: "patient_id,date" })
  ).error;
  if (e3) throw new Error(`Supabase: ${e3.message}`);

  // Compute initial alerts deterministically from the seeded data.
  let alertCount = 0;
  for (const p of seed.patients) {
    const { alert } = await upsertAlertFor(orgId, p.id, "system");
    if (alert) alertCount++;
  }

  if (seedAudit) {
    await pushAudit(orgId, "demo_data_seeded", "system", "dataset", "demo", {
      patients: seed.patients.length,
      alerts: alertCount,
    });
  }
}

/** Wipe ONE organization's data and reseed the demo to a known state. */
export async function resetDemo(orgId: string, actor = "demo"): Promise<void> {
  const { error } = await supa().rpc("careloop_reset_org", { p_org: orgId });
  if (error) throw new Error(`Supabase: ${error.message}`);
  await seedDatabase(orgId, false);
  await pushAudit(orgId, "demo_data_reset", actor, "dataset", "demo", {});
}

/** Patient already holding this phone in the org (race-loser recovery). */
async function findPatientByPhone(orgId: string, e164: string): Promise<string | null> {
  const { data, error } = await supa()
    .from("careloop_patients")
    .select("id")
    .eq("org_id", orgId)
    .eq("phone", e164)
    .maybeSingle();
  if (error) throw new Error(`Supabase: ${error.message}`);
  return (data?.id as string | undefined) ?? null;
}

/**
 * Patient auto-creation for an unknown inbound WhatsApp number.
 *
 * DEMO_MODE: clone one of the mock Hong Kong templates with its synthetic
 * 7-day history so the dashboard instantly shows a realistic state.
 *
 * Production: create a MINIMAL record — never synthetic clinical data on a
 * real patient — flagged `pending_review` so a nurse confirms the details.
 *
 * Race-safe: the unique (org_id, phone) index makes the second of two
 * concurrent first messages fail with 23505; we then return the winner's id.
 */
export async function createPatientFromWhatsApp(orgId: string, phone: string): Promise<string> {
  const e164 = phone.replace(/^whatsapp:/, "");
  if (isDemoMode()) return createPatientFromMock(orgId, e164);

  const patient: Patient = {
    id: genId("patient"),
    name: `WhatsApp patient ${e164.slice(-4).padStart(4, "•")}`,
    age: 0, // unknown until a nurse reviews — UI renders "—"
    gender: "",
    language: "Cantonese",
    living_status: "",
    conditions: [],
    caregiver_name: "",
    caregiver_phone: "",
    assigned_nurse: "Unassigned",
    baseline_weight: 0,
    baseline_steps: 0,
    phone: e164,
    status: "pending_review",
  };
  const { error } = await supa()
    .from("careloop_patients")
    .insert({ ...patient, org_id: orgId });
  if (error) {
    if ((error as { code?: string }).code === "23505") {
      const winner = await findPatientByPhone(orgId, e164);
      if (winner) return winner;
    }
    throw new Error(`Supabase: ${error.message}`);
  }
  await pushAudit(orgId, "patient_created", "whatsapp-webhook", "patient", patient.id, {
    source: "whatsapp_inbound",
  });
  return patient.id;
}

/** DEMO_MODE only: fresh patient cloned from a mock template (cycling names)
 * with its synthetic 7-day history. */
async function createPatientFromMock(orgId: string, e164?: string): Promise<string> {
  const db = supa();
  const seed = buildSeed();

  const { data: existing } = await db
    .from("careloop_patients")
    .select("id")
    .eq("org_id", orgId)
    .like("id", "demo-%");
  const count = existing?.length ?? 0;
  // random clinical profile + next name from the pool (unique until it wraps)
  const tpl = seed.patients[Math.floor(Math.random() * seed.patients.length)];
  const tplId = tpl.id;
  const newId = `demo-${Math.random().toString(36).slice(2, 8)}`;
  const name = MOCK_NAMES[count % MOCK_NAMES.length];

  const patient = {
    ...tpl,
    id: newId,
    name,
    phone: e164 ?? null,
    status: "pending_review",
    org_id: orgId,
  };
  const e1 = (await db.from("careloop_patients").insert(patient)).error;
  if (e1) {
    // 23505 on the (org_id, phone) unique index: a concurrent webhook already
    // created this number's patient — reuse it.
    if ((e1 as { code?: string }).code === "23505" && e164) {
      const winner = await findPatientByPhone(orgId, e164);
      if (winner) return winner;
    }
    throw new Error(`Supabase: ${e1.message}`);
  }

  const vitals = seed.vitals
    .filter((v) => v.patient_id === tplId)
    .map((v) => ({
      id: `vital-${newId}-${v.timestamp.slice(0, 10)}-${v.type}`,
      patient_id: newId,
      org_id: orgId,
      ts: v.timestamp,
      type: v.type,
      value: v.value,
      unit: v.unit,
      source: v.source,
    }));
  const e2 = (await db.from("careloop_vitals").insert(vitals)).error;
  if (e2) throw new Error(`Supabase: ${e2.message}`);

  const checkins = seed.checkins
    .filter((c) => c.patient_id === tplId)
    .map((c) => ({
      id: `checkin-${newId}-${c.date}`,
      patient_id: newId,
      org_id: orgId,
      date: c.date,
      mood: c.mood,
      shortness_of_breath: c.shortness_of_breath,
      swelling: c.swelling,
      dizziness: c.dizziness,
      chest_discomfort: c.chest_discomfort,
      medication_taken: c.medication_taken,
      free_text_note: c.free_text_note,
      source: c.source,
    }));
  const e3 = (await db.from("careloop_checkins").insert(checkins)).error;
  if (e3) throw new Error(`Supabase: ${e3.message}`);

  await upsertAlertFor(orgId, newId, "system");
  return newId;
}

export const DEMO_WEEK = { start: WEEK_START, end: WEEK_END, dates: DEMO_DATES };
