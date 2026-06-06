"use client";

import { useCallback, useState } from "react";
import Link from "next/link";
import {
  ChevronLeft,
  Phone,
  Stethoscope,
  Home,
  Languages,
  Scale,
  HeartPulse,
  Activity,
  Footprints,
} from "lucide-react";
import { TrendChart, type ChartRow } from "@/components/charts/TrendChart";
import { RiskCard } from "@/components/RiskCard";
import { RiskBadge } from "@/components/RiskBadge";
import { AuditDrawer } from "@/components/AuditDrawer";
import { CheckInSimulator } from "@/components/CheckInSimulator";
import { CsvImport } from "@/components/CsvImport";
import { CaregiverAlert } from "@/components/CaregiverAlert";
import { WeeklySummaryPanel } from "@/components/WeeklySummaryPanel";
import { FhirExportPanel } from "@/components/FhirExportPanel";
import { SafetyLabels } from "@/components/SafetyLabels";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useApp } from "@/components/AppProvider";
import { api } from "@/lib/api";
import { formatDay } from "@/lib/format";
import type { DailyCheckIn, PatientTimeline } from "@/lib/types";
import { cn } from "@/lib/utils";

function ChartCard({
  icon: Icon,
  title,
  children,
}: {
  icon: React.ElementType;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-xl border border-border bg-card p-4">
      <div className="mb-2 flex items-center gap-2 text-sm font-medium">
        <Icon className="size-4 text-primary" />
        {title}
      </div>
      {children}
    </div>
  );
}

function YesNo({ value, kind }: { value: boolean; kind: "symptom" | "med" }) {
  // symptom: "Yes" is the concerning state; med: "Missed" is the concerning state
  const concerning = kind === "symptom" ? value : !value;
  const label = kind === "med" ? (value ? "Taken" : "Missed") : value ? "Yes" : "No";
  return (
    <span
      className={cn(
        "inline-flex rounded-full px-2 py-0.5 text-[11px] font-medium",
        concerning ? "bg-red-50 text-red-700" : "bg-muted text-muted-foreground",
      )}
    >
      {label}
    </span>
  );
}

