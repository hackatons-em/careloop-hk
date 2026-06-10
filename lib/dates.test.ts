import { describe, expect, it } from "vitest";
import { addDays, diffDays, localMidnightUtcISO } from "./dates";

describe("dates — calendar math", () => {
  it("diffDays counts whole days", () => {
    expect(diffDays("2026-06-05", "2026-06-06")).toBe(1);
    expect(diffDays("2026-06-02", "2026-06-05")).toBe(3);
    expect(diffDays("2026-06-06", "2026-06-05")).toBe(-1);
  });

  it("addDays crosses month boundaries", () => {
    expect(addDays("2026-06-30", 1)).toBe("2026-07-01");
    expect(addDays("2026-06-01", -1)).toBe("2026-05-31");
  });
});

describe("dates — localMidnightUtcISO (silence-sweep window boundary)", () => {
  it("Hong Kong midnight is the prior UTC day at 16:00Z", () => {
    // 2026-06-10 00:00 in HK (UTC+8) === 2026-06-09T16:00:00Z.
    expect(localMidnightUtcISO("2026-06-10", "Asia/Hong_Kong")).toBe("2026-06-09T16:00:00.000Z");
  });

  it("a reply at 22:30Z the prior day falls AFTER HK-local midnight (counts as today)", () => {
    // The regression the fix targets: a reply between HK midnight and the
    // DB-zone (UTC) midnight must be inside today's window.
    const since = Date.parse(localMidnightUtcISO("2026-06-10", "Asia/Hong_Kong"));
    expect(Date.parse("2026-06-09T22:30:00Z")).toBeGreaterThanOrEqual(since);
    // ...while 15:00Z the prior day (23:00 HK on the 9th) is correctly excluded.
    expect(Date.parse("2026-06-09T15:00:00Z")).toBeLessThan(since);
  });

  it("UTC zone yields plain midnight", () => {
    expect(localMidnightUtcISO("2026-06-10", "UTC")).toBe("2026-06-10T00:00:00.000Z");
  });
});

describe("HK-local date of a UTC instant (resolved-alert dedup contract)", () => {
  // upsertAlertFor compares resolved_at (a real-wall-clock UTC instant) against
  // HK-local clinical check-in dates. The conversion must land on the HK
  // calendar day, or a resolve in the HK 00:00–08:00 window (UTC date one day
  // behind) would spuriously re-mint the same clinical day.
  const hkDate = (iso: string) =>
    new Date(iso).toLocaleDateString("en-CA", { timeZone: "Asia/Hong_Kong" });

  it("01:00 HK on 2026-06-10 (== 2026-06-09T17:00Z) is the 10th, not the 9th", () => {
    expect(hkDate("2026-06-09T17:00:00Z")).toBe("2026-06-10");
  });

  it("23:00 HK on 2026-06-10 (== 2026-06-10T15:00Z) is still the 10th", () => {
    expect(hkDate("2026-06-10T15:00:00Z")).toBe("2026-06-10");
  });
});
