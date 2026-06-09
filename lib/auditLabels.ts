import type { AuditAction } from "./types";

export const AUDIT_LABEL: Record<AuditAction, string> = {
  demo_data_seeded: "Demo data seeded",
  checkin_submitted: "Check-in submitted",
  risk_evaluated: "Risk evaluated",
  alert_created: "Alert created",
  alert_acknowledged: "Alert acknowledged",
  alert_updated: "Alert updated",
  caregiver_alert_generated: "Caregiver alert generated",
  weekly_summary_generated: "Weekly summary generated",
  pdf_exported: "PDF exported",
  fhir_exported: "FHIR exported",
  csv_imported: "CSV imported",
  demo_data_reset: "Demo data reset",
  risky_checkin_replayed: "Risky check-in replayed",
  patient_created: "Patient created",
  patient_updated: "Patient updated",
  patient_archived: "Patient archived",
  user_invited: "User invited",
};
