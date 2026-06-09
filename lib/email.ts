// Lead-notification email via the Resend REST API (server-only).
//
// Best-effort by design: the careloop_leads row is the source of truth, the
// email is a convenience ping. Env-gated on RESEND_API_KEY +
// LEADS_NOTIFY_EMAIL; failures are logged and swallowed, never thrown.
// Plain-text body on purpose — user-supplied content never becomes HTML.

import "server-only";
import { logger } from "./logger";

export interface LeadEmailInput {
  name: string;
  organization: string;
  role: string;
  email: string;
  phone: string;
  message: string;
  interest: string;
  locale: string;
}

export async function sendLeadNotification(lead: LeadEmailInput): Promise<void> {
  const apiKey = process.env.RESEND_API_KEY;
  const to = process.env.LEADS_NOTIFY_EMAIL;
  if (!apiKey || !to) {
    logger.info("Resend/LEADS_NOTIFY_EMAIL unset — lead stored in DB only.");
    return;
  }

  const from = process.env.RESEND_FROM_EMAIL ?? "CareLoop <onboarding@resend.dev>";
  const text = [
    `Name:         ${lead.name}`,
    `Organization: ${lead.organization}`,
    `Role:         ${lead.role || "—"}`,
    `Email:        ${lead.email}`,
    `Phone:        ${lead.phone || "—"}`,
    `Interest:     ${lead.interest}`,
    `Locale:       ${lead.locale}`,
    ``,
    `Message:`,
    lead.message || "—",
    ``,
    `Reply directly to the lead, then mark the status in Settings → Leads.`,
  ].join("\n");

  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from,
        to: [to],
        reply_to: lead.email,
        subject: `New CareLoop lead — ${lead.organization} (${lead.interest})`,
        text,
      }),
      signal: AbortSignal.timeout(10_000),
    });
    if (!res.ok) {
      const detail = await res.text().catch(() => "");
      logger.error("Lead notification email failed.", { status: res.status, detail });
      return;
    }
    logger.info("Lead notification email sent.");
  } catch (err) {
    logger.error("Lead notification email errored.", { err });
  }
}
