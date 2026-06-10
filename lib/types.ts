// CareLoop — domain types
// Shared contract for the data layer (teammate-1 zone), risk engine (core),
// API routes, and UI. Keep this the single source of truth for shapes.

export type Severity = "stable" | "watch" | "review_today" | "escalate";

export const SEVERITY_ORDER: Record<Severity, number> = {
  stable: 0,
  watch: 1,
  review_today: 2,
  escalate: 3,
};

export const SEVERITY_LABEL: Record<Severity, string> = {
  stable: "Stable",
  watch: "Watch",
  review_today: "Review today",
  escalate: "Escalate",
};

export type AlertStatus =
  | "new"
  | "acknowledged"
  | "family_contacted"
  | "clinician_review_requested"
  | "resolved";

export const ALERT_STATUS_LABEL: Record<AlertStatus, string> = {
  new: "New",
  acknowledged: "Acknowledged",
  family_contacted: "Family contacted",
  clinician_review_requested: "Clinician review requested",
  resolved: "Resolved",
};

export type VitalType =
  | "weight"
  | "blood_pressure_systolic"
  | "blood_pressure_diastolic"
  | "heart_rate"
  | "steps"
  | "sleep_hours";

export type CheckInSource = "simulated_call" | "web_form" | "imported";
export type VitalSource = "manual" | "wearable_csv" | "mock";

/** Lifecycle of a patient record. `pending_review` = auto-created from an
 * unknown WhatsApp number, awaiting nurse confirmation. `archived` = soft
 * deleted (hidden from lists, history preserved). */
export type PatientStatus = "active" | "pending_review" | "archived";

export interface Patient {
  id: string;
  name: string;
  age: number;
  gender: string;
  language: string;
  living_status: string;
  conditions: string[];
  caregiver_name: string;
  caregiver_phone: string;
  caregiver_email: string;
  assigned_nurse: string;
  baseline_weight: number;
  baseline_steps: number;
  /** Patient's own WhatsApp number (E.164), if known. */
  phone: string | null;
  status: PatientStatus;
  /** Family-bound auto-sends are OFF until explicitly consented. */
  consent_caregiver_alerts: boolean;
  consent_family_digest: boolean;
  consent_updated_at: string | null;
}

export interface DailyCheckIn {
  id: string;
  patient_id: string;
  date: string; // ISO date (YYYY-MM-DD)
  mood: string;
  shortness_of_breath: boolean;
  swelling: boolean;
  dizziness: boolean;
  chest_discomfort: boolean;
  medication_taken: boolean;
  free_text_note: string | null;
  source: CheckInSource;
}

export interface VitalReading {
  id: string;
  patient_id: string;
  timestamp: string; // ISO datetime
  type: VitalType;
  value: number;
  unit: string;
  source: VitalSource;
}

/** A matched deterministic rule with the data evidence that triggered it. */
export interface MatchedRule {
  code: string; // e.g. "HF-001"
  severity: Severity;
  description: string;
  evidence: string;
}

/** Output of the deterministic risk engine. Never produced by an LLM. */
export interface RiskResult {
  severity: Severity;
  matched_rules: MatchedRule[];
  reason: string;
  recommended_action: string;
  /** short machine reasons for badges, e.g. ["weight gain","missed meds"] */
  reason_tags: string[];
}

export interface RiskAlert {
  id: string;
  patient_id: string;
  created_at: string;
  severity: Severity;
  matched_rules: string[];
  reason: string;
  recommended_action: string;
  status: AlertStatus;
  assigned_to: string;
  nurse_note: string | null;
  /** First transition out of "new" — basis for time-to-acknowledge metrics. */
  acknowledged_at: string | null;
  resolved_at: string | null;
  /** Last outbound notification for this alert — SLA-sweep dedupe stamp. */
  last_notified_at: string | null;
  /** Rule-catalog version that produced this alert (ENGINE_VERSION). */
  engine_version: string | null;
  /** Org threshold-config version in force when this alert was produced
   *  (0 = code defaults; see careloop_rule_config). */
  config_version: number | null;
}

export interface WeeklySummary {
  id: string;
  patient_id: string;
  week_start: string;
  week_end: string;
  generated_text: string; // clinician-facing summary
  caregiver_text_en: string;
  caregiver_text_zh: string;
  data_completeness: number; // 0..1
  generated_by: "ai" | "template";
  created_at: string;
}

export interface AuditEvent {
  id: string;
  actor: string;
  action: AuditAction;
  target_type: string;
  target_id: string;
  metadata: Record<string, unknown>;
  created_at: string;
}

export type AuditAction =
  | "demo_data_seeded"
  | "checkin_submitted"
  | "risk_evaluated"
  | "alert_created"
  | "alert_acknowledged"
  | "alert_updated"
  | "caregiver_alert_generated"
  | "weekly_summary_generated"
  | "pdf_exported"
  | "fhir_exported"
  | "csv_imported"
  | "demo_data_reset"
  | "risky_checkin_replayed"
  | "patient_created"
  | "patient_updated"
  | "patient_archived"
  | "user_invited"
  | "nurse_notified"
  | "alert_sla_breached"
  | "caregiver_notified"
  | "consent_changed"
  | "weekly_digest_sent"
  | "org_settings_updated"
  | "alert_reassigned"
  | "task_created"
  | "task_completed"
  | "handover_generated"
  | "rule_config_updated";

/** Pivoted per-day view used by charts and the risk engine. */
export interface DailyVitals {
  date: string;
  weight: number | null;
  systolic: number | null;
  diastolic: number | null;
  heart_rate: number | null;
  steps: number | null;
  sleep_hours: number | null;
}

/** Combined timeline payload returned by GET /api/patients/:id/timeline */
export interface PatientTimeline {
  patient: Patient;
  daily: DailyVitals[];
  checkins: DailyCheckIn[];
  risk: RiskResult;
  risk_trend: { date: string; score: number; severity: Severity }[];
}

/** Patient summary row for the dashboard (patient + computed risk + alert). */
export interface PatientRow {
  patient: Patient;
  risk: RiskResult;
  last_checkin_date: string | null;
  alert_status: AlertStatus | null;
  latest_weight: number | null;
}

/** Ward follow-up task, optionally linked to the alert that prompted it. */
export interface FollowUpTask {
  id: string;
  patient_id: string;
  alert_id: string | null;
  description: string;
  due_at: string;
  assigned_to: string;
  status: "open" | "done";
  created_by: string;
  created_at: string;
  done_at: string | null;
}
