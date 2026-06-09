import { describe, expect, it } from "vitest";
import { clientIp, rateLimitAllow } from "./rateLimit";

// Without UPSTASH_* env (the unit-test environment), the in-memory fallback is
// exercised. Keys are unique per test so windows don't interfere.

describe("rateLimitAllow (in-memory fallback)", () => {
  it("allows up to the webhook limit then blocks", async () => {
    const key = `test-webhook-${Math.random()}`;
    for (let i = 0; i < 30; i++) {
      expect(await rateLimitAllow("webhook", key)).toBe(true);
    }
    expect(await rateLimitAllow("webhook", key)).toBe(false);
  });

  it("tracks keys independently", async () => {
    const a = `test-a-${Math.random()}`;
    const b = `test-b-${Math.random()}`;
    for (let i = 0; i < 10; i++) await rateLimitAllow("auth", a);
    expect(await rateLimitAllow("auth", a)).toBe(false);
    expect(await rateLimitAllow("auth", b)).toBe(true);
  });
});

describe("clientIp", () => {
  it("prefers the first x-forwarded-for hop", () => {
    const req = new Request("https://x.example", {
      headers: { "x-forwarded-for": "203.0.113.7, 10.0.0.1" },
    });
    expect(clientIp(req)).toBe("203.0.113.7");
  });

  it("falls back to unknown", () => {
    expect(clientIp(new Request("https://x.example"))).toBe("unknown");
  });
});
