import { getFormatter, getTranslations } from "next-intl/server";
import { ScrollText } from "lucide-react";
import { RiskBadge } from "@/components/RiskBadge";
import { RuleThresholdEditor } from "@/components/settings/RuleThresholdEditor";
import { ENGINE_VERSION, ruleCatalog } from "@/lib/riskEngine";
import { getActiveRuleConfig, getRuleConfigHistory } from "@/lib/ruleConfig";

/**
 * Monitoring-rules transparency + guardrailed threshold tuning. The catalog is
 * rendered from the org's ACTIVE thresholds (merged over code defaults), so
 * what the admin reads is exactly what the engine runs. Rule text stays
 * English by clinical-text policy; chrome is bilingual.
 */
export async function RulesPanel({ orgId }: { orgId: string }) {
  const t = await getTranslations("settings.rules");
  const format = await getFormatter();
  const [active, history] = await Promise.all([
    getActiveRuleConfig(orgId),
    getRuleConfigHistory(orgId),
  ]);
  const catalog = ruleCatalog(active.config);

  return (
    <div className="space-y-4">
      <div className="cl-rise rounded-2xl border border-border bg-card p-5">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-sm font-semibold">
            <ScrollText className="size-4 text-primary" />
            {t("title")}
          </div>
          <span className="rounded-full bg-muted px-2.5 py-0.5 text-xs text-muted-foreground">
            {t("version", { version: ENGINE_VERSION })} · {t("configVersion", { version: active.version })}
          </span>
        </div>
        <p className="mt-1 text-xs text-muted-foreground">{t("sub")}</p>

        <div className="mt-4 divide-y divide-border rounded-xl border border-border">
          {catalog.map((rule) => (
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

      <RuleThresholdEditor active={active} />

      {history.length > 0 && (
        <div className="cl-rise rounded-2xl border border-border bg-card p-5">
          <h3 className="text-sm font-semibold">{t("historyTitle")}</h3>
          <ul className="mt-3 space-y-2 text-sm">
            {history.map((h) => (
              <li key={h.version} className="flex items-start justify-between gap-3">
                <div>
                  <span className="font-medium">{t("historyVersion", { version: h.version })}</span>
                  {h.note && <span className="text-muted-foreground"> — {h.note}</span>}
                  <p className="text-xs text-muted-foreground">{h.created_by}</p>
                </div>
                <span className="shrink-0 text-xs text-muted-foreground">
                  {format.dateTime(new Date(h.created_at), { dateStyle: "medium" })}
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
