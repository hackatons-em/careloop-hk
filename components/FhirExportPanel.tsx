"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { FileJson, Copy, Download } from "lucide-react";
import { toast } from "sonner";
import { Button, buttonVariants } from "@/components/ui/button";
import { api, fhirUrl } from "@/lib/api";
import { cn } from "@/lib/utils";

export function FhirExportPanel({ patientId }: { patientId: string }) {
  const t = useTranslations("panels.fhir");
  const [bundle, setBundle] = useState<Record<string, unknown> | null>(null);
  const [busy, setBusy] = useState(false);

  const entryCount = Array.isArray(bundle?.entry) ? (bundle!.entry as unknown[]).length : 0;

  async function exportBundle() {
    setBusy(true);
    try {
      const b = await api.fhirExport(patientId);
      setBundle(b);
      toast.success(t("exported"));
    } catch (e) {
      toast.error(e instanceof Error ? e.message : t("exportFailed"));
    } finally {
      setBusy(false);
    }
  }

  async function copy() {
    if (!bundle) return;
    try {
      await navigator.clipboard.writeText(JSON.stringify(bundle, null, 2));
      toast.success(t("copied"));
    } catch {
      toast.error(t("copyFailed"));
    }
  }

  return (
    <div className="rounded-2xl border border-border bg-card p-4">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <FileJson className="size-4 text-primary" />
          <h2 className="font-semibold">{t("title")}</h2>
        </div>
        {bundle && (
          <span className="rounded-full border border-border bg-muted px-2 py-0.5 text-[11px] text-muted-foreground">
            {t("resources", { count: entryCount })}
          </span>
        )}
      </div>

      {!bundle ? (
        <>
          <p className="mt-2 text-sm text-muted-foreground">{t("empty")}</p>
          <Button size="sm" className="mt-3 gap-1.5" onClick={exportBundle} disabled={busy}>
            <FileJson className="size-4" /> {busy ? t("exporting") : t("export")}
          </Button>
        </>
      ) : (
        <>
          <pre className="mt-3 max-h-72 overflow-auto rounded-lg border border-border bg-muted/40 p-3 font-mono text-[11px] leading-relaxed">
            {JSON.stringify(bundle, null, 2)}
          </pre>
          <div className="mt-3 flex gap-2">
            <Button variant="outline" size="sm" className="gap-1.5" onClick={copy}>
              <Copy className="size-4" /> {t("copy")}
            </Button>
            <a
              href={`${fhirUrl(patientId)}?download=1`}
              className={cn(buttonVariants({ variant: "outline", size: "sm" }), "gap-1.5")}
            >
              <Download className="size-4" /> {t("download")}
            </a>
          </div>
        </>
      )}
    </div>
  );
}
