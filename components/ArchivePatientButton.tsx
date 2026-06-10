"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { Archive, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { useApp } from "@/components/AppProvider";
import { Button } from "@/components/ui/button";
import { api } from "@/lib/api";

/**
 * Soft-delete: archiving hides the patient from lists and auto-resolves any
 * open alert (history is preserved). Two-step confirm, no modal needed.
 */
export function ArchivePatientButton({ id, name }: { id: string; name: string }) {
  const t = useTranslations("patient.archive");
  const router = useRouter();
  const { refresh } = useApp();
  const [confirming, setConfirming] = useState(false);
  const [busy, setBusy] = useState(false);

  async function archive() {
    setBusy(true);
    try {
      await api.archivePatient(id);
      toast.success(t("done", { name }));
      await refresh();
      router.push("/dashboard");
      router.refresh();
    } catch (e) {
      setBusy(false);
      setConfirming(false);
      toast.error(e instanceof Error ? e.message : t("failed"));
    }
  }

  return (
    <div className="rounded-2xl border border-border bg-card p-5">
      <h2 className="flex items-center gap-2 text-sm font-semibold">
        <Archive className="size-4 text-muted-foreground" /> {t("title")}
      </h2>
      <p className="mt-1 text-xs text-muted-foreground">{t("hint")}</p>
      <div className="mt-3 flex items-center gap-2">
        {confirming ? (
          <>
            <Button variant="outline" size="sm" disabled={busy} onClick={() => setConfirming(false)}>
              {t("cancel")}
            </Button>
            <Button size="sm" disabled={busy} onClick={() => void archive()} className="gap-1.5">
              {busy && <Loader2 className="size-4 animate-spin" />}
              {t("confirm", { name })}
            </Button>
          </>
        ) : (
          <Button variant="outline" size="sm" onClick={() => setConfirming(true)}>
            {t("button")}
          </Button>
        )}
      </div>
    </div>
  );
}
