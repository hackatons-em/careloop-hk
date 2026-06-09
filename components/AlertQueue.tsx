"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { ArrowRight, CheckCircle2, ChevronRight, Stethoscope } from "lucide-react";
import { toast } from "sonner";
import { useApp } from "@/components/AppProvider";
import { AlertStatusBadge, RiskBadge } from "@/components/RiskBadge";
import { SafetyNote } from "@/components/SafetyLabels";
import { Button } from "@/components/ui/button";
import { api } from "@/lib/api";
import { useFormat } from "@/lib/useFormat";
import { SEVERITY_ORDER, type AlertStatus, type PatientRow, type RiskAlert } from "@/lib/types";
import { cn } from "@/lib/utils";

const STATUSES: AlertStatus[] = [
  "new",
  "acknowledged",
  "family_contacted",
  "clinician_review_requested",
  "resolved",
];

type AlertView = "unopened" | "open" | "all";

const VIEWS: AlertView[] = ["unopened", "open", "all"];

export function AlertQueue() {
  const t = useTranslations("alerts");
  const { alerts, rows, refresh } = useApp();
  const [view, setView] = useState<AlertView>("open");

  const patientById = useMemo(() => {
    const map = new Map<string, PatientRow>();
    for (const r of rows) map.set(r.patient.id, r);
    return map;
  }, [rows]);

  const counts = useMemo(
    () => ({
      unopened: alerts.filter((a) => a.status === "new").length,
      open: alerts.filter((a) => a.status !== "resolved").length,
      all: alerts.length,
    }),
    [alerts],
  );

  const visible = useMemo(() => {
    const filtered =
      view === "unopened"
        ? alerts.filter((a) => a.status === "new")
        : view === "open"
          ? alerts.filter((a) => a.status !== "resolved")
          : alerts;
    return [...filtered].sort((a, b) => {
      const d = SEVERITY_ORDER[b.severity] - SEVERITY_ORDER[a.severity];
      return d !== 0 ? d : b.created_at.localeCompare(a.created_at);
    });
  }, [alerts, view]);

  return (
    <div className="space-y-4">
      <div className="flex w-fit rounded-lg border border-border p-0.5 text-sm">
        {VIEWS.map((v) => {
          const active = view === v;
          return (
            <button
              key={v}
              onClick={() => setView(v)}
              aria-pressed={active}
              className={cn(
                "inline-flex items-center gap-1.5 rounded-md px-3 py-1 font-medium outline-none transition-colors focus-visible:ring-2 focus-visible:ring-ring",
                active ? "bg-primary text-primary-foreground" : "text-muted-foreground",
              )}
            >
              {t(`views.${v}`)}
              <span
                className={cn(
                  "rounded-full px-1.5 text-xs",
                  active
                    ? "bg-primary-foreground/20 text-primary-foreground"
                    : "bg-muted text-muted-foreground",
                )}
              >
                {counts[v]}
              </span>
            </button>
          );
        })}
      </div>

      {visible.length === 0 && (
        <div className="rounded-xl border border-dashed border-border bg-card py-12 text-center">
          <CheckCircle2 className="mx-auto size-8 text-emerald-500" />
          <p className="mt-2 font-medium">{t("empty.title")}</p>
          <p className="text-sm text-muted-foreground">{t("empty.body")}</p>
        </div>
      )}

      {visible.length > 0 && <SafetyNote />}

      <div className="space-y-3">
        {visible.map((alert) => (
          <AlertCard
            key={alert.id}
            alert={alert}
            patient={patientById.get(alert.patient_id)}
            onChanged={refresh}
          />
        ))}
      </div>
    </div>
  );
}

function AlertCard({
  alert,
  patient,
  onChanged,
}: {
  alert: RiskAlert;
  patient: PatientRow | undefined;
  onChanged: () => Promise<void> | void;
}) {
  const t = useTranslations("alerts");
  const td = useTranslations("domain.alertStatus");
  const { formatDay, formatDateTime } = useFormat();
  const [status, setStatus] = useState<AlertStatus>(alert.status);
  const [note, setNote] = useState(alert.nurse_note ?? "");
  const [busy, setBusy] = useState(false);

  async function save(nextStatus?: AlertStatus, opts?: { quiet?: boolean }) {
    setBusy(true);
    try {
      const finalStatus = nextStatus ?? status;
      await api.patchAlert(alert.id, { status: finalStatus, nurse_note: note || null });
      setStatus(finalStatus);
      await onChanged();
      if (!opts?.quiet) toast.success(t(`toasts.${finalStatus}`));
    } catch (e) {
      toast.error(e instanceof Error ? e.message : t("toasts.failed"));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="cl-card rounded-2xl border border-border bg-card p-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2.5">
          <RiskBadge severity={alert.severity} />
          <Link
            href={`/patients/${alert.patient_id}`}
            className="font-semibold hover:text-primary hover:underline"
          >
            {patient?.patient.name ?? alert.patient_id}
          </Link>
          {patient && (
            <span className="text-sm text-muted-foreground">
              {patient.patient.age > 0 ? patient.patient.age : "—"} ·{" "}
              {patient.patient.conditions.join(", ")}
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          <AlertStatusBadge status={status} />
          <span className="text-xs text-muted-foreground">{formatDateTime(alert.created_at)}</span>
        </div>
      </div>

      <p className="mt-2 text-sm">{alert.reason}</p>

      <div className="mt-2 flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-muted-foreground">
        <span className="inline-flex items-center gap-1.5">
          <Stethoscope className="size-3.5 text-primary" />
          {alert.assigned_to}
        </span>
        <span aria-hidden>·</span>
        <span>{patient?.latest_weight != null ? `${patient.latest_weight} kg` : "—"}</span>
        <span aria-hidden>·</span>
        <span>{t("card.lastCheckin", { date: formatDay(patient?.last_checkin_date) })}</span>
      </div>

      <p className="mt-2 flex items-start gap-1.5 text-sm">
        <ArrowRight className="mt-0.5 size-3.5 shrink-0 text-primary" />
        <span className="font-medium">{alert.recommended_action}</span>
      </p>

      {/* nurse action row */}
      <div className="mt-3 flex flex-col gap-2 sm:flex-row sm:items-end">
        <label className="flex-1 text-xs text-muted-foreground">
          {t("card.nurseNote")}
          <input
            value={note}
            onChange={(e) => setNote(e.target.value)}
            onBlur={() => {
              if (!busy && note !== (alert.nurse_note ?? "")) void save(undefined, { quiet: true });
            }}
            placeholder={t("card.notePlaceholder")}
            className="mt-1 w-full rounded-lg border border-border bg-card px-3 py-1.5 text-sm text-foreground outline-none focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/40"
          />
        </label>
        <select
          value={status}
          onChange={(e) => setStatus(e.target.value as AlertStatus)}
          aria-label={t("card.statusLabel")}
          className="rounded-lg border border-border bg-card px-3 py-1.5 text-sm outline-none transition-colors focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring"
        >
          {STATUSES.map((s) => (
            <option key={s} value={s}>
              {td(s)}
            </option>
          ))}
        </select>
        <div className="flex gap-2">
          {alert.status === "new" && (
            <Button variant="outline" size="sm" disabled={busy} onClick={() => save("acknowledged")}>
              {t("card.acknowledge")}
            </Button>
          )}
          <Button size="sm" disabled={busy} onClick={() => save()} className="gap-1.5">
            {t("card.save")} <ChevronRight className="size-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
