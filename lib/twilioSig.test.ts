import { afterEach, describe, expect, it, vi } from "vitest";
import { __test, requireTwilioSignature } from "./twilioSig";

// Twilio's documented worked example:
// https://www.twilio.com/docs/usage/security#validating-requests
const TOKEN = "12345";
const URL_ = "https://mycompany.com/myapp.php?foo=1&bar=2";
const PARAMS: Record<string, string> = {
  CallSid: "CA1234567890ABCDE",
  Caller: "+12349013030",
  Digits: "1234",
  From: "+12349013030",
  To: "+18005551212",
};
const EXPECTED = "0/KCTR6DLpKmkAf8muzZqo1nDgQ=";

afterEach(() => {
  vi.unstubAllEnvs();
});

describe("computeSignature", () => {
  it("matches Twilio's documented example signature", () => {
    expect(__test.computeSignature(TOKEN, URL_, PARAMS)).toBe(EXPECTED);
  });
});

describe("requireTwilioSignature", () => {
  function makeForm(): FormData {
    const form = new FormData();
    for (const [k, v] of Object.entries(PARAMS)) form.append(k, v);
    return form;
  }

  it("accepts a correctly signed request", () => {
    vi.stubEnv("TWILIO_AUTH_TOKEN", TOKEN);
    vi.stubEnv("TWILIO_WEBHOOK_URL", URL_);
    const req = new Request("https://internal-proxy.example/api/whatsapp/inbound", {
      method: "POST",
      headers: { "x-twilio-signature": EXPECTED },
    });
    expect(requireTwilioSignature(req, makeForm())).toBeNull();
  });

  it("rejects a tampered signature with 403", () => {
    vi.stubEnv("TWILIO_AUTH_TOKEN", TOKEN);
    vi.stubEnv("TWILIO_WEBHOOK_URL", URL_);
    const req = new Request("https://internal-proxy.example/api/whatsapp/inbound", {
      method: "POST",
      headers: { "x-twilio-signature": "forged-signature-value=" },
    });
    expect(requireTwilioSignature(req, makeForm())?.status).toBe(403);
  });

  it("rejects a missing signature with 403", () => {
    vi.stubEnv("TWILIO_AUTH_TOKEN", TOKEN);
    vi.stubEnv("TWILIO_WEBHOOK_URL", URL_);
    const req = new Request("https://internal-proxy.example/api/whatsapp/inbound", {
      method: "POST",
    });
    expect(requireTwilioSignature(req, makeForm())?.status).toBe(403);
  });

  it("rejects tampered params with 403", () => {
    vi.stubEnv("TWILIO_AUTH_TOKEN", TOKEN);
    vi.stubEnv("TWILIO_WEBHOOK_URL", URL_);
    const form = makeForm();
    form.set("Digits", "9999");
    const req = new Request("https://internal-proxy.example/api/whatsapp/inbound", {
      method: "POST",
      headers: { "x-twilio-signature": EXPECTED },
    });
    expect(requireTwilioSignature(req, form)?.status).toBe(403);
  });

  it("fails closed in production when the webhook URL is not pinned", () => {
    vi.stubEnv("TWILIO_AUTH_TOKEN", TOKEN);
    vi.stubEnv("TWILIO_WEBHOOK_URL", "");
    vi.stubEnv("NODE_ENV", "production");
    const req = new Request("https://x.example/api/whatsapp/inbound", { method: "POST" });
    expect(requireTwilioSignature(req, makeForm())?.status).toBe(403);
  });

  it("skips validation outside production when Twilio is unconfigured", () => {
    vi.stubEnv("TWILIO_AUTH_TOKEN", "");
    vi.stubEnv("TWILIO_WEBHOOK_URL", "");
    vi.stubEnv("NODE_ENV", "development");
    const req = new Request("https://x.example/api/whatsapp/inbound", { method: "POST" });
    expect(requireTwilioSignature(req, makeForm())).toBeNull();
  });
});
