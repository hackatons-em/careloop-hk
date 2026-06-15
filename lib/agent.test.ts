import { beforeEach, describe, expect, it, vi } from "vitest";
import type { Patient } from "./types";

// Mock all I/O so we test ONLY the round's orchestration (active-filter,
// idempotency skip, error isolation, batching) — no real DB or Twilio.
vi.mock("./whatsapp", () => ({ sendWhatsApp: vi.fn() }));
vi.mock("./store", () => ({ getPatients: vi.fn(), getPatient: vi.fn() }));
vi.mock("./conversation", () => ({
  getOrgPhoneMap: vi.fn(),
  getMessageCountsSince: vi.fn(),
  getPatientPhone: vi.fn(),
  beginSession: vi.fn(),
  appendMessage: vi.fn(),
}));
vi.mock("./logger", () => ({ logger: { info: vi.fn(), warn: vi.fn(), error: vi.fn() } }));

import { sendDailyCheckInRound } from "./agent";
import { getMessageCountsSince, getOrgPhoneMap } from "./conversation";
import { getPatients } from "./store";
import { sendWhatsApp } from "./whatsapp";

const ORG = "org-1";

function patient(id: string, over: Partial<Patient> = {}): Patient {
  return {
    id,
    name: `Patient ${id}`,
    age: 70,
    gender: "",
    language: "Cantonese",
    preferred_language: "en",
    living_status: "",
    conditions: [],
    caregiver_name: "",
    caregiver_phone: "",
    caregiver_email: "",
    assigned_nurse: "Nurse",
    baseline_weight: 0,
    baseline_steps: 0,
    phone: null,
    status: "active",
    consent_caregiver_alerts: false,
    consent_family_digest: false,
    consent_updated_at: null,
    ...over,
  } as Patient;
}

beforeEach(() => {
  vi.clearAllMocks();
  vi.mocked(sendWhatsApp).mockResolvedValue({ ok: true, sid: "SM_test" });
  vi.mocked(getOrgPhoneMap).mockResolvedValue(new Map());
  vi.mocked(getMessageCountsSince).mockResolvedValue(new Map());
  vi.mocked(getPatients).mockResolvedValue([]);
});

describe("sendDailyCheckInRound", () => {
  it("messages active patients with a phone and reports sent/total", async () => {
    vi.mocked(getPatients).mockResolvedValue([patient("a"), patient("b")]);
    vi.mocked(getOrgPhoneMap).mockResolvedValue(
      new Map([
        ["a", "whatsapp:+10000000001"],
        ["b", "whatsapp:+10000000002"],
      ]),
    );

    const r = await sendDailyCheckInRound(ORG);

    expect(r).toMatchObject({ sent: 2, total: 2, skipped: 0 });
    expect(vi.mocked(sendWhatsApp)).toHaveBeenCalledTimes(2);
  });

  it("skips patients already contacted today (idempotency) without re-sending", async () => {
    vi.mocked(getPatients).mockResolvedValue([patient("a"), patient("b")]);
    vi.mocked(getOrgPhoneMap).mockResolvedValue(
      new Map([
        ["a", "whatsapp:+10000000001"],
        ["b", "whatsapp:+10000000002"],
      ]),
    );
    // 'a' already got an outbound today, no inbound -> already_prompted.
    // 'b' has a two-way conversation today -> already_conversing.
    vi.mocked(getMessageCountsSince).mockResolvedValue(
      new Map([
        ["a", { inbound: 0, outbound: 1 }],
        ["b", { inbound: 2, outbound: 3 }],
      ]),
    );

    const r = await sendDailyCheckInRound(ORG);

    expect(r).toMatchObject({ sent: 0, total: 0, skipped: 2 });
    expect(vi.mocked(sendWhatsApp)).not.toHaveBeenCalled();
    const reasons = r.results.filter((x) => x.skipped).map((x) => `${x.patientId}:${x.reason}`);
    expect(reasons).toContain("a:already_prompted");
    expect(reasons).toContain("b:already_conversing");
  });

  it("excludes non-active patients (pending_review / archived)", async () => {
    vi.mocked(getPatients).mockResolvedValue([
      patient("a", { status: "active" }),
      patient("p", { status: "pending_review" }),
      patient("z", { status: "archived" }),
    ]);
    vi.mocked(getOrgPhoneMap).mockResolvedValue(
      new Map([
        ["a", "whatsapp:+10000000001"],
        ["p", "whatsapp:+10000000009"],
        ["z", "whatsapp:+10000000008"],
      ]),
    );

    const r = await sendDailyCheckInRound(ORG);

    expect(r).toMatchObject({ sent: 1, total: 1, skipped: 0 });
    expect(vi.mocked(sendWhatsApp)).toHaveBeenCalledTimes(1);
  });

  it("skips active patients with no known phone", async () => {
    vi.mocked(getPatients).mockResolvedValue([patient("a"), patient("b")]);
    // only 'a' has a link; 'b' has neither a link nor a phone column.
    vi.mocked(getOrgPhoneMap).mockResolvedValue(new Map([["a", "whatsapp:+10000000001"]]));

    const r = await sendDailyCheckInRound(ORG);

    expect(r).toMatchObject({ sent: 1, total: 1 });
    expect(vi.mocked(sendWhatsApp)).toHaveBeenCalledTimes(1);
  });

  it("falls back to the patient.phone column when no link row exists", async () => {
    vi.mocked(getPatients).mockResolvedValue([patient("a", { phone: "+10000000001" })]);
    vi.mocked(getOrgPhoneMap).mockResolvedValue(new Map());

    const r = await sendDailyCheckInRound(ORG);

    expect(r).toMatchObject({ sent: 1, total: 1 });
    expect(vi.mocked(sendWhatsApp)).toHaveBeenCalledWith("whatsapp:+10000000001", expect.any(String));
  });

  it("processes every target across multiple batches (more than ROUND_BATCH)", async () => {
    const n = 20; // > ROUND_BATCH (8) -> spans 3 batches
    const ids = Array.from({ length: n }, (_, i) => `p${i}`);
    vi.mocked(getPatients).mockResolvedValue(ids.map((id) => patient(id)));
    vi.mocked(getOrgPhoneMap).mockResolvedValue(
      new Map(ids.map((id, i) => [id, `whatsapp:+1000000${String(i).padStart(4, "0")}`])),
    );

    const r = await sendDailyCheckInRound(ORG);

    expect(r).toMatchObject({ sent: n, total: n, skipped: 0 });
    expect(vi.mocked(sendWhatsApp)).toHaveBeenCalledTimes(n);
  });

  it("isolates a per-patient failure — one throw does not abort the round", async () => {
    vi.mocked(getPatients).mockResolvedValue([patient("a"), patient("b"), patient("c")]);
    vi.mocked(getOrgPhoneMap).mockResolvedValue(
      new Map([
        ["a", "whatsapp:+10000000001"],
        ["b", "whatsapp:+10000000002"],
        ["c", "whatsapp:+10000000003"],
      ]),
    );
    // 'b' throws (e.g. a transient Twilio/DB error); 'a' and 'c' still go out.
    vi.mocked(sendWhatsApp).mockImplementation(async (to: string) => {
      if (to === "whatsapp:+10000000002") throw new Error("boom");
      return { ok: true, sid: "SM_test" };
    });

    const r = await sendDailyCheckInRound(ORG);

    expect(r.total).toBe(3);
    expect(r.sent).toBe(2);
    const bad = r.results.find((x) => x.patientId === "b");
    expect(bad).toMatchObject({ ok: false });
    expect(vi.mocked(sendWhatsApp)).toHaveBeenCalledTimes(3);
  });
});
