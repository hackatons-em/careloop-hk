"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { RotateCcw, Zap, FileText, MessageCircle, ChevronDown } from "lucide-react";
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
  const router = useRouter();
  const { busy, resetDemo, runRiskyCheckIn } = useApp();
  const [genBusy, setGenBusy] = useState(false);

  async function risky() {
    const id = await runRiskyCheckIn();
    if (id) router.push(`/patients/${id}`);
  }

  async function summary() {
    setGenBusy(true);
    try {
      const s = await api.weeklySummary(DEMO_PATIENT);
      toast.success(
        `Weekly summary ready (${s.generated_by === "ai" ? "AI-assisted" : "template"})`,
        { description: "Open Mrs. Chan → Export & audit to view and download." },
      );
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not generate summary");
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
      if (!res.ok) throw new Error(data.error ?? "Failed to send");
      if (!data.total) {
        toast.info("No patient WhatsApp numbers known yet — message the CareLoop number first.");
      } else {
        toast.success(`Daily check-in sent to ${data.sent}/${data.total} patient(s).`);
      }
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not send check-in");
    }
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <Button variant="outline" size="sm" disabled={busy} className="gap-1.5" />
        }
      >
        Demo tools <ChevronDown className="size-4" />
      </DropdownMenuTrigger>
      <DropdownMenuContent>
        <DropdownMenuItem onClick={risky} disabled={busy} className="font-medium text-foreground">
          <Zap className="text-primary!" /> Run risky check-in
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={resetDemo} disabled={busy}>
          <RotateCcw /> Reset demo
        </DropdownMenuItem>
        <DropdownMenuItem onClick={sendCheckin} disabled={busy}>
          <MessageCircle /> Daily check-in (all)
        </DropdownMenuItem>
        <DropdownMenuItem onClick={summary} disabled={busy || genBusy}>
          <FileText /> Generate summary
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
