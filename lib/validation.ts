// Zod schemas for every mutating API route. Shared between server route
// handlers and client forms so both sides enforce identical rules.

import { z } from "zod";

// --- shared primitives ------------------------------------------------------

const isoDate = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, "Expected an ISO date (YYYY-MM-DD)")
  .refine((s) => !Number.isNaN(Date.parse(`${s}T00:00:00Z`)), "Invalid calendar date");

/** E.164 phone (+85291234567). The UI hint explains the format. */
export const e164 = z
  .string()
  .regex(/^\+[1-9]\d{6,14}$/, "Phone must be in international format, e.g. +85291234567");

const noteText = z.string().max(2000, "Keep notes under 2000 characters");

// Clinically plausible bounds per vital type — reject obviously corrupt input
// before it reaches the risk engine.
export const VITAL_RANGES: Record<string, { min: number; max: number; unit: string }> = {
  weight: { min: 20, max: 300, unit: "kg" },
  blood_pressure_systolic: { min: 40, max: 300, unit: "mmHg" },
  blood_pressure_diastolic: { min: 20, max: 200, unit: "mmHg" },
  heart_rate: { min: 20, max: 250, unit: "bpm" },
  steps: { min: 0, max: 100_000, unit: "steps" },
  sleep_hours: { min: 0, max: 24, unit: "h" },
};

const vitalType = z.enum([
  "weight",
  "blood_pressure_systolic",
  "blood_pressure_diastolic",
  "heart_rate",
  "steps",
  "sleep_hours",
]);

// --- check-ins ----------------------------------------------------------------

export const checkInInputSchema = z
  .object({
    date: isoDate.optional(),
    mood: z.string().max(200).optional(),
    shortness_of_breath: z.boolean().optional(),
    swelling: z.boolean().optional(),
    dizziness: z.boolean().optional(),
    chest_discomfort: z.boolean().optional(),
    medication_taken: z.boolean().optional(),
    weight: z.number().min(VITAL_RANGES.weight.min).max(VITAL_RANGES.weight.max).optional(),
    free_text_note: noteText.nullable().optional(),
    source: z.enum(["simulated_call", "web_form", "imported"]).optional(),
  })
  .strict();

// --- vitals -------------------------------------------------------------------

export const vitalInputSchema = z
  .object({
    type: vitalType,
    value: z.number().finite(),
    unit: z.string().max(20).optional(),
    date: isoDate.optional(),
  })
  .strict()
  .superRefine((v, ctx) => {
    const range = VITAL_RANGES[v.type];
    if (range && (v.value < range.min || v.value > range.max)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["value"],
        message: `${v.type} must be between ${range.min} and ${range.max} ${range.unit}`,
      });
    }
  });

// --- alerts -------------------------------------------------------------------

export const alertPatchSchema = z
  .object({
    status: z
      .enum(["new", "acknowledged", "family_contacted", "clinician_review_requested", "resolved"])
      .optional(),
    nurse_note: noteText.nullable().optional(),
    assigned_to: z.string().trim().min(1).max(120).optional(),
  })
  .strict()
  .refine((p) => p.status !== undefined || p.nurse_note !== undefined || p.assigned_to !== undefined, {
    message: "Provide a status, a nurse note, or an assignee",
  });

// --- follow-up tasks ------------------------------------------------------------

export const taskCreateSchema = z
  .object({
    patient_id: z.string().min(1).max(80),
    alert_id: z.string().max(80).nullable().optional(),
    description: z.string().trim().min(1, "Describe the follow-up").max(500),
    // Require an explicit timezone offset (no ambiguous local datetime) — the
    // column is timestamptz. Optional: the server fills a HK-anchored default
    // (followUpDueISO) when omitted, so clients don't compute it in their own
    // browser zone.
    due_at: z.string().datetime({ offset: true }).optional(),
    assigned_to: z.string().trim().max(120).default(""),
  })
  .strict();

export const taskPatchSchema = z
  .object({
    status: z.enum(["done", "cancelled"]),
  })
  .strict();

// --- CSV import -----------------------------------------------------------------

export const csvRowSchema = z
  .object({
    date: isoDate,
    weight_kg: z.number().min(20).max(300).optional(),
    systolic_bp: z.number().min(40).max(300).optional(),
    diastolic_bp: z.number().min(20).max(200).optional(),
    heart_rate: z.number().min(20).max(250).optional(),
    steps: z.number().min(0).max(100_000).optional(),
    sleep_hours: z.number().min(0).max(24).optional(),
    medication_taken: z.boolean().optional(),
    shortness_of_breath: z.boolean().optional(),
    swelling: z.boolean().optional(),
  })
  .strict();

