"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { Loader2, X } from "lucide-react";
import { toast } from "sonner";
import { useApp } from "@/components/AppProvider";
import { Field } from "@/components/forms/Field";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { NativeSelect } from "@/components/ui/select";
import { api } from "@/lib/api";
import type { Patient } from "@/lib/types";
import { patientCreateSchema, type PatientCreateInput } from "@/lib/validation";

interface FormState {
  name: string;
  age: string;
  gender: string;
  language: string;
  living_status: string;
  conditions: string[];
  caregiver_name: string;
  caregiver_phone: string;
  caregiver_email: string;
  assigned_nurse: string;
  baseline_weight: string;
  baseline_steps: string;
  phone: string;
  consent_caregiver_alerts: boolean;
  consent_family_digest: boolean;
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
    caregiver_email: p?.caregiver_email ?? "",
    assigned_nurse: p?.assigned_nurse === "Unassigned" ? "" : (p?.assigned_nurse ?? ""),
    baseline_weight: p && p.baseline_weight > 0 ? String(p.baseline_weight) : "",
    baseline_steps: p && p.baseline_steps > 0 ? String(p.baseline_steps) : "",
    phone: p?.phone ?? "",
    consent_caregiver_alerts: p?.consent_caregiver_alerts ?? false,
    consent_family_digest: p?.consent_family_digest ?? false,
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
    caregiver_email: f.caregiver_email.trim(),
    assigned_nurse: f.assigned_nurse.trim(),
    baseline_weight: Number(f.baseline_weight),
    baseline_steps: Number(f.baseline_steps),
    phone: f.phone.trim() ? f.phone.trim() : null,
    consent_caregiver_alerts: f.consent_caregiver_alerts,
    consent_family_digest: f.consent_family_digest,
  };
}

