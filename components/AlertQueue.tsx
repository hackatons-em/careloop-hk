"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { CheckCircle2, ChevronRight, Stethoscope } from "lucide-react";
import { toast } from "sonner";
import { useApp } from "@/components/AppProvider";
import { AlertStatusBadge, RiskBadge } from "@/components/RiskBadge";
import { SafetyNote } from "@/components/SafetyLabels";
import { Button } from "@/components/ui/button";
import { api } from "@/lib/api";
import { formatDateTime, formatDay } from "@/lib/format";
import {
  ALERT_STATUS_LABEL,
  SEVERITY_ORDER,
  type AlertStatus,
  type PatientRow,
  type RiskAlert,
} from "@/lib/types";
import { cn } from "@/lib/utils";

const STATUSES: AlertStatus[] = [
  "new",
  "acknowledged",
  "family_contacted",
  "clinician_review_requested",
  "resolved",
];

export function AlertQueue() {
  const { alerts, rows, refresh } = useApp();
  const [view, setView] = useState<"open" | "all">("open");

  const patientById = useMemo(() => {
    const map = new Map<string, PatientRow>();
    for (const r of rows) map.set(r.patient.id, r);
    return map;
  }, [rows]);

  const visible = useMemo(() => {
    const filtered = view === "open" ? alerts.filter((a) => a.status !== "resolved") : alerts;
    return [...filtered].sort((a, b) => {
      const d = SEVERITY_ORDER[b.severity] - SEVERITY_ORDER[a.severity];
      return d !== 0 ? d : b.created_at.localeCompare(a.created_at);
    });
  }, [alerts, view]);

  return (
    <div className="space-y-4">
      <div className="flex rounded-lg border border-border p-0.5 text-sm w-fit">
        {(["open", "all"] as const).map((v) => (
          <button
            key={v}
            onClick={() => setView(v)}
            aria-pressed={view === v}
            className={cn(
              "rounded-md px-3 py-1 font-medium capitalize transition-colors",
              view === v ? "bg-primary text-primary-foreground" : "text-muted-foreground",
            )}
          >
            {v} {v === "open" && `(${alerts.filter((a) => a.status !== "resolved").length})`}
          </button>
        ))}
      </div>

      {visible.length === 0 && (
        <div className="rounded-xl border border-dashed border-border bg-card py-12 text-center">
          <CheckCircle2 className="mx-auto size-8 text-emerald-500" />
          <p className="mt-2 font-medium">No alerts in this view</p>
          <p className="text-sm text-muted-foreground">
            Run a risky check-in from the header to generate one.
          </p>
        </div>
      )}

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
  const [status, setStatus] = useState<AlertStatus>(alert.status);
  const [note, setNote] = useState(alert.nurse_note ?? "");
  const [busy, setBusy] = useState(false);

  async function save(nextStatus?: AlertStatus) {
    setBusy(true);
    try {
      const finalStatus = nextStatus ?? status;
      await api.patchAlert(alert.id, { status: finalStatus, nurse_note: note || null, actor: "Nurse" });
      setStatus(finalStatus);
      await onChanged();
      toast.success(`Alert ${ALERT_STATUS_LABEL[finalStatus].toLowerCase()}`);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not update alert");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="rounded-xl border border-border bg-card p-4">
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
              {patient.patient.age} · {patient.patient.conditions.join(", ")}
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          <AlertStatusBadge status={status} />
          <span className="text-xs text-muted-foreground">{formatDateTime(alert.created_at)}</span>
        </div>
      </div>

      <div className="mt-3 flex flex-wrap gap-1.5">
        {alert.matched_rules.map((code) => (
          <span
            key={code}
            className="rounded-md border border-border bg-muted px-1.5 py-0.5 font-mono text-xs font-semibold"
          >
            {code}
          </span>
        ))}
      </div>

      <p className="mt-2 text-sm">{alert.reason}</p>

      <div className="mt-3 grid gap-3 sm:grid-cols-3">
        <Field label="Suggested owner">
          <span className="inline-flex items-center gap-1.5 text-sm">
            <Stethoscope className="size-3.5 text-primary" />
            {alert.assigned_to}
          </span>
        </Field>
        <Field label="Latest weight">
          <span className="text-sm">
            {patient?.latest_weight != null ? `${patient.latest_weight} kg` : "—"}
          </span>
        </Field>
        <Field label="Last check-in">
          <span className="text-sm">{formatDay(patient?.last_checkin_date)}</span>
        </Field>
      </div>

      <div className="mt-3 rounded-lg border border-border bg-muted/30 p-3">
        <p className="text-sm font-medium">{alert.recommended_action}</p>
      </div>

      {/* nurse action row */}
      <div className="mt-3 flex flex-col gap-2 sm:flex-row sm:items-end">
        <label className="flex-1 text-xs text-muted-foreground">
          Nurse note
          <input
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="Add a note (e.g. called daughter, booked clinic follow-up)…"
            className="mt-1 w-full rounded-lg border border-border bg-card px-3 py-1.5 text-sm text-foreground outline-none focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/40"
          />
        </label>
        <select
          value={status}
          onChange={(e) => setStatus(e.target.value as AlertStatus)}
          aria-label="Alert status"
          className="rounded-lg border border-border bg-card px-3 py-1.5 text-sm outline-none focus-visible:border-ring"
        >
          {STATUSES.map((s) => (
            <option key={s} value={s}>
              {ALERT_STATUS_LABEL[s]}
            </option>
          ))}
        </select>
        <div className="flex gap-2">
          {alert.status === "new" && (
            <Button variant="outline" size="sm" disabled={busy} onClick={() => save("acknowledged")}>
              Acknowledge
            </Button>
          )}
          <Button size="sm" disabled={busy} onClick={() => save()} className="gap-1.5">
            Save <ChevronRight className="size-4" />
          </Button>
        </div>
      </div>

      <SafetyNote className="mt-3" />
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="text-xs text-muted-foreground">{label}</p>
      <div className="mt-0.5">{children}</div>
    </div>
  );
}
