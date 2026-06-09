import { describe, expect, it } from "vitest";
import {
  alertPatchSchema,
  checkInInputSchema,
  csvImportSchema,
  inviteUserSchema,
  leadPatchSchema,
  leadSchema,
  patientCreateSchema,
  patientUpdateSchema,
  vitalInputSchema,
} from "./validation";

describe("vitalInputSchema", () => {
  it("accepts a plausible weight", () => {
    expect(vitalInputSchema.safeParse({ type: "weight", value: 64.5 }).success).toBe(true);
  });

  it("rejects out-of-range values per type", () => {
    expect(vitalInputSchema.safeParse({ type: "weight", value: 5 }).success).toBe(false);
    expect(vitalInputSchema.safeParse({ type: "weight", value: 400 }).success).toBe(false);
    expect(vitalInputSchema.safeParse({ type: "heart_rate", value: 300 }).success).toBe(false);
    expect(vitalInputSchema.safeParse({ type: "sleep_hours", value: 25 }).success).toBe(false);
    expect(vitalInputSchema.safeParse({ type: "steps", value: -1 }).success).toBe(false);
  });

  it("rejects unknown vital types and non-numeric values", () => {
    expect(vitalInputSchema.safeParse({ type: "blood_sugar", value: 5 }).success).toBe(false);
    expect(vitalInputSchema.safeParse({ type: "weight", value: "64" }).success).toBe(false);
    expect(vitalInputSchema.safeParse({ type: "weight", value: NaN }).success).toBe(false);
  });
});

describe("checkInInputSchema", () => {
  it("accepts a full check-in", () => {
    const r = checkInInputSchema.safeParse({
      date: "2026-06-08",
      mood: "tired",
      shortness_of_breath: true,
      swelling: false,
      medication_taken: false,
      weight: 64.3,
      free_text_note: "felt breathless on the stairs",
      source: "web_form",
    });
    expect(r.success).toBe(true);
  });

  it("rejects malformed dates and unknown keys", () => {
    expect(checkInInputSchema.safeParse({ date: "tomorrow" }).success).toBe(false);
    expect(checkInInputSchema.safeParse({ date: "2026-13-40" }).success).toBe(false);
    expect(checkInInputSchema.safeParse({ evil: true }).success).toBe(false);
  });

  it("rejects non-boolean symptom values", () => {
    expect(checkInInputSchema.safeParse({ shortness_of_breath: "yes" }).success).toBe(false);
  });
});

describe("patientCreateSchema", () => {
  const valid = {
    name: "Mrs. Chan",
    age: 78,
    gender: "female",
    language: "Cantonese",
    living_status: "lives alone",
    conditions: ["heart failure"],
    caregiver_name: "Ms. Chan",
    caregiver_phone: "+85298765432",
    assigned_nurse: "Nurse Wong",
    baseline_weight: 62,
    baseline_steps: 3500,
    phone: "+85291234567",
  };

  it("accepts a valid patient", () => {
    expect(patientCreateSchema.safeParse(valid).success).toBe(true);
  });

  it("requires at least one condition", () => {
    expect(patientCreateSchema.safeParse({ ...valid, conditions: [] }).success).toBe(false);
  });

  it("enforces E.164 phone format", () => {
    expect(patientCreateSchema.safeParse({ ...valid, phone: "91234567" }).success).toBe(false);
    expect(patientCreateSchema.safeParse({ ...valid, phone: null }).success).toBe(true);
  });

  it("bounds age", () => {
    expect(patientCreateSchema.safeParse({ ...valid, age: 0 }).success).toBe(false);
    expect(patientCreateSchema.safeParse({ ...valid, age: 121 }).success).toBe(false);
  });
});

describe("patientUpdateSchema", () => {
  it("accepts a partial update including status transitions", () => {
    expect(patientUpdateSchema.safeParse({ status: "active" }).success).toBe(true);
    expect(patientUpdateSchema.safeParse({ name: "New Name" }).success).toBe(true);
  });

  it("rejects an empty patch and unknown statuses", () => {
    expect(patientUpdateSchema.safeParse({}).success).toBe(false);
    expect(patientUpdateSchema.safeParse({ status: "deleted" }).success).toBe(false);
  });
});

describe("alertPatchSchema", () => {
  it("requires at least a status or a note", () => {
    expect(alertPatchSchema.safeParse({}).success).toBe(false);
    expect(alertPatchSchema.safeParse({ status: "acknowledged" }).success).toBe(true);
    expect(alertPatchSchema.safeParse({ nurse_note: "called daughter" }).success).toBe(true);
  });

  it("rejects client-supplied actor (server derives it from the session)", () => {
    expect(
      alertPatchSchema.safeParse({ status: "acknowledged", actor: "spoofed" }).success,
    ).toBe(false);
  });
});

describe("csvImportSchema", () => {
  it("requires csv text or rows", () => {
    expect(csvImportSchema.safeParse({ patient_id: "p1" }).success).toBe(false);
    expect(csvImportSchema.safeParse({ patient_id: "p1", csv: "date,weight_kg" }).success).toBe(
      true,
    );
  });

  it("validates row ranges", () => {
    const bad = { patient_id: "p1", rows: [{ date: "2026-06-01", weight_kg: 1000 }] };
    expect(csvImportSchema.safeParse(bad).success).toBe(false);
  });
});

describe("leadSchema", () => {
  const valid = {
    name: "Dr. Lee",
    organization: "Queen Mary Hospital",
    role: "Ward manager",
    email: "lee@hospital.hk",
    phone: "+85291234567",
    message: "We run a 40-bed geriatric ward.",
    interest: "pilot",
    locale: "en",
    website: "",
  };

  it("accepts a valid lead", () => {
    expect(leadSchema.safeParse(valid).success).toBe(true);
  });

  it("requires name, organization, and a valid email", () => {
    expect(leadSchema.safeParse({ ...valid, name: " " }).success).toBe(false);
    expect(leadSchema.safeParse({ ...valid, organization: "" }).success).toBe(false);
    expect(leadSchema.safeParse({ ...valid, email: "not-an-email" }).success).toBe(false);
  });

  it("rejects unknown interests and unknown keys", () => {
    expect(leadSchema.safeParse({ ...valid, interest: "buyout" }).success).toBe(false);
    expect(leadSchema.safeParse({ ...valid, admin: true }).success).toBe(false);
  });

  it("passes the honeypot field through for the route to inspect", () => {
    const r = leadSchema.safeParse({ ...valid, website: "spam.example" });
    expect(r.success).toBe(true);
    if (r.success) expect(r.data.website).toBe("spam.example");
  });
});

describe("leadPatchSchema", () => {
  it("accepts only known statuses", () => {
    expect(leadPatchSchema.safeParse({ status: "contacted" }).success).toBe(true);
    expect(leadPatchSchema.safeParse({ status: "spam" }).success).toBe(false);
    expect(leadPatchSchema.safeParse({}).success).toBe(false);
  });
});

describe("inviteUserSchema", () => {
  it("accepts a nurse invite", () => {
    expect(
      inviteUserSchema.safeParse({ email: "a@b.co", name: "Nurse A", role: "nurse" }).success,
    ).toBe(true);
  });

  it("rejects bad emails and roles", () => {
    expect(inviteUserSchema.safeParse({ email: "x", name: "A", role: "nurse" }).success).toBe(
      false,
    );
    expect(
      inviteUserSchema.safeParse({ email: "a@b.co", name: "A", role: "superadmin" }).success,
    ).toBe(false);
  });
});
