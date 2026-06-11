// Follow-up wording for the check-in agent (server-only).
//
// When the deterministic policy decides a follow-up question is needed, Claude
// phrases ONE warm, natural question in the patient's language. If no API key /
// the call fails, a fixed template question is used — so the agent never stalls.
// The DECISION of what to ask is made deterministically in lib/conversation.

import Anthropic from "@anthropic-ai/sdk";
import { FIELD_QUESTION, type FieldKey, type Lang } from "./conversation";

export async function generateFollowUp(
  field: FieldKey,
  lang: Lang,
  patientName: string,
  patientSaid?: string,
): Promise<string> {
  const fallback = FIELD_QUESTION[field][lang];
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) return fallback;

  try {
    const client = new Anthropic({ apiKey });
    const model = process.env.CARELOOP_EXTRACT_MODEL ?? "claude-sonnet-4-6";
    const langName =
      lang === "zh"
        ? "natural spoken Hong Kong Cantonese (Traditional Chinese characters)"
        : "plain English";
    const msg = await client.messages.create({
      model,
      max_tokens: 180,
      system: [
        {
          type: "text",
          text: `You are Miruwa, a daily check-in assistant messaging an elderly Hong Kong patient on WhatsApp. Calm, warm, but PROFESSIONAL and concise — this is a healthcare check-in, not a casual chat.
FIRST, briefly and sincerely acknowledge how the patient feels — especially if they sound distressed or very unwell (one short line). Never be cheerful or dismissive in the face of distress.
THEN ask ONE short question to learn the one missing piece of info.
Rules: 1-2 short sentences total. NO emojis. No effusive or over-cheerful language, no false reassurance, no diagnosis, no medical advice, no medication instructions. Write in ${langName}. Output only the message.`,
        },
      ],
      messages: [
        {
          role: "user",
          content: `Patient: ${patientName}.${patientSaid ? ` They just messaged: "${patientSaid}".` : ""} The one thing we still need to know: "${FIELD_QUESTION[field].en}". Write the reply — acknowledge what they said, then ask.`,
        },
      ],
    });
    const text = msg.content
      .filter((b): b is Anthropic.TextBlock => b.type === "text")
      .map((b) => b.text)
      .join("")
      .trim();
    return text || fallback;
  } catch {
    return fallback;
  }
}

/**
 * Closing confirmation, in the patient's language. The family line is only
 * promised when caregiver delivery will actually happen (recorded consent +
 * a caregiver contact on file) — the product must never promise a message
 * nobody sends.
 */
export function confirmationReply(
  status: "escalated" | "complete",
  lang: Lang,
  familyNotified = false,
): string {
  if (status === "escalated") {
    if (familyNotified) {
      return lang === "zh"
        ? "多謝你嘅報到。我哋會安排護士今日跟進，亦會通知你嘅家人。"
        : "Thank you for checking in. We will have a nurse follow up with you today and inform your family.";
    }
    return lang === "zh"
      ? "多謝你嘅報到。我哋會安排護士今日跟進。不妨同屋企人講聲你今日嘅情況。"
      : "Thank you for checking in. We will have a nurse follow up with you today. Please do let your family know how you are feeling.";
  }
  return lang === "zh"
    ? "多謝你嘅報到。今日嘅報到已完成，各項指標都在正常範圍。"
    : "Thank you. Your check-in is complete and your readings are within the expected range today.";
}

/** Closing message written by Claude in the patient's language. Falls back to
 * the template above only if the API key is missing or the call fails, so the
 * agent never stalls — but in normal operation Claude writes every message. */
export async function generateConfirmation(
  status: "escalated" | "complete",
  lang: Lang,
  patientName: string,
  concerns: string[],
  familyNotified = false,
): Promise<string> {
  const fallback = confirmationReply(status, lang, familyNotified);
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) return fallback;

  try {
    const client = new Anthropic({ apiKey });
    const model = process.env.CARELOOP_EXTRACT_MODEL ?? "claude-sonnet-4-6";
    const langName =
      lang === "zh"
        ? "natural spoken Hong Kong Cantonese (Traditional Chinese characters)"
        : "plain English";
    const familyLine = familyNotified
      ? "their family will be told"
      : "gently suggest they let their family know how they are feeling (do NOT promise that we will contact the family)";
    const situation =
      status === "escalated"
        ? `Their check-in is done and has been flagged for nurse review${concerns.length ? ` (noted: ${concerns.join(", ")})` : ""}. Reassure them warmly that a nurse will follow up today and ${familyLine}.`
        : `Their check-in is complete and nothing concerning came up. Thank them warmly and encourage them to keep checking in daily.`;
    const msg = await client.messages.create({
      model,
      max_tokens: 160,
      system: [
        {
          type: "text",
          text: `You are Miruwa, a daily check-in assistant on WhatsApp for an elderly Hong Kong patient. Write ONE short closing message (1-2 sentences): calm, warm, and PROFESSIONAL — a healthcare check-in, not a casual chat. NO emojis. No effusive or over-cheerful language, no false reassurance, no diagnosis, no medical advice, no medication instructions. Write in ${langName}. Output only the message.`,
        },
      ],
      messages: [{ role: "user", content: `Patient: ${patientName}. ${situation}` }],
    });
    const text = msg.content
      .filter((b): b is Anthropic.TextBlock => b.type === "text")
      .map((b) => b.text)
      .join("")
      .trim();
    return text || fallback;
  } catch {
    return fallback;
  }
}
