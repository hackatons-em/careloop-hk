import { ALERT_STATUS_LABEL, type AlertStatus, type Severity } from "@/lib/types";
import { ALERT_STATUS_STYLE, REASON_TAG_STYLE, severityStyle } from "@/lib/severity";
import { cn } from "@/lib/utils";

export function RiskBadge({ severity, className }: { severity: Severity; className?: string }) {
  const s = severityStyle(severity);
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-semibold",
        s.badge,
        className,
      )}
    >
      <span className={cn("size-1.5 rounded-full", s.dot)} />
      {s.label}
    </span>
  );
}

export function ReasonTags({ tags, className }: { tags: string[]; className?: string }) {
  if (tags.length === 0) {
    return <span className="text-xs text-muted-foreground">No flags</span>;
  }
  return (
    <div className={cn("flex flex-wrap gap-1", className)}>
      {tags.map((tag) => (
        <span
          key={tag}
          className={cn(
            "inline-flex items-center rounded-full border px-2 py-0.5 text-[11px] font-medium",
            REASON_TAG_STYLE[tag] ?? "bg-muted text-muted-foreground border-border",
          )}
        >
          {tag}
        </span>
      ))}
    </div>
  );
}

export function AlertStatusBadge({
  status,
  className,
}: {
  status: AlertStatus;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border px-2 py-0.5 text-[11px] font-medium",
        ALERT_STATUS_STYLE[status],
        className,
      )}
    >
      {ALERT_STATUS_LABEL[status]}
    </span>
  );
}
