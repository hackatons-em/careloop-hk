// Typed client-side fetch helpers for the CareLoop API.
// All calls are relative and run in the browser. The audit actor is always the
// signed-in user (derived server-side from the session) — never sent by the client.

import type {
  AlertStatus,
  AuditEvent,
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

  patchAlert: (id: string, patch: { status?: AlertStatus; nurse_note?: string | null }) =>
    fetch(`/api/alerts/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(patch),
    }).then(json<RiskAlert>),

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
    }).then(json<{ en: string; zh: string; alert_status: string | null }>),

  importCsv: (patient_id: string, csv: string) =>
    fetch("/api/demo/import-csv", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ patient_id, csv }),
    }).then(json<{ ok: boolean; imported: number }>),

  listUsers: () => fetch("/api/admin/users").then(json<UserProfile[]>),

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
