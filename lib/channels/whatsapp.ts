// WhatsApp adapter — wraps the existing Twilio WhatsApp transport.

import "server-only";
import { sendWhatsApp, type SendResult } from "../whatsapp";
import type { OutboundChannel } from "./index";

export const sendWhatsAppChannel: OutboundChannel = {
  id: "whatsapp",
  configured() {
    return Boolean(process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN);
  },
  send(to: string, body: string): Promise<SendResult> {
    return sendWhatsApp(to, body);
  },
};
