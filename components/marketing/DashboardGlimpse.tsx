import { getTranslations } from "next-intl/server";
import { CountUp } from "@/components/marketing/CountUp";
import { SEVERITY_STYLE } from "@/lib/severity";
import type { Severity } from "@/lib/types";
import { cn } from "@/lib/utils";

/** Static, server-rendered glimpse of the exception-first review queue —
 * marketing markup only (no real components, no client JS, no real data).
 * Severity pill styling mirrors RiskBadge exactly; severity colors are used
 * here precisely because these depict clinical states. */
export async function DashboardGlimpse() {
  const t = await getTranslations("landing");
  const ts = await getTranslations("domain.severity");

  const rows: { name: string; note: string; severity: Severity }[] = [
    { name: t("preview.name"), note: t("glimpse.row1Note"), severity: "escalate" },
    { name: t("glimpse.row2Name"), note: t("glimpse.row2Note"), severity: "review_today" },
    { name: t("glimpse.row3Name"), note: t("glimpse.row3Note"), severity: "watch" },
  ];

  return (
    <section>
      <div className="text-center">
        <h2 className="text-2xl font-semibold tracking-tight sm:text-3xl">
          {t("glimpse.title")}
        </h2>
        <p className="mx-auto mt-2 max-w-2xl text-sm text-muted-foreground">{t("glimpse.sub")}</p>
      </div>

      <div className="cl-rise mx-auto mt-8 max-w-3xl rounded-2xl border border-border bg-card p-2 shadow-xl">
        <div className="flex items-center justify-between px-3 py-2">
          <span className="text-xs font-medium text-muted-foreground">
            {t("glimpse.panelLabel")}
          </span>
          <span className="rounded-full bg-muted px-2.5 py-0.5 text-xs text-slate-600">
            {t.rich("glimpse.panelCount", {
              needed: () => <CountUp end={3} />,
              total: () => <CountUp end={24} />,
            })}
          </span>
        </div>
        <div className="divide-y divide-border rounded-xl border border-border bg-background/70">
          {rows.map((row) => {
            const s = SEVERITY_STYLE[row.severity];
            return (
              <div key={row.name} className="flex items-center justify-between gap-3 px-4 py-3">
                <div className="min-w-0">
                  <p className="text-sm font-semibold">{row.name}</p>
                  <p className="truncate text-xs text-muted-foreground">{row.note}</p>
                </div>
                <span
                  className={cn(
                    "inline-flex shrink-0 items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-semibold",
                    s.badge,
                  )}
                >
                  <span className={cn("size-1.5 rounded-full", s.dot)} />
                  {ts(row.severity)}
                </span>
              </div>
            );
          })}
          <p className="px-4 py-3 text-xs text-muted-foreground">{t("glimpse.stableLine")}</p>
        </div>
      </div>

      <p className="mt-3 text-center text-xs text-muted-foreground">{t("preview.forReview")}</p>
    </section>
  );
}
