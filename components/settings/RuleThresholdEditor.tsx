"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { Loader2, SlidersHorizontal } from "lucide-react";
import { toast } from "sonner";
import { Field } from "@/components/forms/Field";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { RuleConfig } from "@/lib/riskEngine";
import { ruleConfigSchema } from "@/lib/validation";

interface FieldDef {
  key: keyof RuleConfig;
  rule: string;
  min: number;
  max: number;
  step: number;
  unit: string;
}

const FIELDS: FieldDef[] = [
  { key: "hf001_weight_gain_kg", rule: "HF-001", min: 1, max: 5, step: 0.1, unit: "kg" },
  { key: "hf002_weight_gain_kg", rule: "HF-002", min: 0.5, max: 4, step: 0.1, unit: "kg" },
  { key: "bp_systolic_max", rule: "BP-001", min: 140, max: 220, step: 1, unit: "mmHg" },
  { key: "bp_diastolic_max", rule: "BP-001", min: 90, max: 130, step: 1, unit: "mmHg" },
  { key: "act_drop_fraction", rule: "ACT-001", min: 0.2, max: 0.8, step: 0.05, unit: "×" },
  { key: "act_days", rule: "ACT-001", min: 2, max: 7, step: 1, unit: "d" },
  { key: "nr002_silent_days", rule: "NR-002", min: 2, max: 7, step: 1, unit: "d" },
];

/**
 * Guardrailed threshold tuning. Saving appends a NEW config version (never
 * edits history); the engine picks it up on the next evaluation and alerts
 * stamp the version that produced them.
 */
export function RuleThresholdEditor({
  active,
}: {
  active: { version: number; config: RuleConfig };
}) {
  const t = useTranslations("settings.rules.editor");
  const router = useRouter();
  const [draft, setDraft] = useState<Record<string, string>>(() =>
    Object.fromEntries(FIELDS.map((f) => [f.key, String(active.config[f.key])])),
  );
  const [note, setNote] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);

  async function onSave(e: React.FormEvent) {
    e.preventDefault();
    const payload = {
      ...Object.fromEntries(FIELDS.map((f) => [f.key, Number(draft[f.key])])),
      note: note.trim(),
    };
    const parsed = ruleConfigSchema.safeParse(payload);
    if (!parsed.success) {
      const errs: Record<string, string> = {};
      for (const issue of parsed.error.issues) {
        const key = String(issue.path[0] ?? "form");
        if (!errs[key]) errs[key] = issue.message;
      }
      setErrors(errs);
      toast.error(t("fixFields"));
      return;
    }
    setErrors({});
    setSaving(true);
    try {
      const res = await fetch("/api/admin/rule-config", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(parsed.data),
      });
      if (!res.ok) {
        const body = (await res.json().catch(() => ({}))) as { error?: string };
        throw new Error(body.error ?? `Request failed (${res.status})`);
      }
      const saved = (await res.json()) as { version: number };
      toast.success(t("saved", { version: saved.version }));
      setNote("");
      router.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t("saveFailed"));
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={onSave} className="cl-rise rounded-2xl border border-border bg-card p-5">
      <div className="flex items-center gap-2 text-sm font-semibold">
        <SlidersHorizontal className="size-4 text-primary" />
        {t("title")}
      </div>
      <p className="mt-1 text-xs text-muted-foreground">{t("sub")}</p>

      <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {FIELDS.map((f) => (
          <Field
            key={f.key}
            label={`${f.rule} · ${t(`fields.${f.key}`)}`}
            error={errors[f.key]}
            hint={t("bounds", { min: f.min, max: f.max, unit: f.unit })}
          >
            {(props) => (
              <Input
                {...props}
                type="number"
                inputMode="decimal"
                min={f.min}
                max={f.max}
                step={f.step}
                value={draft[f.key]}
                onChange={(e) => setDraft((d) => ({ ...d, [f.key]: e.target.value }))}
              />
            )}
          </Field>
        ))}
        <Field label={t("note")} error={errors.note} className="sm:col-span-2 lg:col-span-3">
          {(props) => (
            <Input
              {...props}
              value={note}
              maxLength={300}
              onChange={(e) => setNote(e.target.value)}
              placeholder={t("notePlaceholder")}
            />
          )}
        </Field>
      </div>

      <div className="mt-4 flex items-center justify-between gap-3">
        <p className="text-xs text-muted-foreground">
          {t("activeVersion", { version: active.version })}
        </p>
        <Button type="submit" disabled={saving}>
          {saving && <Loader2 className="size-4 animate-spin" />}
          {saving ? t("saving") : t("save")}
        </Button>
      </div>
    </form>
  );
}
