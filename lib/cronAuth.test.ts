import { afterEach, describe, expect, it, vi } from "vitest";
import { requireCronAuthIfConfigured } from "./cronAuth";

function req(auth?: string): Request {
  return new Request("https://example.org/api/agent/send-round", {
    headers: auth ? { authorization: auth } : {},
  });
}

afterEach(() => {
  vi.unstubAllEnvs();
});

describe("requireCronAuthIfConfigured", () => {
  it("allows the correct bearer token", () => {
    vi.stubEnv("CRON_SECRET", "s3cret");
    expect(requireCronAuthIfConfigured(req("Bearer s3cret"))).toBeNull();
  });

  it("rejects a wrong or missing token with 401", () => {
    vi.stubEnv("CRON_SECRET", "s3cret");
    expect(requireCronAuthIfConfigured(req("Bearer nope"))?.status).toBe(401);
    expect(requireCronAuthIfConfigured(req())?.status).toBe(401);
  });

  it("rejects tokens of different length (timing-safe digest compare)", () => {
    vi.stubEnv("CRON_SECRET", "s3cret");
    expect(requireCronAuthIfConfigured(req("Bearer s3cret-longer"))?.status).toBe(401);
  });

  it("stays open in non-production when unset", () => {
    vi.stubEnv("CRON_SECRET", "");
    vi.stubEnv("NODE_ENV", "development");
    expect(requireCronAuthIfConfigured(req())).toBeNull();
  });

  it("fails closed in production when unset", () => {
    vi.stubEnv("CRON_SECRET", "");
    vi.stubEnv("NODE_ENV", "production");
    expect(requireCronAuthIfConfigured(req())?.status).toBe(503);
  });
});
