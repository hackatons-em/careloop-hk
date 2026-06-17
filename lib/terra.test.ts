import { afterEach, describe, expect, it, vi } from "vitest";
import { requireTerraSignature, __test } from "./terra";

const SECRET = "whsec_test_123";
const BODY = JSON.stringify({ type: "daily", user: { user_id: "u1" } });

// Use a fresh timestamp so the webhook replay window (1h) is satisfied.
function header(body = BODY, secret = SECRET): string {
  const t = String(Math.floor(Date.now() / 1000));
  return `t=${t},v1=${__test.computeSignature(secret, t, body)}`;
}
function reqWith(sig: string | null): Request {
  const h: Record<string, string> = {};
  if (sig !== null) h["terra-signature"] = sig;
  return new Request("https://miruwa.com/api/wearable/terra", { method: "POST", headers: h });
}

describe("requireTerraSignature", () => {
  afterEach(() => vi.unstubAllEnvs());

  it("passes a valid, fresh signature", () => {
    vi.stubEnv("TERRA_SIGNING_SECRET", SECRET);
    expect(requireTerraSignature(reqWith(header()), BODY)).toBeNull();
  });

  it("rejects a tampered body", () => {
    vi.stubEnv("TERRA_SIGNING_SECRET", SECRET);
    expect(requireTerraSignature(reqWith(header()), `${BODY}x`)?.status).toBe(403);
  });

  it("rejects a wrong signing secret", () => {
    vi.stubEnv("TERRA_SIGNING_SECRET", SECRET);
    expect(requireTerraSignature(reqWith(header(BODY, "other")), BODY)?.status).toBe(403);
  });

  it("rejects a missing header", () => {
    vi.stubEnv("TERRA_SIGNING_SECRET", SECRET);
    expect(requireTerraSignature(reqWith(null), BODY)?.status).toBe(403);
  });

  it("rejects a stale (replayed) timestamp", () => {
    vi.stubEnv("TERRA_SIGNING_SECRET", SECRET);
    const t = "1700000000"; // 2023 — far outside the 1h window
    const sig = `t=${t},v1=${__test.computeSignature(SECRET, t, BODY)}`;
    expect(requireTerraSignature(reqWith(sig), BODY)?.status).toBe(403);
  });

  it("skips (allows) when the secret is unset outside production", () => {
    vi.stubEnv("TERRA_SIGNING_SECRET", "");
    expect(requireTerraSignature(reqWith(header()), BODY)).toBeNull();
  });

  it("parses the signature header and rejects garbage", () => {
    expect(__test.parseSignatureHeader("t=123,v1=abc")).toEqual({ t: "123", v1: "abc" });
    expect(__test.parseSignatureHeader("garbage")).toBeNull();
  });
});
