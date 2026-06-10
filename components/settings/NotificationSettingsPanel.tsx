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

/** Admin panel for alert paging + SLA escalation-chain settings. */
export function NotificationSettingsPanel() {
  const t = useTranslations("settings.notifications");
  const [settings, setSettings] = useState<OrgSettingsDto | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    api
      .orgSettings()
      .then(setSettings)
      .catch((e) => toast.error(e instanceof Error ? e.message : t("loadFailed")));
  }, [t]);

  function set<K extends keyof OrgSettingsDto>(key: K, value: OrgSettingsDto[K]) {
    setSettings((s) => (s ? { ...s, [key]: value } : s));
  }

  async function onSave(e: React.FormEvent) {
    e.preventDefault();
    if (!settings) return;
    setSaving(true);
    try {
      const updated = await api.patchOrgSettings(settings);
      setSettings(updated);
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
        <Field label={t("alertsEmail")} hint={t("alertsEmailHint")}>
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
        <Field label={t("adminEmail")} hint={t("adminEmailHint")}>
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
          <Field label={t("slaEscalate")} hint={t("slaMinutes")}>
            {(props) => (
              <Input
                {...props}
                type="number"
                inputMode="numeric"
                min={15}
                max={1440}
                value={String(settings.sla_ack_minutes_escalate)}
                onChange={(e) => set("sla_ack_minutes_escalate", Number(e.target.value))}
              />
            )}
          </Field>
          <Field label={t("slaReview")} hint={t("slaMinutes")}>
            {(props) => (
              <Input
                {...props}
                type="number"
                inputMode="numeric"
                min={30}
                max={2880}
                value={String(settings.sla_ack_minutes_review)}
                onChange={(e) => set("sla_ack_minutes_review", Number(e.target.value))}
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
