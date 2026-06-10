// WeChat adapter — Official Account customer-service message.
//
// Built against the WeChat OA API shape so the integration is a credentials
// drop-in: set WECHAT_APP_ID + WECHAT_APP_SECRET once the Official Account
// application is approved, and map recipients to OpenIDs (the `to` here is a
// WeChat OpenID, captured when a family member follows the account).
// Until then configured() is false and the channel is skipped.

import "server-only";
import { logger } from "../logger";
import type { SendResult } from "../whatsapp";
import type { OutboundChannel } from "./index";

let cachedToken: { token: string; expiresAt: number } | null = null;

async function accessToken(appId: string, secret: string): Promise<string | null> {
  if (cachedToken && Date.now() < cachedToken.expiresAt - 60_000) return cachedToken.token;
  try {
    const res = await fetch(
      `https://api.weixin.qq.com/cgi-bin/token?grant_type=client_credential&appid=${appId}&secret=${secret}`,
      { signal: AbortSignal.timeout(10_000) },
    );
    const data = (await res.json()) as { access_token?: string; expires_in?: number; errmsg?: string };
    if (!data.access_token) {
      logger.error("WeChat token fetch failed.", { errmsg: data.errmsg });
      return null;
    }
    cachedToken = {
      token: data.access_token,
      expiresAt: Date.now() + (data.expires_in ?? 7200) * 1000,
    };
    return cachedToken.token;
  } catch (err) {
    logger.error("WeChat token fetch errored.", { err });
    return null;
  }
}

export const sendWeChat: OutboundChannel = {
  id: "wechat",
  configured() {
    return Boolean(process.env.WECHAT_APP_ID && process.env.WECHAT_APP_SECRET);
  },
  async send(to: string, body: string): Promise<SendResult> {
    const appId = process.env.WECHAT_APP_ID;
    const secret = process.env.WECHAT_APP_SECRET;
    if (!appId || !secret) return { ok: false, error: "WeChat not configured" };
    const token = await accessToken(appId, secret);
    if (!token) return { ok: false, error: "WeChat token unavailable" };
    try {
      const res = await fetch(
        `https://api.weixin.qq.com/cgi-bin/message/custom/send?access_token=${token}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ touser: to, msgtype: "text", text: { content: body } }),
          signal: AbortSignal.timeout(10_000),
        },
      );
      const data = (await res.json()) as { errcode?: number; errmsg?: string };
      if (data.errcode && data.errcode !== 0) {
        return { ok: false, error: `WeChat ${data.errcode}: ${data.errmsg}` };
      }
      return { ok: true };
    } catch (err) {
      return { ok: false, error: err instanceof Error ? err.message : "send failed" };
    }
  },
};
