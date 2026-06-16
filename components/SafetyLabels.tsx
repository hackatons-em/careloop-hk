"use client";

import { useTranslations } from "next-intl";
import { Info, ShieldCheck } from "lucide-react";
import { cn } from "@/lib/utils";

/** Row of small safety chips for risky screens. */
export function SafetyLabels({ className }: { className?: string }) {
  const t = useTranslations("domain.safety");
  const labels = [t("label1"), t("label2"), t("label3")];
  return (
    <div className={cn("flex flex-wrap gap-1.5", className)}>
      {labels.map((label) => (
        <span
          key={label}
          className="inline-flex items-center gap-1 rounded-full border border-border bg-muted/60 px-2 py-0.5 text-[11px] font-medium text-muted-foreground"
        >
          <ShieldCheck className="size-3" />
          {label}
        </span>
      ))}
    </div>
  );
}

/** Primary product disclaimer line. */
export function SafetyBanner({ className }: { className?: string }) {
  const t = useTranslations("domain.safety");
  return (
    <div
      className={cn(
        "flex items-start gap-2 rounded-lg border border-primary/20 bg-accent/40 px-3 py-2 text-sm text-accent-foreground",
        className,
      )}
    >
      <Info className="mt-0.5 size-4 shrink-0" />
      <p>{t("banner")}</p>
    </div>
  );
}

/** Compact inline note for alert cards. */
export function SafetyNote({ className }: { className?: string }) {
  const t = useTranslations("domain.safety");
  return <p className={cn("text-xs text-muted-foreground", className)}>{t("note")}</p>;
}
