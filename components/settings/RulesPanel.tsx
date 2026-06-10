import { getTranslations } from "next-intl/server";
import { ScrollText } from "lucide-react";
import { RiskBadge } from "@/components/RiskBadge";
import { ENGINE_VERSION, RULE_CATALOG } from "@/lib/riskEngine";

/**
 * Read-only transparency view of the deterministic rule catalog — the exact
 * rules (and version) that decide severity. Rule text stays English by
 * clinical-text policy; the surrounding chrome is bilingual.
 */
export async function RulesPanel() {
  const t = await getTranslations("settings.rules");

  return (
    <div className="cl-rise rounded-2xl border border-border bg-card p-5">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2 text-sm font-semibold">
          <ScrollText className="size-4 text-primary" />
          {t("title")}
        </div>
        <span className="rounded-full bg-muted px-2.5 py-0.5 text-xs text-muted-foreground">
          {t("version", { version: ENGINE_VERSION })}
        </span>
      </div>
      <p className="mt-1 text-xs text-muted-foreground">{t("sub")}</p>

      <div className="mt-4 divide-y divide-border rounded-xl border border-border">
        {RULE_CATALOG.map((rule) => (
          <div key={rule.code} className="flex items-start justify-between gap-4 px-4 py-3">
            <div className="min-w-0">
              <p className="text-sm font-semibold">
                <span className="[font-family:ui-monospace,SFMono-Regular,Menlo,Consolas,monospace] text-xs">
                  {rule.code}
                </span>{" "}
                — {rule.condition}
              </p>
              <p className="mt-0.5 text-xs text-muted-foreground">{rule.description}</p>
            </div>
            <RiskBadge severity={rule.severity} className="shrink-0" />
          </div>
        ))}
      </div>

      <p className="mt-4 rounded-lg bg-muted/40 px-3 py-2 text-xs text-muted-foreground">
        {t("note")}
      </p>
    </div>
  );
}
