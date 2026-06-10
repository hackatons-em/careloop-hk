// Outbound channel adapter layer (server-only).
//
// One interface for every way CareLoop reaches a human: WhatsApp today,
// SMS as the non-WhatsApp fallback (elderly recipients without the app),
// WeChat once the Official Account application lands. Inbound conversation
// stays WhatsApp-only for now (the check-in webhook); this layer is for
// OUTBOUND notification delivery — caregiver alerts, family digests.
//
// sendWithFallback tries channels in order and reports which one delivered,
// so the audit trail always records the real channel.

import "server-only";
import { logger } from "../logger";
import type { SendResult } from "../whatsapp";
import { sendSms } from "./sms";
import { sendWeChat } from "./wechat";
import { sendWhatsAppChannel } from "./whatsapp";

export type ChannelId = "whatsapp" | "sms" | "wechat";

export interface OutboundChannel {
  id: ChannelId;
  /** Is this channel configured (env credentials present)? */
  configured(): boolean;
  send(to: string, body: string): Promise<SendResult>;
}

export const CHANNELS: Record<ChannelId, OutboundChannel> = {
  whatsapp: sendWhatsAppChannel,
  sms: sendSms,
  wechat: sendWeChat,
};

export interface FallbackResult {
  delivered: ChannelId | null;
  attempts: { channel: ChannelId; ok: boolean; error?: string }[];
}

/**
 * Try each configured channel in order until one delivers. Unconfigured
 * channels are skipped silently (an instance without SMS credentials simply
 * has no SMS leg).
 */
export async function sendWithFallback(
  order: ChannelId[],
  to: string,
  body: string,
): Promise<FallbackResult> {
  const attempts: FallbackResult["attempts"] = [];
  for (const id of order) {
    const channel = CHANNELS[id];
    if (!channel.configured()) continue;
    const result = await channel.send(to, body);
    attempts.push({ channel: id, ok: result.ok, error: result.error });
    if (result.ok) return { delivered: id, attempts };
    logger.warn("Channel send failed, trying next.", { channel: id, error: result.error });
  }
  return { delivered: null, attempts };
}
