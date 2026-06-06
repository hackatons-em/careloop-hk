// Risk color system (teammate-2 design rule):
//   Stable = green · Watch = blue · Review today = amber · Escalate = red

import type { AlertStatus, Severity } from "./types";

export interface SeverityStyle {
  label: string;
  /** badge classes (bg + text + border) */
  badge: string;
  /** subtle row / card tint */
  tint: string;
  /** solid dot */
  dot: string;
  /** hex for charts / inline styles */
  hex: string;
}

export const SEVERITY_STYLE: Record<Severity, SeverityStyle> = {
  stable: {
    label: "Stable",
    badge: "bg-emerald-50 text-emerald-700 border-emerald-200",
    tint: "bg-emerald-50/40",
    dot: "bg-emerald-500",
    hex: "#10b981",
  },
  watch: {
    label: "Watch",
    badge: "bg-sky-50 text-sky-700 border-sky-200",
    tint: "bg-sky-50/40",
    dot: "bg-sky-500",
    hex: "#0ea5e9",
  },
  review_today: {
    label: "Review today",
    badge: "bg-amber-50 text-amber-800 border-amber-200",
    tint: "bg-amber-50/50",
    dot: "bg-amber-500",
    hex: "#f59e0b",
  },
  escalate: {
    label: "Escalate",
    badge: "bg-red-50 text-red-700 border-red-200",
    tint: "bg-red-50/60",
    dot: "bg-red-500",
    hex: "#ef4444",
  },
};

export function severityStyle(s: Severity): SeverityStyle {
  return SEVERITY_STYLE[s];
}

export const REASON_TAG_STYLE: Record<string, string> = {
  "weight gain": "bg-orange-50 text-orange-700 border-orange-200",
  "symptoms reported": "bg-rose-50 text-rose-700 border-rose-200",
  "missed meds": "bg-violet-50 text-violet-700 border-violet-200",
  "high BP": "bg-red-50 text-red-700 border-red-200",
  "low activity": "bg-sky-50 text-sky-700 border-sky-200",
};

export const ALERT_STATUS_STYLE: Record<AlertStatus, string> = {
  new: "bg-red-50 text-red-700 border-red-200",
  acknowledged: "bg-amber-50 text-amber-800 border-amber-200",
  family_contacted: "bg-sky-50 text-sky-700 border-sky-200",
  clinician_review_requested: "bg-violet-50 text-violet-700 border-violet-200",
  resolved: "bg-emerald-50 text-emerald-700 border-emerald-200",
};
