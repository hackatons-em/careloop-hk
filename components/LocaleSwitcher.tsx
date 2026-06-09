"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import { setLocale } from "@/i18n/actions";
import { LOCALES, type Locale } from "@/i18n/config";
import { cn } from "@/lib/utils";

const LABEL: Record<Locale, string> = { en: "EN", "zh-HK": "繁" };

/** Compact EN | 繁 toggle (same segmented style as the caregiver-alert
 * language toggle). Persists via cookie, then refreshes the tree. */
export function LocaleSwitcher({ className }: { className?: string }) {
  const t = useTranslations("localeSwitcher");
  const locale = useLocale();
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  function choose(next: Locale) {
    if (next === locale || pending) return;
    startTransition(async () => {
      await setLocale(next);
      router.refresh();
    });
  }

  return (
    <div
      role="group"
      aria-label={t("label")}
      className={cn("flex rounded-lg border border-border p-0.5 text-xs", className)}
    >
      {LOCALES.map((l) => (
        <button
          key={l}
          type="button"
          onClick={() => choose(l)}
          aria-pressed={locale === l}
          lang={l}
          className={cn(
            "rounded-md px-2 py-0.5 font-medium outline-none transition-colors focus-visible:ring-2 focus-visible:ring-ring",
            locale === l ? "bg-primary text-primary-foreground" : "text-muted-foreground",
          )}
        >
          {LABEL[l]}
        </button>
      ))}
    </div>
  );
}
