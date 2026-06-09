"use client";

import { useTranslations } from "next-intl";
import { RotateCcw, Sparkles } from "lucide-react";
import { useApp } from "@/components/AppProvider";
import { Button } from "@/components/ui/button";

export function DemoSettingsPanel() {
  const t = useTranslations("settings.demo");
  const { busy, resetDemo } = useApp();

  return (
    <div className="cl-rise rounded-2xl border border-border bg-card p-5">
      <div className="flex items-center gap-2 text-sm font-semibold">
        <Sparkles className="size-4 text-primary" />
        {t("title")}
      </div>
      <p className="mt-2 text-sm text-muted-foreground">{t("body")}</p>
      <div className="mt-4">
        <Button variant="destructive" size="sm" disabled={busy} onClick={() => void resetDemo()}>
          <RotateCcw className="size-4" /> {t("reset")}
        </Button>
      </div>
    </div>
  );
}
