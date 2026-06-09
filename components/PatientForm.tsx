"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, X } from "lucide-react";
import { toast } from "sonner";
import { useApp } from "@/components/AppProvider";
import { Field } from "@/components/forms/Field";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { NativeSelect } from "@/components/ui/select";
import { api } from "@/lib/api";
import type { Patient } from "@/lib/types";
import {
  patientCreateSchema,
  type PatientCreateInput,
} from "@/lib/validation";

interface FormState {
  name: string;
  age: string;
  gender: string;
  language: string;
  living_status: string;
  conditions: string[];
  caregiver_name: string;
  caregiver_phone: string;
  assigned_nurse: string;
  baseline_weight: string;
  baseline_steps: string;
  phone: string;
}

function fromPatient(p?: Patient): FormState {
  return {
    name: p?.name ?? "",
    age: p && p.age > 0 ? String(p.age) : "",
    gender: p?.gender || "female",
    language: p?.language ?? "Cantonese",
    living_status: p?.living_status ?? "",
    conditions: p?.conditions ?? [],
    caregiver_name: p?.caregiver_name ?? "",
    caregiver_phone: p?.caregiver_phone ?? "",
    assigned_nurse: p?.assigned_nurse === "Unassigned" ? "" : (p?.assigned_nurse ?? ""),
    baseline_weight: p && p.baseline_weight > 0 ? String(p.baseline_weight) : "",
    baseline_steps: p && p.baseline_steps > 0 ? String(p.baseline_steps) : "",
    phone: p?.phone ?? "",
  };
}

function toPayload(f: FormState): PatientCreateInput {
  return {
    name: f.name.trim(),
    age: Number(f.age),
    gender: f.gender as PatientCreateInput["gender"],
    language: f.language.trim(),
    living_status: f.living_status.trim(),
    conditions: f.conditions,
    caregiver_name: f.caregiver_name.trim(),
    caregiver_phone: f.caregiver_phone.trim(),
    assigned_nurse: f.assigned_nurse.trim(),
    baseline_weight: Number(f.baseline_weight),
    baseline_steps: Number(f.baseline_steps),
    phone: f.phone.trim() ? f.phone.trim() : null,
  };
}

const CONDITION_SUGGESTIONS = [
  "heart failure",
  "hypertension",
  "diabetes",
  "COPD",
  "kidney disease",
  "post-stroke recovery",
];