export const csvImportSchema = z
  .object({
    patient_id: z.string().max(80).optional(),
    csv: z.string().max(200_000, "CSV too large (200KB max)").optional(),
    rows: z.array(csvRowSchema).max(1000).optional(),
  })
  .strict()
  .refine((b) => Boolean(b.csv) || Boolean(b.rows?.length), {
    message: "Provide csv text or parsed rows",
  });

// --- patients --------------------------------------------------------------------

// Base WITHOUT defaults — defaults belong only to create; in the partial
// update schema they would materialize on every parse and make `{}` valid.
const patientFieldsSchema = z
  .object({
    name: z.string().trim().min(1, "Name is required").max(120),
    age: z.number().int().min(1, "Enter an age between 1 and 120").max(120, "Enter an age between 1 and 120"),
    gender: z.enum(["female", "male", "other"]),
    language: z.string().trim().min(1, "Language is required").max(40),
    /** Outbound WhatsApp + family message language. "auto" = bilingual zh+en. */
    preferred_language: z.enum(["auto", "en", "zh-HK", "ar"]),
    living_status: z.string().trim().min(1, "Living status is required").max(80),
    conditions: z.array(z.string().trim().min(1).max(80)).min(1, "Add at least one condition").max(20),
    caregiver_name: z.string().trim().max(120),
    // Empty (caregiver unknown) or international format — family clinical
    // updates are sent here, so an empty-or-valid guard prevents delivery to a
    // malformed destination.
    caregiver_phone: z
      .string()
      .trim()
      .max(40)
      .refine((v) => v === "" || /^\+[1-9]\d{6,14}$/.test(v.replace(/\s+/g, "")), {
        message: "Caregiver phone must be empty or international format, e.g. +85291234567",
      }),
    caregiver_email: z
      .string()
      .trim()
      .max(200)
      .refine((v) => v === "" || z.string().email().safeParse(v).success, {
        message: "Enter a valid email (or leave empty)",
      }),
    assigned_nurse: z.string().trim().min(1, "Assigned nurse is required").max(120),
    baseline_weight: z
      .number()
      .min(20, "Enter a baseline weight between 20 and 300 kg")
      .max(300, "Enter a baseline weight between 20 and 300 kg"),
    baseline_steps: z
      .number()
      .int()
      .min(0, "Enter baseline steps between 0 and 100,000")
      .max(100_000, "Enter baseline steps between 0 and 100,000"),
    phone: e164.nullable().optional(),
    /** Family-bound auto-sends (escalation alerts / weekly digest) — consent. */
    consent_caregiver_alerts: z.boolean(),
    consent_family_digest: z.boolean(),
  })
  .strict();

export const patientCreateSchema = patientFieldsSchema.extend({
  preferred_language: z.enum(["auto", "en", "zh-HK", "ar"]).default("auto"),
  caregiver_name: z.string().trim().max(120).default(""),
  caregiver_phone: z
    .string()
    .trim()
    .max(40)
    .refine((v) => v === "" || /^\+[1-9]\d{6,14}$/.test(v.replace(/\s+/g, "")), {
      message: "Caregiver phone must be empty or international format, e.g. +85291234567",
    })
    .default(""),
  caregiver_email: z
    .string()
    .trim()
    .max(200)
    .refine((v) => v === "" || z.string().email().safeParse(v).success, {
      message: "Enter a valid email (or leave empty)",
    })
    .default(""),
  consent_caregiver_alerts: z.boolean().default(false),
  consent_family_digest: z.boolean().default(false),
});

export const patientUpdateSchema = patientFieldsSchema
  .partial()
  .extend({
    status: z.enum(["active", "pending_review", "archived"]).optional(),
  })
  .strict()
  .refine((p) => Object.keys(p).length > 0, { message: "Nothing to update" });

export type PatientCreateInput = z.infer<typeof patientCreateSchema>;
export type PatientUpdateInput = z.infer<typeof patientUpdateSchema>;

// --- leads (public contact form) ----------------------------------------------

export const leadInterests = ["pilot", "demo", "pricing", "other"] as const;
export type LeadInterest = (typeof leadInterests)[number];

export const leadSchema = z
  .object({
    name: z.string().trim().min(1, "Name is required").max(120),
    organization: z.string().trim().min(1, "Organization is required").max(160),
    role: z.string().trim().max(120).default(""),
    email: z.string().trim().email("Enter a valid email").max(200),
    phone: z.string().trim().max(40).default(""),
    message: z.string().trim().max(2000, "Keep the message under 2000 characters").default(""),
    interest: z.enum(leadInterests),
    locale: z.string().trim().max(10).default("en"),
    /** Honeypot — humans never see or fill this field. */
    website: z.string().max(200).default(""),
  })
  .strict();

