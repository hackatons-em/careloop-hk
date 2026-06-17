import { describe, expect, it } from "vitest";
import { normalizeTerraPayload } from "./wearableIngest";

describe("normalizeTerraPayload", () => {
  it("maps a daily payload → resting-HR + steps rollup and intraday samples", () => {
    const data = [
      {
        metadata: { start_time: "2026-06-17T00:00:00.000Z", end_time: "2026-06-17T23:59:59.000Z" },
        heart_rate_data: {
          summary: { resting_hr_bpm: 58, avg_hr_bpm: 72 },
          detailed: {
            hr_samples: [
              { timestamp: "2026-06-17T08:00:00Z", bpm: 70 },
              { timestamp: "2026-06-17T09:00:00Z", bpm: 75 },
            ],
          },
        },
        distance_data: {
          steps: 4200,
          detailed: { step_samples: [{ timestamp: "2026-06-17T08:00:00Z", steps: 1000 }] },
        },
        oxygen_data: {
          avg_saturation_percentage: 97,
          saturation_samples: [{ timestamp: "2026-06-17T08:00:00Z", percentage: 97 }],
        },
      },
    ];
    const { samples, rollup } = normalizeTerraPayload("daily", data);
    expect(rollup).toContainEqual({ date: "2026-06-17", type: "heart_rate", value: 58, unit: "bpm" });
    expect(rollup).toContainEqual({ date: "2026-06-17", type: "steps", value: 4200, unit: "steps" });
    expect(samples.filter((s) => s.type === "heart_rate")).toHaveLength(2);
    expect(samples.filter((s) => s.type === "spo2")).toHaveLength(1);
    expect(samples.filter((s) => s.type === "steps")).toHaveLength(1);
  });

  it("maps a body payload → weight + worst-of-day BP rollup", () => {
    const data = [
      {
        metadata: { start_time: "2026-06-17T00:00:00Z" },
        measurements_data: {
          measurements: [{ measurement_time: "2026-06-17T07:30:00Z", weight_kg: 61.5 }],
        },
        blood_pressure_data: {
          blood_pressure_samples: [
            { timestamp: "2026-06-17T07:30:00Z", systolic_bp: 145, diastolic_bp: 88 },
            { timestamp: "2026-06-17T19:30:00Z", systolic_bp: 152, diastolic_bp: 95 },
          ],
        },
      },
    ];
    const { rollup, samples } = normalizeTerraPayload("body", data);
    expect(rollup).toContainEqual({ date: "2026-06-17", type: "weight", value: 61.5, unit: "kg" });
    expect(rollup).toContainEqual({
      date: "2026-06-17",
      type: "blood_pressure_systolic",
      value: 152,
      unit: "mmHg",
    });
    expect(rollup).toContainEqual({
      date: "2026-06-17",
      type: "blood_pressure_diastolic",
      value: 95,
      unit: "mmHg",
    });
    expect(samples.filter((s) => s.type === "blood_pressure_systolic")).toHaveLength(2);
  });

  it("rolls up the real max-systolic BP pair, never a fabricated one", () => {
    const data = [
      {
        metadata: { start_time: "2026-06-17T00:00:00Z" },
        blood_pressure_data: {
          blood_pressure_samples: [
            { timestamp: "2026-06-17T08:00:00Z", systolic_bp: 185, diastolic_bp: 80 },
            { timestamp: "2026-06-17T21:00:00Z", systolic_bp: 120, diastolic_bp: 112 },
          ],
        },
      },
    ];
    const { rollup } = normalizeTerraPayload("body", data);
    // Highest systolic is the 185/80 reading — its OWN diastolic (80), NOT the
    // unrelated 112 from the other sample (which independent-max would fabricate).
    expect(rollup).toContainEqual({
      date: "2026-06-17",
      type: "blood_pressure_systolic",
      value: 185,
      unit: "mmHg",
    });
    expect(rollup).toContainEqual({
      date: "2026-06-17",
      type: "blood_pressure_diastolic",
      value: 80,
      unit: "mmHg",
    });
    expect(rollup.find((r) => r.type === "blood_pressure_diastolic")?.value).not.toBe(112);
  });

  it("never pairs a stale diastolic when the max-systolic sample has none", () => {
    const data = [
      {
        metadata: { start_time: "2026-06-17T00:00:00Z" },
        blood_pressure_data: {
          blood_pressure_samples: [
            { timestamp: "2026-06-17T08:00:00Z", systolic_bp: 150, diastolic_bp: 90 },
            { timestamp: "2026-06-17T20:00:00Z", systolic_bp: 165, diastolic_bp: null },
          ],
        },
      },
    ];
    const { rollup } = normalizeTerraPayload("body", data);
    expect(rollup).toContainEqual({
      date: "2026-06-17",
      type: "blood_pressure_systolic",
      value: 165,
      unit: "mmHg",
    });
    // The 165 reading had no diastolic → must NOT carry over the 90 from the
    // unrelated 150 reading (that would be a fabricated pair).
    expect(rollup.find((r) => r.type === "blood_pressure_diastolic")).toBeUndefined();
  });

  it("attributes sleep to the wake day (end_time)", () => {
    const data = [
      {
        metadata: { start_time: "2026-06-16T23:00:00Z", end_time: "2026-06-17T07:00:00Z" },
        sleep_durations_data: { asleep: { duration_asleep_state_seconds: 7 * 3600 } },
      },
    ];
    const { rollup } = normalizeTerraPayload("sleep", data);
    expect(rollup).toContainEqual({ date: "2026-06-17", type: "sleep_hours", value: 7, unit: "h" });
  });

  it("drops out-of-range values", () => {
    const data = [
      {
        metadata: { start_time: "2026-06-17T00:00:00Z" },
        heart_rate_data: {
          summary: { resting_hr_bpm: 9999 },
          detailed: { hr_samples: [{ timestamp: "2026-06-17T08:00:00Z", bpm: 9999 }] },
        },
      },
    ];
    const { samples, rollup } = normalizeTerraPayload("daily", data);
    expect(rollup.find((r) => r.type === "heart_rate")).toBeUndefined();
    expect(samples.filter((s) => s.type === "heart_rate")).toHaveLength(0);
  });

  it("returns empty for empty / shapeless data without throwing", () => {
    expect(normalizeTerraPayload("daily", [])).toEqual({ samples: [], rollup: [] });
    expect(normalizeTerraPayload("body", [{}])).toEqual({ samples: [], rollup: [] });
  });
});
