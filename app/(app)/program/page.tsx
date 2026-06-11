import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { BarChart3, CheckCircle2, Clock3, FileDown, Pill, Users } from "lucide-react";
import { RiskBadge } from "@/components/RiskBadge";
import { requireAuthOrRedirect } from "@/lib/auth";
import { getProgramMetrics } from "@/lib/store";
import type { Severity } from "@/lib/types";
import { cn } from "@/lib/utils";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("program");
  return { title: t("metaTitle") };
}

export const dynamic = "force-dynamic";

const TARGET_COMPLETION = 0.7; // the pilot-agreement commitment

function pct(x: number): string {
  return `${Math.round(x * 100)}%`;
}

function minutes(m: number | null): string {
  if (m === null) return "—";
  if (m < 60) return `${m} min`;
  return `${Math.round((m / 60) * 10) / 10} h`;
}

/**
 * Program outcomes: the renewal/ROI page. Every number is computed by
 * getProgramMetrics from recorded data only — no projections, no estimates.
 */
export default async function ProgramPage() {
  const ctx = await requireAuthOrRedirect("admin");
  const t = await getTranslations("program");
  const m = await getProgramMetrics(ctx.orgId, 30);

  const completionOnTarget = m.checkin_completion_rate >= TARGET_COMPLETION;
  const maxDay = Math.max(1, ...m.daily_checkins.map((d) => d.count));
  const totalCheckins = m.daily_checkins.reduce((acc, d) => acc + d.count, 0);
  const peak = m.daily_checkins.reduce(
    (best, d) => (d.count > best.count ? d : best),
    { date: "—", count: 0 },
  );
  const severities: Severity[] = ["watch", "review_today", "escalate"];

  return (
    <div className="mx-auto max-w-4xl space-y-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-semibold tracking-tight">
            <BarChart3 className="size-6 text-primary" /> {t("title")}
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">{t("sub", { days: m.window_days })}</p>
        </div>
        <a
          href="/api/program/pdf"
          className="inline-flex h-10 items-center gap-2 rounded-lg border border-border bg-card px-4 text-sm font-semibold outline-none hover:bg-muted focus-visible:ring-2 focus-visible:ring-ring"
        >
          <FileDown className="size-4" /> {t("downloadPdf")}
        </a>
      </div>

      {/* headline numbers */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Metric
          icon={CheckCircle2}
          label={t("completion")}
          value={pct(m.checkin_completion_rate)}
          sub={completionOnTarget ? t("completionOnTarget") : t("completionBelowTarget")}
          emphasize={completionOnTarget}
        />
        <Metric icon={Pill} label={t("adherence")} value={pct(m.adherence_rate)} sub={t("adherenceSub")} />
        <Metric
          icon={Clock3}
          label={t("timeToAck")}
          value={minutes(m.ack_minutes.median)}
          sub={t("timeToAckSub", { p90: minutes(m.ack_minutes.p90), n: m.ack_minutes.samples })}
        />
        <Metric icon={Users} label={t("activePatients")} value={String(m.active_patients)} sub={t("silentNow", { count: m.silent_patients })} />
      </div>

      {/* daily check-ins sparkline */}
      <section className="rounded-2xl border border-border bg-card p-5">
        <h2 className="text-sm font-semibold">{t("dailyCheckins")}</h2>
        <div
          className="mt-4 flex h-24 items-end gap-[3px]"
          role="img"
          aria-label={t("dailyCheckinsSummary", {
            total: totalCheckins,
            days: m.window_days,
            peakCount: peak.count,
            peakDate: peak.date,
          })}
        >
          {m.daily_checkins.map((d) => (
            <div
              key={d.date}
              title={`${d.date}: ${d.count}`}
              className="flex-1 rounded-t-sm bg-primary/70"
              style={{ height: `${Math.max(3, (d.count / maxDay) * 100)}%`, opacity: d.count === 0 ? 0.15 : 1 }}
            />
          ))}
        </div>
        <p className="mt-2 text-xs text-muted-foreground">
          {t("dailyCheckinsRange", {
            from: m.daily_checkins[0]?.date ?? "—",
            to: m.daily_checkins[m.daily_checkins.length - 1]?.date ?? "—",
          })}
        </p>
      </section>

      <div className="grid gap-5 lg:grid-cols-2">
        {/* alerts by severity */}
        <section className="rounded-2xl border border-border bg-card p-5">
          <h2 className="text-sm font-semibold">{t("alertVolume")}</h2>
          <ul className="mt-3 space-y-2.5">
            {severities.map((s) => {
              const count = m.alerts_by_severity[s] ?? 0;
              const total = severities.reduce((acc, x) => acc + (m.alerts_by_severity[x] ?? 0), 0);
              return (
                <li key={s} className="flex items-center gap-3">
                  <RiskBadge severity={s} className="w-32 shrink-0 justify-center" />
                  <div className="h-2 flex-1 overflow-hidden rounded-full bg-muted">
                    <div
                      className="h-full rounded-full bg-foreground/50"
                      style={{ width: total > 0 ? `${(count / total) * 100}%` : "0%" }}
                    />
                  </div>
                  <span className="w-8 text-right text-sm font-semibold">{count}</span>
                </li>
              );
            })}
          </ul>
          <p className="mt-3 text-xs text-muted-foreground">
            {t("slaBreaches", { count: m.sla_breaches_in_window })}
          </p>
        </section>

        {/* per-nurse load */}
        <section className="rounded-2xl border border-border bg-card p-5">
          <h2 className="text-sm font-semibold">{t("nurseLoad")}</h2>
          {Object.keys(m.open_alerts_by_nurse).length === 0 ? (
            <p className="mt-3 text-sm text-muted-foreground">{t("noOpenAlerts")}</p>
          ) : (
            <ul className="mt-3 space-y-2 text-sm">
              {Object.entries(m.open_alerts_by_nurse)
                .sort(([, a], [, b]) => b - a)
                .map(([nurse, count]) => (
                  <li key={nurse} className="flex items-center justify-between gap-3">
                    <span className="font-medium">{nurse}</span>
                    <span className="rounded-full bg-muted px-2.5 py-0.5 text-xs font-semibold">
                      {t("openCount", { count })}
                    </span>
                  </li>
                ))}
            </ul>
          )}
        </section>
      </div>

      <p className="rounded-lg bg-muted/40 px-3 py-2 text-xs text-muted-foreground">{t("note")}</p>
    </div>
  );
}

function Metric({
  icon: Icon,
  label,
  value,
  sub,
  emphasize,
}: {
  icon: React.ElementType;
  label: string;
  value: string;
  sub: string;
  emphasize?: boolean;
}) {
  return (
    <div className="rounded-2xl border border-border bg-card p-4">
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium text-muted-foreground">{label}</span>
        <Icon className="size-4 text-muted-foreground" />
      </div>
      <div className={cn("mt-2 text-3xl font-semibold tracking-tight", emphasize && "text-primary")}>
        {value}
      </div>
      <p className="mt-1 text-xs text-muted-foreground">{sub}</p>
    </div>
  );
}