// Stored data values — kept English on purpose (the risk engine's condition
// matching and seed data use these identifiers).
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
  const t = useTranslations("patient.form");
  const tc = useTranslations("common");
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

  /** Translate a zod field error via the catalog; fall back to the schema text. */
  function fieldError(key: string, fallback: string): string {
    return t.has(`errors.${key}` as never) ? t(`errors.${key}` as never) : fallback;
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();

    // Friendly required-field messages for the numeric inputs (Number("") is 0,
    // which would otherwise surface as a confusing range error from zod).
    const missing: Record<string, string> = {};
    if (!form.age.trim()) missing.age = t("errors.age");
    if (!form.baseline_weight.trim()) missing.baseline_weight = t("errors.baseline_weight");
    if (!form.baseline_steps.trim()) missing.baseline_steps = t("errors.baseline_steps");
    if (Object.keys(missing).length > 0) {
      setErrors(missing);
      toast.error(t("fixFields"));
      return;
    }

    const payload = toPayload(form);
    const parsed = patientCreateSchema.safeParse(payload);
    if (!parsed.success) {
      const errs: Record<string, string> = {};
      for (const issue of parsed.error.issues) {
        const key = String(issue.path[0] ?? "form");
        if (!errs[key]) errs[key] = fieldError(key, issue.message);
      }
      setErrors(errs);
      toast.error(t("fixFields"));
      return;
    }
    setErrors({});
    setSubmitting(true);
    try {
      if (mode === "create") {
        const created = await api.createPatient(parsed.data);
        toast.success(t("created", { name: created.name }));
        await refresh();
        router.push(`/patients/${created.id}`);
      } else if (patient) {
        await api.updatePatient(patient.id, {
          ...parsed.data,
          ...(markReviewedOnSave ? { status: "active" as const } : {}),
        });
        toast.success(t("saved"));
        await refresh();
        router.push(`/patients/${patient.id}`);
      }
      router.refresh();
    } catch (err) {
      setSubmitting(false);
      toast.error(err instanceof Error ? err.message : t("saveFailed"));
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4" noValidate>
      {/* Patient */}
      <section
        className="cl-rise rounded-2xl border border-border bg-card p-5"
        style={{ animationDelay: "0ms" }}
      >
        <h2 className="text-sm font-semibold">{t("sectionPatient")}</h2>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <Field label={t("name")} error={errors.name} required>
            {(props) => (
              <Input
                {...props}
                value={form.name}
                onChange={(e) => set("name", e.target.value)}
                placeholder={t("namePlaceholder")}
                autoComplete="off"
              />
            )}
          </Field>
          <Field label={t("age")} error={errors.age} required>
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
          <Field label={t("gender")} error={errors.gender} required>
            {(props) => (
              <NativeSelect
                {...props}
                value={form.gender}
                onChange={(e) => set("gender", e.target.value)}
              >
                <option value="female">{t("genderFemale")}</option>
                <option value="male">{t("genderMale")}</option>
                <option value="other">{t("genderOther")}</option>
              </NativeSelect>
            )}
          </Field>
          <Field label={t("language")} error={errors.language} required>
            {(props) => (
              <Input
                {...props}
                value={form.language}
                onChange={(e) => set("language", e.target.value)}
                placeholder={t("languagePlaceholder")}
              />
            )}
          </Field>
          <Field
            label={t("livingStatus")}
            error={errors.living_status}
            required
            className="sm:col-span-2"
          >
            {(props) => (
              <Input
                {...props}
                value={form.living_status}
                onChange={(e) => set("living_status", e.target.value)}
                placeholder={t("livingStatusPlaceholder")}
              />
            )}
          </Field>
          <Field
            label={t("conditions")}
            error={errors.conditions}
            hint={t("conditionsHint")}
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
                          aria-label={t("removeCondition", { condition: c })}
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
                  placeholder={t("conditionsPlaceholder")}
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
        <h2 className="text-sm font-semibold">{t("sectionWhatsapp")}</h2>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <Field
            label={t("phone")}
            error={errors.phone}
            hint={t("phoneHint")}
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
          <Field label={t("caregiverName")} error={errors.caregiver_name}>
            {(props) => (
              <Input
                {...props}
                value={form.caregiver_name}
                onChange={(e) => set("caregiver_name", e.target.value)}
                placeholder={t("caregiverNamePlaceholder")}
              />
            )}
          </Field>
          <Field label={t("caregiverPhone")} error={errors.caregiver_phone}>
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
          <Field
            label={t("caregiverEmail")}
            error={errors.caregiver_email}
            className="sm:col-span-2"
          >
            {(props) => (
              <Input
                {...props}
                type="email"
                value={form.caregiver_email}
                onChange={(e) => set("caregiver_email", e.target.value)}
                placeholder="family@example.com"
              />
            )}
          </Field>
        </div>

        {/* Family-messaging consent: auto-sends stay OFF until recorded here.
            A WhatsApp STOP/取消 from the patient switches them back off. */}
        <div className="mt-4 space-y-2 rounded-xl border border-border bg-background/60 p-3.5">
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            {t("consentTitle")}
          </p>
          <label className="flex items-start gap-2.5 text-sm">
            <input
              type="checkbox"
              className="mt-0.5 size-4 accent-[var(--primary)]"
              checked={form.consent_caregiver_alerts}
              onChange={(e) => set("consent_caregiver_alerts", e.target.checked)}
            />
            <span>
              {t("consentAlerts")}
              <span className="block text-xs text-muted-foreground">{t("consentAlertsHint")}</span>
            </span>
          </label>
          <label className="flex items-start gap-2.5 text-sm">
            <input
              type="checkbox"
              className="mt-0.5 size-4 accent-[var(--primary)]"
              checked={form.consent_family_digest}
              onChange={(e) => set("consent_family_digest", e.target.checked)}
            />
            <span>
              {t("consentDigest")}
              <span className="block text-xs text-muted-foreground">{t("consentDigestHint")}</span>
            </span>
          </label>
          <p className="text-xs text-muted-foreground">{t("consentOptOutNote")}</p>
        </div>
      </section>

      {/* Care plan & baselines */}
      <section
        className="cl-rise rounded-2xl border border-border bg-card p-5"
        style={{ animationDelay: "120ms" }}
      >
        <h2 className="text-sm font-semibold">{t("sectionCarePlan")}</h2>
        <div className="mt-4 grid gap-4 sm:grid-cols-3">
          <Field label={t("assignedNurse")} error={errors.assigned_nurse} required>
            {(props) => (
              <Input
                {...props}
                value={form.assigned_nurse}
                onChange={(e) => set("assigned_nurse", e.target.value)}
                placeholder={t("assignedNursePlaceholder")}
              />
            )}
          </Field>
          <Field
            label={t("baselineWeight")}
            error={errors.baseline_weight}
            hint={t("baselineWeightHint")}
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
            label={t("baselineSteps")}
            error={errors.baseline_steps}
            hint={t("baselineStepsHint")}
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
          {tc("cancel")}
        </Button>
        <Button type="submit" size="lg" disabled={submitting}>
          {submitting && <Loader2 className="size-4 animate-spin" />}
          {mode === "create"
            ? submitting
              ? t("creating")
              : t("create")
            : submitting
              ? t("saving")
              : markReviewedOnSave
                ? t("saveAndReview")
                : t("saveChanges")}
        </Button>
      </div>
    </form>
  );
}