export const leadPatchSchema = z
  .object({
    status: z.enum(["new", "contacted", "closed"]),
  })
  .strict();

// --- misc routes ------------------------------------------------------------------

export const caregiverAlertSchema = z
  .object({ notify_family: z.boolean().optional() })
  .strict();

export const sendCheckinSchema = z
  .object({ patientId: z.string().max(80).optional() })
  .strict();

export const inviteUserSchema = z
  .object({
    email: z.string().trim().email("Enter a valid email").max(200),
    name: z.string().trim().min(1, "Name is required").max(120),
    role: z.enum(["admin", "nurse"]),
  })
  .strict();

export const auditQuerySchema = z.coerce.number().int().min(1).max(500);

// --- org settings (admin) -----------------------------------------------------

export const orgSettingsSchema = z
  .object({
    alerts_email: z
      .string()
      .trim()
      .max(200)
      .refine((v) => v === "" || z.string().email().safeParse(v).success, {
        message: "Enter a valid email (or leave empty)",
      })
      .optional(),
    admin_email: z
      .string()
      .trim()
      .max(200)
      .refine((v) => v === "" || z.string().email().safeParse(v).success, {
        message: "Enter a valid email (or leave empty)",
      })
      .optional(),
    notify_min_severity: z.enum(["escalate", "review_today"]).optional(),
    sla_ack_minutes_escalate: z.number().int().min(15).max(1440).optional(),
    sla_ack_minutes_review: z.number().int().min(30).max(2880).optional(),
  })
  .strict()
  .refine((p) => Object.keys(p).length > 0, { message: "Nothing to update" })
  // When both windows are supplied together, the lower-severity review window
  // must not be SHORTER than the escalate window (that would re-page
  // review_today faster than escalate — operationally backwards). Only checked
  // when both are present, since this is a partial-update schema.
  .refine(
    (p) =>
      p.sla_ack_minutes_escalate === undefined ||
      p.sla_ack_minutes_review === undefined ||
      p.sla_ack_minutes_review >= p.sla_ack_minutes_escalate,
    {
      message: "Review window must be at least as long as the escalate window",
      path: ["sla_ack_minutes_review"],
    },
  );

export type OrgSettingsInput = z.infer<typeof orgSettingsSchema>;

// --- rule thresholds (admin, guardrailed) -------------------------------------

/** Bounds are clinical guardrails: an org can tune sensitivity, not disable
 * monitoring. Structure/severity of rules is fixed in code. */
export const ruleConfigSchema = z
  .object({
    hf001_weight_gain_kg: z.number().min(1).max(5),
    hf002_weight_gain_kg: z.number().min(0.5).max(4),
    bp_systolic_max: z.number().int().min(140).max(220),
    bp_diastolic_max: z.number().int().min(90).max(130),
    act_drop_fraction: z.number().min(0.2).max(0.8),
    act_days: z.number().int().min(2).max(7),
    nr002_silent_days: z.number().int().min(2).max(7),
    note: z.string().trim().max(300).default(""),
  })
  .strict()
  .refine((c) => c.hf002_weight_gain_kg <= c.hf001_weight_gain_kg, {
    message: "The HF-002 escalation threshold cannot exceed the HF-001 review threshold",
    path: ["hf002_weight_gain_kg"],
  });

export type RuleConfigInput = z.infer<typeof ruleConfigSchema>;

// --- helper -----------------------------------------------------------------------

export type ParseResult<T> = { ok: true; data: T } | { ok: false; response: Response };

/** Parse + validate a JSON request body. On failure returns a ready-made 400. */
export async function parseBody<T>(req: Request, schema: z.ZodType<T>): Promise<ParseResult<T>> {
  let raw: unknown;
  try {
    raw = await req.json();
  } catch {
    return {
      ok: false,
      response: Response.json({ error: "Invalid JSON body" }, { status: 400 }),
    };
  }
  const parsed = schema.safeParse(raw);
  if (!parsed.success) {
    return {
      ok: false,
      response: Response.json(
        {
          error: "Validation failed",
          issues: parsed.error.issues.map((i) => ({
            path: i.path.join("."),
            message: i.message,
          })),
        },
        { status: 400 },
      ),
    };
  }
  return { ok: true, data: parsed.data };
}
