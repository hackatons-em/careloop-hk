"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { BellRing, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Field } from "@/components/forms/Field";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { NativeSelect } from "@/components/ui/select";
import { api, type OrgSettingsDto } from "@/lib/api";
import { orgSettingsSchema } from "@/lib/validation";

/** Admin panel for alert paging + SLA escalation-chain settings. */
export function NotificationSettingsPanel() {
  const t = useTranslations("settings.notifications");
  const [settings, setSettings] = useState<OrgSettingsDto | null>(null);
  // SLA windows are held as raw strings so a field can be blank while retyping
  // (Number("") === 0 would otherwise rewrite it to "0" and fail the server).
  const [slaEsc, setSlaEsc] = useState("");
  const [slaRev, setSlaRev] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    api
      .orgSettings()
      .then((s) => {
        setSettings(s);
        setSlaEsc(String(s.sla_ack_minutes_escalate));
        setSlaRev(String(s.sla_ack_minutes_review));
      })
      .catch((e) => toast.error(e instanceof Error ? e.message : t("loadFailed")));
  }, [t]);

  function set<K extends keyof OrgSettingsDto>(key: K, value: OrgSettingsDto[K]) {
    setSettings((s) => (s ? { ...s, [key]: value } : s));
  }

  async function onSave(e: React.FormEvent) {
    e.preventDefault();
    if (!settings) return;
    const payload = {
      alerts_email: settings.alerts_email,
      admin_email: settings.admin_email,
      notify_min_severity: settings.notify_min_severity,
      sla_ack_minutes_escalate: Number(slaEsc),
      sla_ack_minutes_review: Number(slaRev),
    };
    // Client-side validate so field errors surface inline instead of as a
    // generic server "Validation failed" toast.
    const parsed = orgSettingsSchema.safeParse(payload);
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
      const updated = await api.patchOrgSettings(parsed.data);
      setSettings(updated);
      setSlaEsc(String(updated.sla_ack_minutes_escalate));
      setSlaRev(String(updated.sla_ack_minutes_review));
      toast.success(t("saved"));
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t("saveFailed"));
    } finally {
      setSaving(false);
    }
  }

  if (!settings) {
    return (
      <div className="cl-rise flex items-center gap-2 rounded-2xl border border-border bg-card p-5 text-sm text-muted-foreground">
        <Loader2 className="size-4 animate-spin" /> {t("loading")}
      </div>
    );
  }

  return (
    <form onSubmit={onSave} className="cl-rise rounded-2xl border border-border bg-card p-5">
      <div className="flex items-center gap-2 text-sm font-semibold">
        <BellRing className="size-4 text-primary" />
        {t("title")}
      </div>
      <p className="mt-1 text-xs text-muted-foreground">{t("sub")}</p>

      <div className="mt-4 grid gap-4 sm:grid-cols-2">
        <Field label={t("alertsEmail")} hint={t("alertsEmailHint")} error={errors.alerts_email}>
          {(props) => (
            <Input
              {...props}
              type="email"
              value={settings.alerts_email}
              onChange={(e) => set("alerts_email", e.target.value)}
              placeholder="ward-duty@hospital.example"
            />
          )}
        </Field>
        <Field label={t("adminEmail")} hint={t("adminEmailHint")} error={errors.admin_email}>
          {(props) => (
            <Input
              {...props}
              type="email"
              value={settings.admin_email}
              onChange={(e) => set("admin_email", e.target.value)}
              placeholder="charge-nurse@hospital.example"
            />
          )}
        </Field>
        <Field label={t("minSeverity")} hint={t("minSeverityHint")}>
          {(props) => (
            <NativeSelect
              {...props}
              value={settings.notify_min_severity}
              onChange={(e) =>
                set("notify_min_severity", e.target.value as OrgSettingsDto["notify_min_severity"])
              }
            >
              <option value="escalate">{t("severityEscalateOnly")}</option>
              <option value="review_today">{t("severityReviewToday")}</option>
            </NativeSelect>
          )}
        </Field>
        <div className="grid grid-cols-2 gap-4">
          <Field label={t("slaEscalate")} hint={t("slaMinutes")} error={errors.sla_ack_minutes_escalate}>
            {(props) => (
              <Input
                {...props}
                type="number"
                inputMode="numeric"
                min={15}
                max={1440}
                value={slaEsc}
                onChange={(e) => setSlaEsc(e.target.value)}
              />
            )}
          </Field>
          <Field label={t("slaReview")} hint={t("slaMinutes")} error={errors.sla_ack_minutes_review}>
            {(props) => (
              <Input
                {...props}
                type="number"
                inputMode="numeric"
                min={30}
                max={2880}
                value={slaRev}
                onChange={(e) => setSlaRev(e.target.value)}
              />
            )}
          </Field>
        </div>
      </div>

      <p className="mt-4 rounded-lg bg-muted/40 px-3 py-2 text-xs text-muted-foreground">
        {t("chainNote")}
      </p>

      <div className="mt-4 flex justify-end">
        <Button type="submit" disabled={saving}>
          {saving && <Loader2 className="size-4 animate-spin" />}
          {saving ? t("saving") : t("save")}
        </Button>
      </div>
    </form>
  );
}
