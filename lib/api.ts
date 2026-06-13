// Typed client-side fetch helpers for the Miruwa API.
// All calls are relative and run in the browser. The audit actor is always the
// signed-in user (derived server-side from the session) — never sent by the client.

import type {
  AlertStatus,
  AuditEvent,
  FollowUpTask,
  Patient,
  PatientRow,
  PatientTimeline,
  RiskAlert,
  RiskResult,
  WeeklySummary,
  DailyCheckIn,
} from "./types";
import type { PatientCreateInput, PatientUpdateInput } from "./validation";

async function json<T>(res: Response): Promise<T> {
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error((body as { error?: string }).error ?? `Request failed (${res.status})`);
  }
  return res.json() as Promise<T>;
}

export interface CheckInPayload {
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

export interface UserProfile {
  id: string;
  org_id: string;
  role: "admin" | "nurse";
  name: string;
  email: string;
  created_at: string;
}

export interface Lead {
  id: string;
  name: string;
  organization: string;
  role: string;
  email: string;
  phone: string;
  message: string;
  interest: "pilot" | "demo" | "pricing" | "other";
  locale: string;
  status: "new" | "contacted" | "closed";
  created_at: string;
}

/** Mirror of lib/orgSettings.ts OrgSettings (that module is server-only). */
export interface OrgSettingsDto {
  alerts_email: string;
  admin_email: string;
  notify_min_severity: "escalate" | "review_today";
  sla_ack_minutes_escalate: number;
  sla_ack_minutes_review: number;
}

export interface LeadPayload {
  name: string;
  organization: string;
  role: string;
  email: string;
  phone: string;
  message: string;
  interest: Lead["interest"];
  locale: string;
  /** Honeypot — always submitted empty by the real form. */
  website: string;
}

export const api = {
  patients: () => fetch("/api/patients").then(json<PatientRow[]>),
  timeline: (id: string) => fetch(`/api/patients/${id}/timeline`).then(json<PatientTimeline>),
  alerts: () => fetch("/api/alerts").then(json<RiskAlert[]>),
  audit: (limit = 50) => fetch(`/api/audit-events?limit=${limit}`).then(json<AuditEvent[]>),

  createPatient: (payload: PatientCreateInput) =>
    fetch("/api/patients", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    }).then(json<Patient>),

  updatePatient: (id: string, payload: PatientUpdateInput) =>
    fetch(`/api/patients/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    }).then(json<Patient>),

  archivePatient: (id: string) =>
    fetch(`/api/patients/${id}`, { method: "DELETE" }).then(
      json<{ ok: boolean; patient: Patient }>,
    ),

  submitCheckIn: (id: string, payload: CheckInPayload) =>
    fetch(`/api/patients/${id}/checkins`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    }).then(json<{ checkin: DailyCheckIn; risk: RiskResult; alert: RiskAlert | null }>),

  patchAlert: (
    id: string,
    patch: { status?: AlertStatus; nurse_note?: string | null; assigned_to?: string },
  ) =>
    fetch(`/api/alerts/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(patch),
    }).then(json<RiskAlert>),

  openTasks: () => fetch("/api/tasks").then(json<FollowUpTask[]>),

  createTask: (payload: {
    patient_id: string;
    alert_id?: string | null;
    description: string;
    due_at?: string;
    assigned_to?: string;
  }) =>
    fetch("/api/tasks", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    }).then(json<FollowUpTask>),

  resolveTask: (id: string, status: "done" | "cancelled") =>
    fetch(`/api/tasks/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    }).then(json<FollowUpTask>),

  reset: () =>
    fetch("/api/demo/reset", { method: "POST" }).then(json<{ ok: boolean; rows: PatientRow[] }>),

  runRiskyCheckIn: () =>
    fetch("/api/demo/run-risky-checkin", { method: "POST" }).then(
      json<{ checkin: DailyCheckIn; risk: RiskResult; alert: RiskAlert | null }>,
    ),

  weeklySummary: (id: string) =>
    fetch(`/api/patients/${id}/weekly-summary`, { method: "POST" }).then(json<WeeklySummary>),

  fhirExport: (id: string) =>
    fetch(`/api/patients/${id}/fhir-export`).then(json<Record<string, unknown>>),

  caregiverAlert: (id: string, notify_family = false) =>
    fetch(`/api/patients/${id}/caregiver-alert`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ notify_family }),
    }).then(json<{ en: string; zh: string; ar: string; alert_status: string | null }>),

  importCsv: (patient_id: string, csv: string) =>
    fetch("/api/demo/import-csv", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ patient_id, csv }),
    }).then(json<{ ok: boolean; imported: number }>),

  submitLead: (payload: LeadPayload) =>
    fetch("/api/leads", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    }).then(json<{ ok: boolean }>),

  listLeads: () => fetch("/api/leads").then(json<Lead[]>),

  patchLead: (id: string, patch: { status: Lead["status"] }) =>
    fetch(`/api/leads/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(patch),
    }).then(json<Lead>),

  listUsers: () => fetch("/api/admin/users").then(json<UserProfile[]>),

  orgSettings: () => fetch("/api/admin/org-settings").then(json<OrgSettingsDto>),

  patchOrgSettings: (patch: Partial<OrgSettingsDto>) =>
    fetch("/api/admin/org-settings", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(patch),
    }).then(json<OrgSettingsDto>),

  inviteUser: (payload: { email: string; name: string; role: "admin" | "nurse" }) =>
    fetch("/api/admin/users", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    }).then(json<{ ok: boolean; id: string; email: string; name: string; role: string }>),
};

/** URL for the server-generated weekly PDF (opened/downloaded directly). */
export const pdfUrl = (id: string) => `/api/patients/${id}/pdf`;
export const fhirUrl = (id: string) => `/api/patients/${id}/fhir-export`;
