"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Upload } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { api } from "@/lib/api";

export function CsvImport({
  patientId,
  onImported,
  open: controlledOpen,
  onOpenChange,
  hideTrigger = false,
}: {
  patientId: string;
  onImported?: () => void;
  /** Controlled open state. When omitted, the component manages its own. */
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  /** Hide the built-in trigger button (e.g. when opened from a menu). */
  hideTrigger?: boolean;
}) {
  const t = useTranslations("panels.csv");
  const [internalOpen, setInternalOpen] = useState(false);
  const open = controlledOpen ?? internalOpen;
  const setOpen = onOpenChange ?? setInternalOpen;
  const [text, setText] = useState("");
  const [busy, setBusy] = useState(false);

  async function onFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) setText(await file.text());
  }

  async function importNow() {
    if (!text.trim()) {
      toast.error(t("emptyError"));
      return;
    }
    setBusy(true);
    try {
      const res = await api.importCsv(patientId, text);
      toast.success(t("imported", { count: res.imported }));
      setOpen(false);
      setText("");
      onImported?.();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : t("failed"));
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      {!hideTrigger && (
        <Button variant="outline" size="sm" className="gap-1.5" onClick={() => setOpen(true)}>
          <Upload className="size-4" /> {t("title")}
        </Button>
      )}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{t("title")}</DialogTitle>
            <DialogDescription>{t("sub")}</DialogDescription>
          </DialogHeader>
          <input
            type="file"
            accept=".csv,text/csv"
            onChange={onFile}
            aria-label={t("chooseFile")}
            className="text-sm file:me-3 file:rounded-md file:border file:border-border file:bg-muted file:px-3 file:py-1 file:text-sm"
          />
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            rows={7}
            placeholder={t("placeholder")}
            className="w-full rounded-lg border border-border bg-card p-2 font-mono text-xs outline-none focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/40"
          />
          <div className="flex justify-end gap-2 border-t border-border pt-3">
            <Button variant="outline" size="sm" onClick={() => setOpen(false)} disabled={busy}>
              {t("cancel")}
            </Button>
            <Button size="sm" onClick={importNow} disabled={busy}>
              {busy ? t("importing") : t("import")}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
