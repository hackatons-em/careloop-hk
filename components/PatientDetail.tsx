"use client";

import { useCallback, useState } from "react";
import Link from "next/link";
import {
  ChevronLeft,
  Scale,
  HeartPulse,
  Footprints,
  Pill,
  Activity,
  CheckCircle2,
  MessageCircle,
  MoreHorizontal,
  Pencil,
  Upload,
  History,
} from "lucide-react";
import { toast } from "sonner";
import { TrendChart, type ChartRow } from "@/components/charts/TrendChart";
import { RiskCard } from "@/components/RiskCard";
import { RiskBadge } from "@/components/RiskBadge";
import { AuditDrawer } from "@/components/AuditDrawer";
import { CsvImport } from "@/components/CsvImport";
import { CaregiverAlert } from "@/components/CaregiverAlert";
import { ConversationPanel } from "@/components/ConversationPanel";
import { WeeklySummaryPanel } from "@/components/WeeklySummaryPanel";
import { FhirExportPanel } from "@/components/FhirExportPanel";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useApp } from "@/components/AppProvider";
import { NeedsReviewBadge } from "@/components/NeedsReviewBadge";
import { api } from "@/lib/api";
import { formatDay } from "@/lib/format";
import type { DailyCheckIn, PatientTimeline } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function PatientDetail({
  patientId,
  initialTimeline,
}: {
  patientId: string;
  initialTimeline: PatientTimeline;
}) {
  const { refresh } = useApp();
  const [timeline, setTimeline] = useState<PatientTimeline>(initialTimeline);
  const [csvOpen, setCsvOpen] = useState(false);
  const [auditOpen, setAuditOpen] = useState(false);

  const reload = useCallback(async () => {
    try {
      setTimeline(await api.timeline(patientId));
    } catch {
      /* keep last good timeline */
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

  async function sendCheckin() {
    try {
      const res = await fetch("/api/agent/send-checkin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ patientId }),
      });
      const data = (await res.json().catch(() => ({}))) as { error?: string };
      if (!res.ok) throw new Error(data.error ?? "Failed to send");
      toast.success(`Daily check-in sent to ${patient.name}'s WhatsApp`);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not send check-in");
    }
  }

  return (
    <div className="flex flex-col gap-4 lg:h-[calc(100dvh-12rem)]">
      <Link
        href="/dashboard"
        className="inline-flex items-center gap-1 rounded-md text-sm text-muted-foreground outline-none hover:text-foreground focus-visible:text-foreground focus-visible:ring-2 focus-visible:ring-ring"
      >
        <ChevronLeft className="size-4" /> Back to dashboard
      </Link>

      {/* Pending review: auto-created from WhatsApp, awaiting nurse confirmation */}
      {patient.status === "pending_review" && (
        <div className="cl-rise flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-primary/20 bg-accent p-4">
          <div className="flex items-center gap-3">
            <NeedsReviewBadge />
            <p className="text-sm text-accent-foreground">
              Auto-created from a WhatsApp check-in — confirm this patient&apos;s details.
            </p>
          </div>
          <Link
            href={`/patients/${patientId}/edit`}
            className="inline-flex h-8 items-center gap-1.5 rounded-lg bg-primary px-3 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90"
          >
            <Pencil className="size-3.5" /> Review details
          </Link>
        </div>
      )}

      {/* Header */}
      <div className="cl-rise rounded-2xl border border-border bg-card p-5">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-semibold tracking-tight">{patient.name}</h1>
              <RiskBadge severity={risk.severity} />
            </div>
            <p className="mt-1 text-sm text-muted-foreground">
              {patient.age > 0 ? `${patient.age} years` : "Age unknown"}
              {patient.gender ? ` · ${patient.gender}` : ""}
              {patient.conditions.length > 0 ? ` · ${patient.conditions.join(", ")}` : ""}
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              Monitoring alert only. Not diagnosis or treatment advice.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Button variant="outline" size="sm" onClick={sendCheckin} className="gap-1.5">
              <MessageCircle className="size-4" /> Send check-in
            </Button>
            <Link
              href={`/patients/${patientId}/edit`}
              className="inline-flex h-7 items-center gap-1 rounded-[min(var(--radius-md),12px)] border border-border bg-background px-2.5 text-[0.8rem] font-medium outline-none transition-colors hover:bg-muted focus-visible:ring-2 focus-visible:ring-ring"
            >
              <Pencil className="size-3.5" /> Edit
            </Link>
            <DropdownMenu>
              <DropdownMenuTrigger
                render={
                  <Button variant="outline" size="icon-sm" aria-label="More actions" />
                }
              >
                <MoreHorizontal className="size-4" />
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                <DropdownMenuItem onClick={() => setCsvOpen(true)}>
                  <Upload /> Import CSV
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setAuditOpen(true)}>
                  <History /> Audit trail
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        <p className="mt-4 text-sm text-muted-foreground">
          Nurse <span className="font-medium text-foreground">{patient.assigned_nurse}</span>
          {patient.caregiver_name ? (
            <>
              {" · "}Caregiver{" "}
              <span className="font-medium text-foreground">{patient.caregiver_name}</span>
              {patient.caregiver_phone ? ` (${patient.caregiver_phone})` : ""}
            </>
          ) : null}
          {patient.living_status ? ` · ${patient.living_status}` : ""}
          {patient.language ? ` · ${patient.language}` : ""}
          {patient.phone ? ` · WhatsApp ${patient.phone}` : ""}
        </p>
      </div>

      {/* Dialogs opened from the More menu (kept mounted outside the menu) */}
      <CsvImport
        patientId={patientId}
        onImported={handleChanged}
        open={csvOpen}
        onOpenChange={setCsvOpen}
        hideTrigger
      />
      <AuditDrawer
        patientId={patientId}
        open={auditOpen}
        onOpenChange={setAuditOpen}
        hideTrigger
      />

      {/* Dashboard-style: fixed viewport, each column scrolls internally */}
      <div className="grid min-h-0 flex-1 gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(360px,420px)]">
        {/* LEFT: risk + detail tabs, scrolls internally */}
        <div className="min-h-0 space-y-4 overflow-y-auto pb-1 pr-0.5">
          {/* Why flagged */}
          <div className="cl-rise" style={{ animationDelay: "100ms" }}>
            <RiskCard risk={risk} />
          </div>

          {/* Secondary detail behind tabs */}
          <Tabs defaultValue="trends" className="cl-rise w-full">
        <TabsList>
          <TabsTrigger value="trends">Trends</TabsTrigger>
          <TabsTrigger value="checkins">Check-ins</TabsTrigger>
          <TabsTrigger value="export">Export &amp; audit</TabsTrigger>
        </TabsList>

        <TabsContent value="trends" className="cl-fade pt-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <ChartCard icon={Scale} title="Weight (kg)">
              <TrendChart
                data={rows("weight")}
                series={[{ key: "weight", name: "Weight", color: "var(--chart-1)" }]}
                unit="kg"
                refLines={[{ y: patient.baseline_weight, label: "baseline" }]}
                ariaLabel={`Weight trend chart for ${patient.name} over the monitored period, in kilograms`}
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
                ariaLabel={`Blood pressure trend chart for ${patient.name}: systolic and diastolic, in millimetres of mercury`}
              />
            </ChartCard>
          </div>

          <details className="group mt-4">
            <summary className="flex cursor-pointer list-none items-center gap-1.5 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground">
              <ChevronLeft className="size-4 -rotate-90 transition-transform group-open:-rotate-180" />
              More trends — activity, medication adherence, risk over time
            </summary>
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <ChartCard icon={Footprints} title="Activity (steps)">
                <TrendChart
                  data={rows("steps")}
                  series={[{ key: "steps", name: "Steps", color: "var(--chart-2)" }]}
                  unit="steps"
                  refLines={[
                    { y: patient.baseline_steps, label: "baseline" },
                    { y: stepsThreshold, label: "-40%", color: "var(--destructive)" },
                  ]}
                  ariaLabel={`Daily activity trend chart for ${patient.name}, in steps, with baseline and 40 percent drop threshold`}
                />
              </ChartCard>
              <AdherenceStrip checkins={checkins} />
              <div className="sm:col-span-2">
                <ChartCard icon={Activity} title="Risk level over time">
                  <TrendChart
                    data={trendRows}
                    series={[{ key: "score", name: "Risk", color: "var(--chart-3)" }]}
                    domain={[0, 3]}
                    step
                    yTickFormatter={(v) => ["Stable", "Watch", "Review", "Escalate"][v] ?? ""}
                    ariaLabel={`Risk level over time for ${patient.name}, from stable to escalate`}
                  />
                </ChartCard>
              </div>
            </div>
          </details>
        </TabsContent>

        <TabsContent value="checkins" className="cl-fade pt-4">
          <div className="rounded-2xl border border-border bg-card p-5">
            <h2 className="mb-2 text-sm font-medium">Daily check-in responses</h2>
            <div className="overflow-x-auto">
              <CheckInTable checkins={checkins} />
            </div>
          </div>
        </TabsContent>

        <TabsContent value="export" className="cl-fade pt-4">
          <div className="grid gap-4 lg:grid-cols-3">
            <div className="lg:col-span-2">
              <WeeklySummaryPanel patientId={patientId} onChanged={handleChanged} />
            </div>
            <div>
              <FhirExportPanel patientId={patientId} />
            </div>
          </div>
        </TabsContent>
          </Tabs>
        </div>

        {/* RIGHT: WhatsApp chat stays prominent (min height, fills, scrolls
            internally); the column scrolls so the caregiver alert never
            collides with or squeezes the chat. */}
        <aside className="flex min-h-0 flex-col gap-4 overflow-y-auto pb-1 pl-0.5">
          <ConversationPanel
            patientId={patientId}
            onActivity={handleChanged}
            className="min-h-[18rem] flex-1"
          />
          <div className="shrink-0">
            {risk.severity !== "stable" ? (
              <CaregiverAlert timeline={timeline} onNotified={handleChanged} />
            ) : (
              <div className="rounded-2xl border border-border bg-card p-5">
                <div className="flex items-center gap-2 font-semibold">
                  <CheckCircle2 className="size-4 text-green-600" /> No active alert
                </div>
                <p className="mt-1 text-sm text-muted-foreground">
                  Monitoring is within the expected range. Continue daily check-ins.
                </p>
              </div>
            )}
          </div>
        </aside>
      </div>
    </div>
  );
}

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
    <div className="rounded-2xl border border-border bg-card p-4">
      <div className="mb-2 flex items-center gap-2 text-sm font-medium">
        <Icon className="size-4 text-primary" />
        {title}
      </div>
      {children}
    </div>
  );
}

function AdherenceStrip({ checkins }: { checkins: DailyCheckIn[] }) {
  const ordered = [...checkins].sort((a, b) => a.date.localeCompare(b.date));
  const taken = ordered.filter((c) => c.medication_taken).length;
  return (
    <div className="rounded-2xl border border-border bg-card p-4">
      <div className="mb-2 flex items-center justify-between">
        <div className="flex items-center gap-2 text-sm font-medium">
          <Pill className="size-4 text-primary" />
          Medication adherence
        </div>
        <span className="text-xs text-muted-foreground">
          {taken}/{ordered.length} days
        </span>
      </div>
      <div className="flex gap-1.5">
        {ordered.map((c) => (
          <div key={c.id} className="flex-1">
            <div
              className={cn(
                "h-12 rounded-md",
                c.medication_taken ? "bg-green-100" : "bg-red-100",
              )}
              title={`${c.date}: ${c.medication_taken ? "taken" : "missed"}`}
            />
            <div className="mt-1 text-center text-[10px] text-muted-foreground">
              {formatDay(c.date).split(" ")[0]}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function YesNo({ value, kind }: { value: boolean; kind: "symptom" | "med" }) {
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
