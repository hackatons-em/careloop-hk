// SMS adapter — Twilio Programmable SMS (same account as WhatsApp).
//
// The non-WhatsApp fallback: elderly caregivers without the app still get
// the message. Needs TWILIO_SMS_FROM (a Twilio phone number); works without
// WhatsApp Business approval.

import "server-only";
import type { SendResult } from "../whatsapp";
import type { OutboundChannel } from "./index";

export const sendSms: OutboundChannel = {
  id: "sms",
  configured() {
    return Boolean(
      process.env.TWILIO_ACCOUNT_SID &&
        process.env.TWILIO_AUTH_TOKEN &&
        process.env.TWILIO_SMS_FROM,
    );
  },
  async send(to: string, body: string): Promise<SendResult> {
    const sid = process.env.TWILIO_ACCOUNT_SID;
    const token = process.env.TWILIO_AUTH_TOKEN;
    const from = process.env.TWILIO_SMS_FROM;
    if (!sid || !token || !from) return { ok: false, error: "SMS not configured" };

    // SMS addresses are bare E.164 — strip any whatsapp: channel prefix.
    const toAddr = to.replace(/^whatsapp:/, "");
    try {
      const res = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${sid}/Messages.json`, {
        method: "POST",
        headers: {
          Authorization: "Basic " + Buffer.from(`${sid}:${token}`).toString("base64"),
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: new URLSearchParams({ From: from, To: toAddr, Body: body }).toString(),
      });
      const data = (await res.json().catch(() => ({}))) as { sid?: string; message?: string };
      if (!res.ok) return { ok: false, error: data.message ?? `Twilio error ${res.status}` };
      return { ok: true, sid: data.sid };
    } catch (err) {
      return { ok: false, error: err instanceof Error ? err.message : "send failed" };
    }
  },
};
