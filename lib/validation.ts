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
  })
  .strict()
  .refine((p) => p.status !== undefined || p.nurse_note !== undefined, {
    message: "Provide a status or a nurse note",
  });

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
    living_status: z.string().trim().min(1, "Living status is required").max(80),
    conditions: z.array(z.string().trim().min(1).max(80)).min(1, "Add at least one condition").max(20),
    caregiver_name: z.string().trim().max(120),
    caregiver_phone: z.string().trim().max(40),
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
  })
  .strict();

export const patientCreateSchema = patientFieldsSchema.extend({
  caregiver_name: z.string().trim().max(120).default(""),
  caregiver_phone: z.string().trim().max(40).default(""),
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
