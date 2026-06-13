"use client";

import { useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { Users, Copy, Send } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { SafetyNote } from "@/components/SafetyLabels";
import { api } from "@/lib/api";
import { buildCaregiverAlert } from "@/lib/caregiver";
import type { PatientTimeline } from "@/lib/types";
import { cn } from "@/lib/utils";

export function CaregiverAlert({
  timeline,
  onNotified,
}: {
  timeline: PatientTimeline;
  onNotified?: () => void;
}) {
  const t = useTranslations("panels.caregiver");
  const locale = useLocale();
  // The caregiver message itself is independently multilingual; default the
  // preview to the UI language.
  const [lang, setLang] = useState<"en" | "zh" | "ar">(
    locale === "zh-HK" ? "zh" : locale === "ar" ? "ar" : "en",
  );
  const [busy, setBusy] = useState(false);

  const text = buildCaregiverAlert(
    timeline.patient,
    timeline.daily,
    timeline.checkins,
    timeline.risk.severity,
  );
  const body = lang === "en" ? text.en : lang === "zh" ? text.zh : text.ar;
  const LANG_LABEL = { en: "EN", zh: "繁中", ar: "عربي" } as const;

  async function copy() {
    try {
      await navigator.clipboard.writeText(body);
      toast.success(t("copied"));
    } catch {
      toast.error(t("copyFailed"));
    }
  }

  async function notify() {
    setBusy(true);
    try {
      await api.caregiverAlert(timeline.patient.id, true);
      toast.success(t("notified"));
      onNotified?.();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : t("notifyFailed"));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="rounded-2xl border border-border bg-card p-4">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <Users className="size-4 text-primary" />
          <h2 className="font-semibold">{t("title")}</h2>
        </div>
        <div className="flex rounded-lg border border-border p-0.5 text-xs">
          {(["en", "zh", "ar"] as const).map((l) => (
            <button
              key={l}
              onClick={() => setLang(l)}
              aria-pressed={lang === l}
              lang={l === "zh" ? "zh-HK" : l}
              className={cn(
                "rounded-md px-2 py-0.5 font-medium outline-none transition-colors focus-visible:ring-2 focus-visible:ring-ring",
                lang === l ? "bg-primary text-primary-foreground" : "text-muted-foreground",
              )}
            >
              {LANG_LABEL[l]}
            </button>
          ))}
        </div>
      </div>

      <p
        dir={lang === "ar" ? "rtl" : "ltr"}
        lang={lang === "zh" ? "zh-HK" : lang}
        className={cn(
          "mt-3 rounded-lg border border-border bg-muted/30 p-3 text-sm leading-relaxed",
          (lang === "zh" || lang === "ar") && "leading-loose",
        )}
      >
        {body}
      </p>

      <div className="mt-3 flex gap-2">
        <Button variant="outline" size="sm" className="gap-1.5" onClick={copy}>
          <Copy className="size-4" /> {t("copy")}
        </Button>
        <Button size="sm" className="gap-1.5" onClick={notify} disabled={busy}>
          <Send className="size-4" /> {t("notify")}
        </Button>
      </div>

      <SafetyNote className="mt-3" />
    </div>
  );
}
