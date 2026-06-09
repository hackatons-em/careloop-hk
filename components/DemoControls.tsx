"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { Zap, FileText, MessageCircle, ChevronDown } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useApp } from "@/components/AppProvider";
import { api } from "@/lib/api";

const DEMO_PATIENT = "patient-mrs-chan";

/** Polished demo-reliability controls (not debug buttons). */
export function DemoControls() {
  const t = useTranslations("panels.demoControls");
  const router = useRouter();
  const { busy, runRiskyCheckIn } = useApp();
  const [genBusy, setGenBusy] = useState(false);

  async function risky() {
    const id = await runRiskyCheckIn();
    if (id) router.push(`/patients/${id}`);
  }

  async function summary() {
    setGenBusy(true);
    try {
      const s = await api.weeklySummary(DEMO_PATIENT);
      toast.success(s.generated_by === "ai" ? t("summaryReadyAi") : t("summaryReadyTemplate"), {
        description: t("summaryDesc"),
      });
    } catch (e) {
      toast.error(e instanceof Error ? e.message : t("summaryFailed"));
    } finally {
      setGenBusy(false);
    }
  }

  async function sendCheckin() {
    try {
      const res = await fetch("/api/agent/send-round", { method: "POST" });
      const data = (await res.json().catch(() => ({}))) as {
        sent?: number;
        total?: number;
        error?: string;
      };
      if (!res.ok) throw new Error(data.error ?? t("sendFailed"));
      if (!data.total) {
        toast.info(t("noNumbers"));
      } else {
        toast.success(t("sent", { sent: data.sent ?? 0, total: data.total }));
      }
    } catch (e) {
      toast.error(e instanceof Error ? e.message : t("sendFailed"));
    }
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={<Button variant="outline" size="sm" disabled={busy} className="gap-1.5" />}
      >
        {t("trigger")} <ChevronDown className="size-4" />
      </DropdownMenuTrigger>
      <DropdownMenuContent>
        <DropdownMenuItem onClick={risky} disabled={busy} className="font-medium text-foreground">
          <Zap className="text-primary!" /> {t("risky")}
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={sendCheckin} disabled={busy}>
          <MessageCircle /> {t("sendAll")}
        </DropdownMenuItem>
        <DropdownMenuItem onClick={summary} disabled={busy || genBusy}>
          <FileText /> {t("generateSummary")}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
