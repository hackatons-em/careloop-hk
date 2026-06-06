"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ChevronRight } from "lucide-react";
import { useApp } from "@/components/AppProvider";
import { AlertStatusBadge, ReasonTags, RiskBadge } from "@/components/RiskBadge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { SEVERITY_ORDER, type Severity } from "@/lib/types";
import { severityStyle } from "@/lib/severity";
import { formatDay } from "@/lib/format";
import { cn } from "@/lib/utils";

type Filter = "all" | Severity;

const FILTERS: { key: Filter; label: string }[] = [
  { key: "all", label: "All" },
  { key: "stable", label: "Stable" },
  { key: "watch", label: "Watch" },
  { key: "review_today", label: "Review today" },
  { key: "escalate", label: "Escalate" },
];

export function Dashboard() {
  const { rows } = useApp();
  const router = useRouter();
  const [filter, setFilter] = useState<Filter>("all");

  const counts = useMemo(() => {
    const c: Record<string, number> = { all: rows.length, stable: 0, watch: 0, review_today: 0, escalate: 0 };
    for (const r of rows) c[r.risk.severity]++;
    return c;
  }, [rows]);

  const visible = useMemo(() => {
    const filtered = filter === "all" ? rows : rows.filter((r) => r.risk.severity === filter);
    return [...filtered].sort((a, b) => {
      const d = SEVERITY_ORDER[b.risk.severity] - SEVERITY_ORDER[a.risk.severity];
      return d !== 0 ? d : a.patient.name.localeCompare(b.patient.name);
    });
  }, [rows, filter]);

  return (
    <div className="space-y-4">
      {/* filter segmented control */}
      <div className="flex flex-wrap gap-1.5">
        {FILTERS.map((f) => {
          const active = filter === f.key;
          const accent =
            f.key !== "all" ? severityStyle(f.key as Severity).dot : "bg-foreground";
          return (
            <button
              key={f.key}
              onClick={() => setFilter(f.key)}
              aria-pressed={active}
              className={cn(
                "inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-sm font-medium transition-colors",
                active
                  ? "border-primary bg-primary/10 text-foreground"
                  : "border-border bg-card text-muted-foreground hover:bg-muted",
              )}
            >
              {f.key !== "all" && <span className={cn("size-1.5 rounded-full", accent)} />}
              {f.label}
              <span
                className={cn(
                  "rounded-full px-1.5 text-xs",
                  active ? "bg-primary/15 text-foreground" : "bg-muted text-muted-foreground",
                )}
              >
                {counts[f.key]}
              </span>
            </button>
          );
        })}
      </div>

      <div className="overflow-hidden rounded-xl border border-border bg-card">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/40 hover:bg-muted/40">
              <TableHead>Patient</TableHead>
              <TableHead>Condition</TableHead>
              <TableHead>Last check-in</TableHead>
              <TableHead>Risk</TableHead>
              <TableHead>Top reason</TableHead>
              <TableHead>Nurse</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="w-8" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {visible.length === 0 && (
              <TableRow>
                <TableCell colSpan={8} className="py-10 text-center text-muted-foreground">
                  No patients in this view.
                </TableCell>
              </TableRow>
            )}
            {visible.map((row) => (
              <TableRow
                key={row.patient.id}
                onClick={() => router.push(`/patients/${row.patient.id}`)}
                className={cn("cursor-pointer", severityStyle(row.risk.severity).tint)}
              >
                <TableCell>
                  <Link
                    href={`/patients/${row.patient.id}`}
                    onClick={(e) => e.stopPropagation()}
                    className="font-medium text-foreground outline-none hover:text-primary hover:underline focus-visible:text-primary focus-visible:underline"
                  >
                    {row.patient.name}
                  </Link>
                  <div className="text-xs text-muted-foreground">
                    {row.patient.age} · {row.patient.gender} · {row.patient.living_status}
                  </div>
                </TableCell>
                <TableCell className="max-w-[180px] whitespace-normal text-muted-foreground">
                  {row.patient.conditions.join(", ")}
                </TableCell>
                <TableCell className="text-muted-foreground">
                  {formatDay(row.last_checkin_date)}
                </TableCell>
                <TableCell>
                  <RiskBadge severity={row.risk.severity} />
                </TableCell>
                <TableCell className="max-w-[220px] whitespace-normal">
                  <ReasonTags tags={row.risk.reason_tags} />
                </TableCell>
                <TableCell className="text-muted-foreground">{row.patient.assigned_nurse}</TableCell>
                <TableCell>
                  {row.alert_status ? (
                    <AlertStatusBadge status={row.alert_status} />
                  ) : (
                    <span className="text-xs text-muted-foreground">—</span>
                  )}
                </TableCell>
                <TableCell>
                  <ChevronRight className="size-4 text-muted-foreground" />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
