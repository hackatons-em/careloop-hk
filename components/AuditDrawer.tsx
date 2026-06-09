"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { History } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useApp } from "@/components/AppProvider";
import { useFormat } from "@/lib/useFormat";

export function AuditDrawer({
  patientId,
  open: controlledOpen,
  onOpenChange,
  hideTrigger = false,
}: {
  patientId: string;
  /** Controlled open state. When omitted, the component manages its own. */
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  /** Hide the built-in trigger button (e.g. when opened from a menu). */
  hideTrigger?: boolean;
}) {
  const t = useTranslations("panels.audit");
  const ta = useTranslations("domain.audit");
  const { formatDateTime } = useFormat();
  const { audit } = useApp();
  const [internalOpen, setInternalOpen] = useState(false);
  const open = controlledOpen ?? internalOpen;
  const setOpen = onOpenChange ?? setInternalOpen;

  const events = audit.filter(
    (e) => e.target_id === patientId || e.metadata?.patient_id === patientId,
  );

  return (
    <>
      {!hideTrigger && (
        <Button variant="outline" size="sm" className="gap-1.5" onClick={() => setOpen(true)}>
          <History className="size-4" />
          {t("trigger")}
          <span className="rounded-full bg-muted px-1.5 text-xs">{events.length}</span>
        </Button>
      )}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{t("title")}</DialogTitle>
            <DialogDescription>{t("sub")}</DialogDescription>
          </DialogHeader>
          <div className="max-h-[60vh] space-y-2 overflow-y-auto">
            {events.length === 0 && (
              <p className="py-6 text-center text-sm text-muted-foreground">{t("empty")}</p>
            )}
            {events.map((e) => (
              <div
                key={e.id}
                className="flex items-start justify-between gap-3 rounded-lg border border-border bg-muted/30 px-3 py-2 text-sm"
              >
                <div>
                  <p className="font-medium">
                    {ta.has(e.action as never) ? ta(e.action as never) : e.action}
                  </p>
                  <p className="text-xs text-muted-foreground">{t("by", { actor: e.actor })}</p>
                </div>
                <span className="shrink-0 text-xs text-muted-foreground">
                  {formatDateTime(e.created_at)}
                </span>
              </div>
            ))}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
