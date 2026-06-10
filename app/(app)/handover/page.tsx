import type { Metadata } from "next";
import Link from "next/link";
import { getFormatter, getTranslations } from "next-intl/server";
import { ArrowLeft, ClipboardList } from "lucide-react";
import { PrintButton } from "@/components/PrintButton";
import { AlertStatusBadge, RiskBadge } from "@/components/RiskBadge";
import { requireAuthOrRedirect } from "@/lib/auth";
import { todayISO } from "@/lib/dates";
import { buildHandover } from "@/lib/store";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("handover");
  return { title: t("metaTitle") };
}

export const dynamic = "force-dynamic";

/**
 * Shift handover: a deterministic, print-friendly ward-state snapshot the
 * outgoing nurse hands to the incoming shift. Every generation (and the
 * optional outgoing note) is recorded in the audit trail.
 */
export default async function HandoverPage({
  searchParams,
}: {
  searchParams: Promise<{ note?: string }>;
}) {
  const ctx = await requireAuthOrRedirect();
  const { note } = await searchParams;
  const t = await getTranslations("handover");
  const format = await getFormatter();

  // Window start: today 08:00 local — the morning round.
  const since = `${todayISO()}T08:00:00+08:00`;
  const snapshot = await buildHandover(ctx.orgId, since, ctx.email, note);

  const generated = format.dateTime(new Date(snapshot.generated_at), {
    dateStyle: "medium",
    timeStyle: "short",
  });

  return (
    <div className="mx-auto max-w-3xl space-y-5">
      <div className="flex flex-wrap items-start justify-between gap-3 print:hidden">
        <div>
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="size-3.5" /> {t("back")}
          </Link>
          <h1 className="mt-1 flex items-center gap-2 text-2xl font-semibold tracking-tight">
            <ClipboardList className="size-6 text-primary" /> {t("title")}
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">{t("sub")}</p>
        </div>
        <PrintButton label={t("print")} />
      </div>

      {/* print header */}
      <div className="hidden print:block">
        <h1 className="text-xl font-semibold">{t("title")} — CareLoop</h1>
      </div>

      <div className="rounded-2xl border border-border bg-card p-5 print:border-0 print:p-0">
        <div className="grid grid-cols-2 gap-3 text-sm sm:grid-cols-4">
          <Meta label={t("generatedAt")} value={generated} />
          <Meta label={t("activePatients")} value={String(snapshot.active_patients)} />
          <Meta label={t("checkinsToday")} value={String(snapshot.checkins_today)} />
          <Meta label={t("openAlertsCount")} value={String(snapshot.open_alerts.length)} />
        </div>
        {note && (
          <p className="mt-4 rounded-lg bg-accent px-3 py-2 text-sm">
            <span className="font-semibold">{t("noteLabel")}:</span> {note}
          </p>
        )}
      </div>

      <Section title={t("newEscalations")} empty={t("noneNew")}>
        {snapshot.new_escalations.map(({ alert, patient_name }) => (
          <div key={alert.id} className="flex items-start justify-between gap-3 px-4 py-3">
            <div className="min-w-0">
              <p className="text-sm font-semibold">{patient_name}</p>
              <p className="mt-0.5 text-xs text-muted-foreground">{alert.reason}</p>
            </div>
            <RiskBadge severity={alert.severity} className="shrink-0" />
          </div>
        ))}
      </Section>

      <Section title={t("openAlerts")} empty={t("noneOpen")}>
        {snapshot.open_alerts.map(({ alert, patient_name }) => (
          <div key={alert.id} className="flex items-start justify-between gap-3 px-4 py-3">
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <p className="text-sm font-semibold">{patient_name}</p>
                <AlertStatusBadge status={alert.status} />
              </div>
              <p className="mt-0.5 text-xs text-muted-foreground">
                {alert.matched_rules.join(", ")} · {t("assignedTo")} {alert.assigned_to}
                {alert.nurse_note ? ` · ${t("noteLabel")}: ${alert.nurse_note}` : ""}
              </p>
            </div>
            <RiskBadge severity={alert.severity} className="shrink-0" />
          </div>
        ))}
      </Section>

      <Section title={t("silentPatients")} empty={t("noneSilent")}>
        {snapshot.silent_patients.map((p) => (
          <div key={p.id} className="flex items-center justify-between gap-3 px-4 py-3">
            <p className="text-sm font-semibold">{p.name}</p>
            <p className="text-xs text-muted-foreground">
              {t("lastCheckin")}: {p.last_checkin_date ?? "—"}
            </p>
          </div>
        ))}
      </Section>

      <Section title={t("openTasks")} empty={t("noneTasks")}>
        {snapshot.open_tasks.map(({ task, patient_name }) => (
          <div key={task.id} className="flex items-start justify-between gap-3 px-4 py-3">
            <div className="min-w-0">
              <p className="text-sm font-semibold">{patient_name}</p>
              <p className="mt-0.5 text-xs text-muted-foreground">{task.description}</p>
            </div>
            <p className="shrink-0 text-xs text-muted-foreground">
              {format.dateTime(new Date(task.due_at), { dateStyle: "short", timeStyle: "short" })}
              {task.assigned_to ? ` · ${task.assigned_to}` : ""}
            </p>
          </div>
        ))}
      </Section>

      {/* outgoing-nurse note: lands in the audit trail on regenerate */}
      <form method="get" className="rounded-2xl border border-border bg-card p-5 print:hidden">
        <label htmlFor="handover-note" className="text-sm font-semibold">
          {t("noteTitle")}
        </label>
        <p className="mt-0.5 text-xs text-muted-foreground">{t("noteHint")}</p>
        <div className="mt-3 flex gap-2">
          <input
            id="handover-note"
            name="note"
            defaultValue={note ?? ""}
            maxLength={500}
            className="h-10 w-full rounded-lg border border-border bg-background px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
            placeholder={t("notePlaceholder")}
          />
          <button
            type="submit"
            className="h-10 shrink-0 rounded-lg bg-primary px-4 text-sm font-semibold text-primary-foreground hover:bg-primary/90"
          >
            {t("noteSave")}
          </button>
        </div>
      </form>
    </div>
  );
}

function Meta({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="font-semibold">{value}</p>
    </div>
  );
}

function Section({
  title,
  empty,
  children,
}: {
  title: string;
  empty: string;
  children: React.ReactNode;
}) {
  const items = Array.isArray(children) ? children : children ? [children] : [];
  const hasItems = Array.isArray(children) ? children.length > 0 : Boolean(children);
  return (
    <section className="rounded-2xl border border-border bg-card p-5 print:break-inside-avoid print:border-0 print:p-0">
      <h2 className="text-sm font-semibold">{title}</h2>
      {hasItems ? (
        <div className="mt-3 divide-y divide-border rounded-xl border border-border">{items}</div>
      ) : (
        <p className="mt-3 text-sm text-muted-foreground">{empty}</p>
      )}
    </section>
  );
}