export function PatientForm({
  mode,
  patient,
  /** When editing a pending_review patient, saving also marks them active. */
  markReviewedOnSave = false,
}: {
  mode: "create" | "edit";
  patient?: Patient;
  markReviewedOnSave?: boolean;
}) {
  const router = useRouter();
  const { refresh } = useApp();
  const [form, setForm] = useState<FormState>(() => fromPatient(patient));
  const [conditionDraft, setConditionDraft] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);

  function set<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  function addCondition(raw: string) {
    const value = raw.trim().replace(/,$/, "");
    if (!value) return;
    if (!form.conditions.includes(value)) set("conditions", [...form.conditions, value]);
    setConditionDraft("");
  }

  function removeCondition(value: string) {
    set(
      "conditions",
      form.conditions.filter((c) => c !== value),
    );
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();

    // Friendly required-field messages for the numeric inputs (Number("") is 0,
    // which would otherwise surface as a confusing range error from zod).
    const missing: Record<string, string> = {};
    if (!form.age.trim()) missing.age = "Age is required";
    if (!form.baseline_weight.trim()) missing.baseline_weight = "Baseline weight is required";
    if (!form.baseline_steps.trim()) missing.baseline_steps = "Baseline steps is required";
    if (Object.keys(missing).length > 0) {
      setErrors(missing);
      toast.error("Please fix the highlighted fields");
      return;
    }

    const payload = toPayload(form);
    const parsed = patientCreateSchema.safeParse(payload);
    if (!parsed.success) {
      const errs: Record<string, string> = {};
      for (const issue of parsed.error.issues) {
        const key = String(issue.path[0] ?? "form");
        if (!errs[key]) errs[key] = issue.message;
      }
      setErrors(errs);
      toast.error("Please fix the highlighted fields");
      return;
    }
    setErrors({});
    setSubmitting(true);
    try {
      if (mode === "create") {
        const created = await api.createPatient(parsed.data);
        toast.success(`${created.name} added to monitoring`);
        await refresh();
        router.push(`/patients/${created.id}`);
      } else if (patient) {
        await api.updatePatient(patient.id, {
          ...parsed.data,
          ...(markReviewedOnSave ? { status: "active" as const } : {}),
        });
        toast.success("Patient details saved");
        await refresh();
        router.push(`/patients/${patient.id}`);
      }
      router.refresh();
    } catch (err) {
      setSubmitting(false);
      toast.error(err instanceof Error ? err.message : "Could not save patient");
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4" noValidate>
      {/* Patient */}
      <section
        className="cl-rise rounded-2xl border border-border bg-card p-5"
        style={{ animationDelay: "0ms" }}
      >
        <h2 className="text-sm font-semibold">Patient</h2>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <Field label="Full name" error={errors.name} required>
            {(props) => (
              <Input
                {...props}
                value={form.name}
                onChange={(e) => set("name", e.target.value)}
                placeholder="Mrs. Chan"
                autoComplete="off"
              />
            )}
          </Field>
          <Field label="Age" error={errors.age} required>
            {(props) => (
              <Input
                {...props}
                type="number"
                inputMode="numeric"
                min={1}
                max={120}
                value={form.age}
                onChange={(e) => set("age", e.target.value)}
              />
            )}
          </Field>
          <Field label="Gender" error={errors.gender} required>
            {(props) => (
              <NativeSelect
                {...props}
                value={form.gender}
                onChange={(e) => set("gender", e.target.value)}
              >
                <option value="female">Female</option>
                <option value="male">Male</option>
                <option value="other">Other</option>
              </NativeSelect>
            )}
          </Field>
          <Field label="Language" error={errors.language} required>
            {(props) => (
              <Input
                {...props}
                value={form.language}
                onChange={(e) => set("language", e.target.value)}
                placeholder="Cantonese"
              />
            )}
          </Field>
          <Field
            label="Living situation"
            error={errors.living_status}
            required
            className="sm:col-span-2"
          >
            {(props) => (
              <Input
                {...props}
                value={form.living_status}
                onChange={(e) => set("living_status", e.target.value)}
                placeholder="lives alone / with family / care home"
              />
            )}
          </Field>
          <Field
            label="Conditions"
            error={errors.conditions}
            hint="Type a condition and press Enter"
            required
            className="sm:col-span-2"
          >
            {(props) => (
              <div>
                {form.conditions.length > 0 && (
                  <div className="mb-2 flex flex-wrap gap-1.5">
                    {form.conditions.map((c) => (
                      <span
                        key={c}
                        className="inline-flex items-center gap-1 rounded-full border border-primary/20 bg-accent px-2.5 py-0.5 text-xs font-medium text-accent-foreground"
                      >
                        {c}
                        <button
                          type="button"
                          aria-label={`Remove ${c}`}
                          onClick={() => removeCondition(c)}
                          className="rounded-full p-0.5 hover:bg-primary/10"
                        >
                          <X className="size-3" />
                        </button>
                      </span>
                    ))}
                  </div>
                )}
                <Input
                  {...props}
                  value={conditionDraft}
                  onChange={(e) => setConditionDraft(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === ",") {
                      e.preventDefault();
                      addCondition(conditionDraft);
                    }
                  }}
                  onBlur={() => addCondition(conditionDraft)}
                  placeholder="heart failure"
                  list="condition-suggestions"
                />
                <datalist id="condition-suggestions">
                  {CONDITION_SUGGESTIONS.map((c) => (
                    <option key={c} value={c} />
                  ))}
                </datalist>
              </div>
            )}
          </Field>
        </div>
      </section>

      {/* WhatsApp & caregiver */}
      <section
        className="cl-rise rounded-2xl border border-border bg-card p-5"
        style={{ animationDelay: "60ms" }}
      >
        <h2 className="text-sm font-semibold">WhatsApp &amp; caregiver</h2>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <Field
            label="Patient WhatsApp number"
            error={errors.phone}
            hint="International format for daily check-ins, e.g. +85291234567"
            className="sm:col-span-2"
          >
            {(props) => (
              <Input
                {...props}
                type="tel"
                value={form.phone}
                onChange={(e) => set("phone", e.target.value)}
                placeholder="+85291234567"
              />
            )}
          </Field>
          <Field label="Caregiver name" error={errors.caregiver_name}>
            {(props) => (
              <Input
                {...props}
                value={form.caregiver_name}
                onChange={(e) => set("caregiver_name", e.target.value)}
                placeholder="Daughter — Ms. Chan"
              />
            )}
          </Field>
          <Field label="Caregiver phone" error={errors.caregiver_phone}>
            {(props) => (
              <Input
                {...props}
                type="tel"
                value={form.caregiver_phone}
                onChange={(e) => set("caregiver_phone", e.target.value)}
                placeholder="+85298765432"
              />
            )}
          </Field>
        </div>
      </section>

      {/* Care plan & baselines */}
      <section
        className="cl-rise rounded-2xl border border-border bg-card p-5"
        style={{ animationDelay: "120ms" }}
      >
        <h2 className="text-sm font-semibold">Care plan &amp; baselines</h2>
        <div className="mt-4 grid gap-4 sm:grid-cols-3">
          <Field label="Assigned nurse" error={errors.assigned_nurse} required>
            {(props) => (
              <Input
                {...props}
                value={form.assigned_nurse}
                onChange={(e) => set("assigned_nurse", e.target.value)}
                placeholder="Nurse Wong"
              />
            )}
          </Field>
          <Field
            label="Baseline weight (kg)"
            error={errors.baseline_weight}
            hint="Used by the weight-gain rules"
            required
          >
            {(props) => (
              <Input
                {...props}
                type="number"
                inputMode="decimal"
                step="0.1"
                min={20}
                max={300}
                value={form.baseline_weight}
                onChange={(e) => set("baseline_weight", e.target.value)}
              />
            )}
          </Field>
          <Field
            label="Baseline steps / day"
            error={errors.baseline_steps}
            hint="Used by the activity-drop rule"
            required
          >
            {(props) => (
              <Input
                {...props}
                type="number"
                inputMode="numeric"
                min={0}
                max={100000}
                value={form.baseline_steps}
                onChange={(e) => set("baseline_steps", e.target.value)}
              />
            )}
          </Field>
        </div>
      </section>

      <div className="flex items-center justify-end gap-2">
        <Button type="button" variant="ghost" size="lg" onClick={() => router.back()}>
          Cancel
        </Button>
        <Button type="submit" size="lg" disabled={submitting}>
          {submitting && <Loader2 className="size-4 animate-spin" />}
          {mode === "create"
            ? submitting
              ? "Creating…"
              : "Create patient"
            : submitting
              ? "Saving…"
              : markReviewedOnSave
                ? "Save and mark reviewed"
                : "Save changes"}
        </Button>
      </div>
    </form>
  );
}
