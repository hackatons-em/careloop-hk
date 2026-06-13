// Outbound notification service (server-only).
//
// Delivers the deterministic engine's verdicts to humans: nurse paging email
// when an alert is created or its severity rises, SLA re-pages when an alert
// sits unacknowledged, and caregiver delivery of the bilingual family alert.
// Severity is NEVER decided here — this module only transports it.
//
// Best-effort by design: the alert row is the source of truth; a failed
// notification is logged and reported to the caller (for audit), never thrown.
// Nurse-facing email bodies are English-only — clinical text policy.
//
// Resend testing-mode caveat: until a sending domain is verified, Resend only
// delivers to the account owner's inbox (documented in docs/GO-TO-MARKET.md).

import "server-only";
import { logger } from "./logger";
import type { OrgSettings } from "./orgSettings";
import type { Patient, RiskAlert } from "./types";
import { SEVERITY_LABEL, SEVERITY_ORDER } from "./types";

export type AlertNotifyKind = "created" | "raised" | "sla_breach" | "sla_admin";

const KIND_INTRO: Record<AlertNotifyKind, string> = {
  created: "A new alert needs review.",
  raised: "An open alert's severity has RISEN.",
  sla_breach: "An alert is still UNACKNOWLEDGED past the acknowledgement window.",
  sla_admin:
    "ESCALATION CHAIN: an alert remained unacknowledged after re-paging. Please ensure ward follow-up.",
};

function siteUrl(): string {
  return process.env.NEXT_PUBLIC_SITE_URL ?? "https://miruwa.com";
}

async function sendEmail(to: string, subject: string, text: string): Promise<boolean> {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey || !to) return false;
  const from = process.env.RESEND_FROM_EMAIL ?? "Miruwa <onboarding@resend.dev>";
  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ from, to: [to], subject, text }),
      signal: AbortSignal.timeout(10_000),
    });
    if (!res.ok) {
      const detail = await res.text().catch(() => "");
      logger.error("Notification email failed.", { status: res.status, detail });
      return false;
    }
    return true;
  } catch (err) {
    logger.error("Notification email errored.", { err });
    return false;
  }
}

/** The inbox an org's alert pages go to (settings, else env fallback). */
export function alertsInbox(settings: OrgSettings): string {
  return settings.alerts_email || process.env.LEADS_NOTIFY_EMAIL || "";
}

/** Should this severity page the nurse at all, per org settings? */
export function meetsNotifyThreshold(settings: OrgSettings, severity: RiskAlert["severity"]): boolean {
  return SEVERITY_ORDER[severity] >= SEVERITY_ORDER[settings.notify_min_severity];
}

/**
 * Page the ward about an alert. Returns whether an email actually went out
 * (the caller records the audit event and stamps last_notified_at).
 */
export async function notifyNurseOfAlert(
  to: string,
  patient: Patient,
  alert: RiskAlert,
  kind: AlertNotifyKind,
): Promise<boolean> {
  if (!to) {
    logger.info("Alert notification skipped — no alerts inbox configured.");
    return false;
  }
  const sev = SEVERITY_LABEL[alert.severity];
  const subject = `[Miruwa] ${sev} — ${patient.name}`;
  const text = [
    KIND_INTRO[kind],
    ``,
    `Patient:    ${patient.name}, ${patient.age} (${patient.conditions.join(", ") || "—"})`,
    `Severity:   ${sev}`,
    `Rules:      ${alert.matched_rules.join(", ") || "—"}`,
    `Evidence:   ${alert.reason}`,
    `Action:     ${alert.recommended_action}`,
    `Assigned:   ${alert.assigned_to}`,
    ``,
    `Review queue: ${siteUrl()}/alerts`,
    ``,
    `Severity was decided by Miruwa's deterministic monitoring rules (engine ${alert.engine_version ?? "n/a"}). Monitoring support — not diagnosis.`,
  ].join("\n");
  return sendEmail(to, subject, text);
}

/**
 * Email the caregiver their bilingual family alert. WhatsApp delivery is
 * handled by the caller (lib/whatsapp); this is the email leg.
 */
export async function emailCaregiverAlert(
  to: string,
  patientName: string,
  text: { en: string; zh: string; ar: string },
  preferred?: string | null,
): Promise<boolean> {
  if (!to) return false;
  const subject = `Miruwa update — ${patientName}`;
  const body =
    preferred === "ar" ? text.ar : [text.zh, ``, `—`, ``, text.en].join("\n");
  return sendEmail(to, subject, body);
}

/** Email leg of the weekly family digest. */
export async function emailFamilyDigest(
  to: string,
  patientName: string,
  text: { en: string; zh: string; ar: string },
  preferred?: string | null,
): Promise<boolean> {
  if (!to) return false;
  const subject = `Miruwa weekly update — ${patientName}`;
  const body =
    preferred === "ar" ? text.ar : [text.zh, ``, `—`, ``, text.en].join("\n");
  return sendEmail(to, subject, body);
}
