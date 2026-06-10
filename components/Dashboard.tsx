"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import {
  Users,
  AlertTriangle,
  Eye,
  ClipboardCheck,
  ChevronRight,
  ArrowRight,
  ClipboardList,
  Download,
  Search,
} from "lucide-react";
import { useApp } from "@/components/AppProvider";
import { NeedsReviewBadge } from "@/components/NeedsReviewBadge";
import { ReasonTags, RiskBadge } from "@/components/RiskBadge";
import { TasksLane } from "@/components/TasksLane";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { SEVERITY_ORDER, type PatientRow, type Severity } from "@/lib/types";
import { severityStyle } from "@/lib/severity";
import { useFormat } from "@/lib/useFormat";
import { cn } from "@/lib/utils";

type Filter = "all" | Severity | "needs_review";

const FILTER_KEYS: Filter[] = ["all", "stable", "watch", "review_today", "escalate", "needs_review"];
const PAGE_SIZE = 50;

function ageLabel(age: number): string {
  return age > 0 ? String(age) : "—";
}

/** Client-side CSV of the current (filtered) worklist — ward-scale export. */
function exportCsv(rows: PatientRow[]) {
  // Quote + neutralize spreadsheet formula injection (=, +, -, @ prefixes).
  const esc = (v: string | number | null) => {
    let s = String(v ?? "");
    if (/^[=+\-@]/.test(s)) s = `'${s}`;
    return `"${s.replace(/"/g, '""')}"`;
  };
  const header = ["name", "age", "conditions", "severity", "reasons", "last_checkin", "assigned_nurse"];
  const lines = [
    header.join(","),
    ...rows.map((r) =>
      [
        esc(r.patient.name),
        esc(r.patient.age || ""),
        esc(r.patient.conditions.join("; ")),
        esc(r.risk.severity),
        esc(r.risk.reason_tags.join("; ")),
        esc(r.last_checkin_date),
        esc(r.patient.assigned_nurse),
      ].join(","),
    ),
  ];
  const blob = new Blob(["﻿" + lines.join("\r\n")], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `careloop-worklist-${new Date().toISOString().slice(0, 10)}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

export function Dashboard() {
  const t = useTranslations("dashboard");
  const ts = useTranslations("domain.severity");
  const { formatDay } = useFormat();
  const { rows } = useApp();
  const router = useRouter();
  const [filter, setFilterState] = useState<Filter>("all");
  const [query, setQueryState] = useState("");
  const [page, setPage] = useState(0);

  // Any filter/search change resets to the first page.
  const setFilter = (f: Filter) => {
    setFilterState(f);
    setPage(0);
  };
  const setQuery = (q: string) => {
    setQueryState(q);
    setPage(0);
  };

  const filterLabel = (f: Filter): string => {
    if (f === "all") return t("filters.all");
    if (f === "needs_review") return t("filters.needsReview");
    return ts(f);
  };

  const sortedAll = useMemo(
    () =>
      [...rows].sort((a, b) => {
        const d = SEVERITY_ORDER[b.risk.severity] - SEVERITY_ORDER[a.risk.severity];
        return d !== 0 ? d : a.patient.name.localeCompare(b.patient.name);
      }),
    [rows],
  );

  const stats = useMemo(() => {
    const escalate = rows.filter((r) => r.risk.severity === "escalate").length;
    const watchReview = rows.filter(
      (r) => r.risk.severity === "watch" || r.risk.severity === "review_today",
    ).length;
    const dates = (rows.map((r) => r.last_checkin_date).filter(Boolean) as string[]).sort();
    const latest = dates[dates.length - 1] ?? null;
    const checkinsToday = latest ? rows.filter((r) => r.last_checkin_date === latest).length : 0;
    return { monitored: rows.length, escalate, watchReview, checkinsToday };
  }, [rows]);

  const q = query.trim().toLowerCase();
  const matchesQuery = (r: PatientRow): boolean =>
    !q ||
    r.patient.name.toLowerCase().includes(q) ||
    (r.patient.phone ?? "").includes(q) ||
    r.patient.conditions.some((c) => c.toLowerCase().includes(q)) ||
    r.patient.assigned_nurse.toLowerCase().includes(q);

  // Chip counts are computed over the SEARCH-matched set (filter-independent),
  // so they always agree with the visible worklist while a search is active.
  const counts = useMemo(() => {
    const c: Record<string, number> = {
      all: 0,
      stable: 0,
      watch: 0,
      review_today: 0,
      escalate: 0,
      needs_review: 0,
    };
    for (const r of sortedAll) {
      if (!matchesQuery(r)) continue;
      c.all++;
      c[r.risk.severity]++;
      if (r.patient.status === "pending_review") c.needs_review++;
    }
    return c;
    // matchesQuery is derived from q; recompute when rows or the query change.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sortedAll, q]);

  const focus = sortedAll.find((r) => r.risk.severity !== "stable") ?? null;
  const filtered =
    filter === "all"
      ? sortedAll
      : filter === "needs_review"
        ? sortedAll.filter((r) => r.patient.status === "pending_review")
        : sortedAll.filter((r) => r.risk.severity === filter);
  const searched = q ? filtered.filter(matchesQuery) : filtered;
  const pageCount = Math.max(1, Math.ceil(searched.length / PAGE_SIZE));
  const safePage = Math.min(page, pageCount - 1);
  const visible = searched.slice(safePage * PAGE_SIZE, (safePage + 1) * PAGE_SIZE);

  return (
    <div className="space-y-5">
      {/* summary row */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Stat icon={Users} label={t("stats.monitored")} value={stats.monitored} delayMs={0} />
        <Stat
          icon={AlertTriangle}
          label={t("stats.escalate")}
          value={stats.escalate}
          tone="escalate"
          delayMs={60}
        />
        <Stat
          icon={Eye}
          label={t("stats.watchReview")}
          value={stats.watchReview}
          tone="watch"
          delayMs={120}
        />
        <Stat
          icon={ClipboardCheck}
          label={t("stats.checkinsToday")}
          value={stats.checkinsToday}
          delayMs={180}
        />
      </div>

      {/* focused high-risk patient */}
      {focus && <FocusedCard row={focus} />}

      {/* follow-up tasks due */}
      <TasksLane />

      {/* search + worklist actions */}
      <div className="flex flex-wrap items-center gap-2">
        <div className="relative min-w-[220px] flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={t("searchPlaceholder")}
            aria-label={t("searchPlaceholder")}
            className="pl-9"
          />
        </div>
        <button
          type="button"
          onClick={() => exportCsv(searched)}
          className="inline-flex h-10 items-center gap-1.5 rounded-lg border border-border bg-card px-3.5 text-sm font-medium outline-none hover:bg-muted focus-visible:ring-2 focus-visible:ring-ring"
        >
          <Download className="size-4" /> {t("exportCsv")}
        </button>
        <Link
          href="/handover"
          // No prefetch: rendering /handover records a handover_generated
          // audit event — only deliberate visits should do that.
          prefetch={false}
          className="inline-flex h-10 items-center gap-1.5 rounded-lg border border-border bg-card px-3.5 text-sm font-medium outline-none hover:bg-muted focus-visible:ring-2 focus-visible:ring-ring"
        >
          <ClipboardList className="size-4" /> {t("handover")}
        </Link>
      </div>

      {/* filter segmented control */}
      <div className="flex flex-wrap gap-1.5">
        {FILTER_KEYS.map((f) => {
          const active = filter === f;
          const accent =
            f === "all"
              ? "bg-foreground"
              : f === "needs_review"
                ? "bg-primary"
                : severityStyle(f as Severity).dot;
          // Hide the needs-review chip entirely when nothing is pending.
          if (f === "needs_review" && counts.needs_review === 0 && !active) return null;
          return (
            <button
              key={f}
              onClick={() => setFilter(f)}
              aria-pressed={active}
              className={cn(
                "inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-sm font-medium outline-none transition-colors focus-visible:ring-2 focus-visible:ring-ring",
                active
                  ? "border-primary bg-primary/10 text-foreground"
                  : "border-border bg-card text-muted-foreground hover:bg-muted",
              )}
            >
              {f !== "all" && <span className={cn("size-1.5 rounded-full", accent)} />}
              {filterLabel(f)}
              <span
                className={cn(
                  "rounded-full px-1.5 text-xs",
                  active ? "bg-primary/15 text-foreground" : "bg-muted text-muted-foreground",
                )}
              >
                {counts[f]}
              </span>
            </button>
          );
        })}
      </div>

      {/* desktop table */}
      <div
        className="cl-rise hidden overflow-hidden rounded-2xl border border-border bg-card md:block"
        style={{ animationDelay: "270ms" }}
      >
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/40 hover:bg-muted/40">
              <TableHead>{t("table.patient")}</TableHead>
              <TableHead>{t("table.lastCheckin")}</TableHead>
              <TableHead>{t("table.risk")}</TableHead>
              <TableHead>{t("table.reason")}</TableHead>
              <TableHead>{t("table.nextAction")}</TableHead>
              <TableHead className="w-8" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {visible.length === 0 && (
              <TableRow>
                <TableCell colSpan={6} className="py-10 text-center text-muted-foreground">
                  {t("table.empty")}
                </TableCell>
              </TableRow>
            )}
            {visible.map((row) => (
              <TableRow
                key={row.patient.id}
                onClick={() => router.push(`/patients/${row.patient.id}`)}
                className="cursor-pointer hover:bg-muted/40"
              >
                <TableCell>
                  <div className="flex items-center gap-2">
                    <Link
                      href={`/patients/${row.patient.id}`}
                      onClick={(e) => e.stopPropagation()}
                      className="font-medium text-foreground outline-none hover:text-primary hover:underline focus-visible:text-primary focus-visible:underline"
                    >
                      {row.patient.name}
                    </Link>
                    {row.patient.status === "pending_review" && <NeedsReviewBadge />}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {ageLabel(row.patient.age)} ·{" "}
                    {row.patient.conditions[0] ?? row.patient.gender ?? "—"}
                  </div>
                </TableCell>
                <TableCell className="text-muted-foreground">
                  {formatDay(row.last_checkin_date)}
                </TableCell>
                <TableCell>
                  <RiskBadge severity={row.risk.severity} />
                </TableCell>
                <TableCell className="max-w-[200px] whitespace-normal">
                  <ReasonTags tags={row.risk.reason_tags} max={2} />
                </TableCell>
                <TableCell className="text-foreground">
                  {t(`nextAction.${row.risk.severity}`)}
                </TableCell>
                <TableCell>
                  <ChevronRight aria-hidden className="size-4 text-muted-foreground" />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* mobile card list */}
      <div className="cl-rise space-y-3 md:hidden" style={{ animationDelay: "270ms" }}>
        {visible.length === 0 && (
          <div className="rounded-2xl border border-border bg-card py-10 text-center text-sm text-muted-foreground">
            {t("table.empty")}
          </div>
        )}
        {visible.map((row) => (
          <Link
            key={row.patient.id}
            href={`/patients/${row.patient.id}`}
            className="cl-card block rounded-2xl border border-border bg-card p-4"
          >
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <span className="font-medium">{row.patient.name}</span>
                {row.patient.status === "pending_review" && <NeedsReviewBadge />}
              </div>
              <RiskBadge severity={row.risk.severity} />
            </div>
            <p className="mt-1 text-xs text-muted-foreground">
              {ageLabel(row.patient.age)} ·{" "}
              {row.patient.conditions[0] ?? row.patient.gender ?? "—"} ·{" "}
              {t("table.lastCheckinShort")} {formatDay(row.last_checkin_date)}
            </p>
            <div className="mt-2 flex items-center justify-between gap-2">
              <ReasonTags tags={row.risk.reason_tags} max={2} />
              <span className="shrink-0 text-xs font-medium text-foreground">
                {t(`nextAction.${row.risk.severity}`)}
              </span>
            </div>
          </Link>
        ))}
      </div>

      {/* pager — only when the worklist exceeds one page */}
      {pageCount > 1 && (
        <div className="flex items-center justify-between gap-3">
          <p className="text-xs text-muted-foreground">
            {t("pageInfo", {
              from: safePage * PAGE_SIZE + 1,
              to: Math.min((safePage + 1) * PAGE_SIZE, searched.length),
              total: searched.length,
            })}
          </p>
          <div className="flex gap-1.5">
            <button
              type="button"
              disabled={safePage === 0}
              onClick={() => setPage(safePage - 1)}
              className="h-9 rounded-lg border border-border bg-card px-3 text-sm font-medium outline-none hover:bg-muted focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-40"
            >
              {t("prevPage")}
            </button>
            <button
              type="button"
              disabled={safePage >= pageCount - 1}
              onClick={() => setPage(safePage + 1)}
              className="h-9 rounded-lg border border-border bg-card px-3 text-sm font-medium outline-none hover:bg-muted focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-40"
            >
              {t("nextPage")}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function Stat({
  icon: Icon,
  label,
  value,
  tone,
  delayMs = 0,
}: {
  icon: React.ElementType;
  label: string;
  value: number;
  tone?: "escalate" | "watch";
  delayMs?: number;
}) {
  const toneCls =
    tone === "escalate" ? "text-red-600" : tone === "watch" ? "text-blue-600" : "text-foreground";
  return (
    <div
      className="cl-rise cl-card rounded-2xl border border-border bg-card p-4"
      style={{ animationDelay: `${delayMs}ms` }}
    >
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium text-muted-foreground">{label}</span>
        <Icon className={cn("size-4", tone ? toneCls : "text-muted-foreground")} />
      </div>
      <div className={cn("mt-2 text-3xl font-semibold tracking-tight", toneCls)}>{value}</div>
    </div>
  );
}

function FocusedCard({ row }: { row: PatientRow }) {
  const t = useTranslations("dashboard.focused");
  const s = severityStyle(row.risk.severity);
  return (
    <div
      className={cn("cl-rise rounded-2xl border border-border bg-card p-5", s.tint)}
      style={{ animationDelay: "210ms" }}
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
            <span className={cn("size-1.5 rounded-full", s.dot)} />
            {t("highestPriority")}
          </div>
          <h2 className="mt-1 text-xl font-semibold tracking-tight">{row.patient.name}</h2>
          <p className="text-sm text-muted-foreground">
            {ageLabel(row.patient.age)} · {row.patient.conditions.join(", ")}
          </p>
        </div>
        <RiskBadge severity={row.risk.severity} />
      </div>

      <ul className="mt-3 space-y-1.5 text-sm">
        {row.risk.matched_rules.slice(0, 4).map((m) => (
          <li key={m.code} className="flex gap-2 text-foreground/90">
            <span className="mt-2 size-1 shrink-0 rounded-full bg-muted-foreground/60" />
            {m.evidence}
          </li>
        ))}
      </ul>

      <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
        <span className="text-sm text-muted-foreground">
          {t("assignedTo")}{" "}
          <span className="font-medium text-foreground">{row.patient.assigned_nurse}</span>
        </span>
        <Link
          href={`/patients/${row.patient.id}`}
          className="inline-flex h-9 items-center gap-1.5 rounded-lg bg-primary px-4 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90"
        >
          {t("openPatient")} <ArrowRight className="size-4" />
        </Link>
      </div>
    </div>
  );
}