export function PatientDetail({
  patientId,
  initialTimeline,
}: {
  patientId: string;
  initialTimeline: PatientTimeline;
}) {
  const { refresh } = useApp();
  const [timeline, setTimeline] = useState<PatientTimeline>(initialTimeline);

  // Re-fetch this patient's timeline after a user action (check-in, caregiver
  // alert). Called from event handlers — never from an effect.
  const reload = useCallback(async () => {
    try {
      setTimeline(await api.timeline(patientId));
    } catch {
      /* keep the last good timeline */
    }
  }, [patientId]);

  const handleChanged = useCallback(async () => {
    await reload();
    await refresh();
  }, [reload, refresh]);

  const { patient, daily, checkins, risk, risk_trend } = timeline;

  const rows = (key: string): ChartRow[] =>
    daily.map((d) => ({ date: d.date, [key]: d[key as keyof typeof d] as number | null }));
  const bpRows: ChartRow[] = daily.map((d) => ({
    date: d.date,
    systolic: d.systolic,
    diastolic: d.diastolic,
  }));
  const trendRows: ChartRow[] = risk_trend.map((t) => ({ date: t.date, score: t.score }));
  const stepsThreshold = Math.round(patient.baseline_steps * 0.6);

  return (
    <div className="space-y-5">
      <Link
        href="/dashboard"
        className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        <ChevronLeft className="size-4" /> Back to dashboard
      </Link>

      {/* Header */}
      <div className="rounded-xl border border-border bg-card p-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-semibold tracking-tight">{patient.name}</h1>
              <RiskBadge severity={risk.severity} />
            </div>
            <p className="mt-1 text-sm text-muted-foreground">
              {patient.age} years · {patient.gender} · {patient.conditions.join(", ")}
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <CheckInSimulator patientId={patientId} onSubmitted={handleChanged} />
            <CsvImport patientId={patientId} onImported={handleChanged} />
            <AuditDrawer patientId={patientId} />
          </div>
        </div>

        <div className="mt-3 grid grid-cols-2 gap-3 text-sm sm:grid-cols-4">
          <Info icon={Stethoscope} label="Assigned nurse" value={patient.assigned_nurse} />
          <Info icon={Phone} label="Caregiver" value={`${patient.caregiver_name}`} sub={patient.caregiver_phone} />
          <Info icon={Home} label="Living" value={patient.living_status} />
          <Info icon={Languages} label="Language" value={patient.language} />
        </div>

        <SafetyLabels className="mt-3" />
      </div>

      {/* Charts + risk */}
      <div className="grid gap-4 lg:grid-cols-3">
        <div className="grid gap-4 sm:grid-cols-2 lg:col-span-2">
          <ChartCard icon={Scale} title="Weight (kg)">
            <TrendChart
              data={rows("weight")}
              series={[{ key: "weight", name: "Weight", color: "var(--chart-1)" }]}
              unit="kg"
              refLines={[{ y: patient.baseline_weight, label: "baseline" }]}
            />
          </ChartCard>
          <ChartCard icon={HeartPulse} title="Blood pressure (mmHg)">
            <TrendChart
              data={bpRows}
              series={[
                { key: "systolic", name: "Systolic", color: "var(--chart-2)" },
                { key: "diastolic", name: "Diastolic", color: "var(--chart-5)" },
              ]}
              unit="mmHg"
            />
          </ChartCard>
          <ChartCard icon={Activity} title="Heart rate (bpm)">
            <TrendChart
              data={rows("heart_rate")}
              series={[{ key: "heart_rate", name: "Heart rate", color: "var(--chart-4)" }]}
              unit="bpm"
            />
          </ChartCard>
          <ChartCard icon={Footprints} title="Activity (steps)">
            <TrendChart
              data={rows("steps")}
              series={[{ key: "steps", name: "Steps", color: "var(--chart-2)" }]}
              unit="steps"
              refLines={[
                { y: patient.baseline_steps, label: "baseline" },
                { y: stepsThreshold, label: "-40%", color: "var(--destructive)" },
              ]}
            />
          </ChartCard>
        </div>
        <div className="space-y-4">
          <RiskCard risk={risk} />
          {risk.severity !== "stable" && (
            <CaregiverAlert timeline={timeline} onNotified={handleChanged} />
          )}
        </div>
      </div>

      {/* Risk trend + check-in history */}
      <div className="grid gap-4 lg:grid-cols-3">
        <div className="lg:col-span-1">
          <ChartCard icon={Activity} title="Risk level over time">
            <TrendChart
              data={trendRows}
              series={[{ key: "score", name: "Risk", color: "var(--chart-3)" }]}
              domain={[0, 3]}
              step
              yTickFormatter={(v) => ["Stable", "Watch", "Review", "Escalate"][v] ?? ""}
            />
          </ChartCard>
        </div>
        <div className="lg:col-span-2">
          <div className="rounded-xl border border-border bg-card p-4">
            <h2 className="mb-2 text-sm font-medium">Daily check-in responses</h2>
            <CheckInTable checkins={checkins} />
          </div>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <WeeklySummaryPanel patientId={patientId} onChanged={handleChanged} />
        </div>
        <div className="lg:col-span-1">
          <FhirExportPanel patientId={patientId} />
        </div>
      </div>
    </div>
  );
}

function Info({
  icon: Icon,
  label,
  value,
  sub,
}: {
  icon: React.ElementType;
  label: string;
  value: string;
  sub?: string;
}) {
  return (
    <div className="rounded-lg border border-border bg-muted/30 px-3 py-2">
      <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
        <Icon className="size-3.5" />
        {label}
      </div>
      <div className="mt-0.5 font-medium">{value}</div>
      {sub && <div className="text-xs text-muted-foreground">{sub}</div>}
    </div>
  );
}

function CheckInTable({ checkins }: { checkins: DailyCheckIn[] }) {
  const ordered = [...checkins].sort((a, b) => b.date.localeCompare(a.date));
  return (
    <Table>
      <TableHeader>
        <TableRow className="bg-muted/40 hover:bg-muted/40">
          <TableHead>Date</TableHead>
          <TableHead>Mood</TableHead>
          <TableHead>Breathless</TableHead>
          <TableHead>Swelling</TableHead>
          <TableHead>Medication</TableHead>
          <TableHead>Note</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {ordered.map((c) => (
          <TableRow key={c.id}>
            <TableCell className="font-medium">{formatDay(c.date)}</TableCell>
            <TableCell className="text-muted-foreground">{c.mood || "—"}</TableCell>
            <TableCell>
              <YesNo value={c.shortness_of_breath} kind="symptom" />
            </TableCell>
            <TableCell>
              <YesNo value={c.swelling} kind="symptom" />
            </TableCell>
            <TableCell>
              <YesNo value={c.medication_taken} kind="med" />
            </TableCell>
            <TableCell className="max-w-[260px] whitespace-normal text-xs text-muted-foreground">
              {c.free_text_note || "—"}
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
