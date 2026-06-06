"use client";

import { useState } from "react";
import { PhoneCall, ClipboardList } from "lucide-react";
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
import { SEVERITY_LABEL } from "@/lib/types";
import { cn } from "@/lib/utils";

const MOODS = [
  { v: "good", en: "Good", zh: "幾好" },
  { v: "okay", en: "Okay", zh: "一般" },
  { v: "tired", en: "Tired", zh: "攰" },
  { v: "unwell", en: "Unwell", zh: "唔舒服" },
];

function YesNo({
  value,
  onChange,
  invertColor = false,
}: {
  value: boolean;
  onChange: (v: boolean) => void;
  invertColor?: boolean;
}) {
  return (
    <div className="flex gap-1.5">
      {[
        { v: true, label: "Yes / 有" },
        { v: false, label: "No / 冇" },
      ].map((opt) => {
        const active = value === opt.v;
        const danger = invertColor ? opt.v === true : false;
        return (
          <button
            key={String(opt.v)}
            type="button"
            onClick={() => onChange(opt.v)}
            className={cn(
              "rounded-lg border px-3 py-1.5 text-sm font-medium transition-colors",
              active
                ? danger
                  ? "border-red-300 bg-red-50 text-red-700"
                  : "border-primary bg-primary/10 text-foreground"
                : "border-border bg-card text-muted-foreground hover:bg-muted",
            )}
          >
            {opt.label}
          </button>
        );
      })}
    </div>
  );
}

function Question({ en, zh, children }: { en: string; zh: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <div>
        <p className="text-sm font-medium">{en}</p>
        <p className="text-xs text-muted-foreground">{zh}</p>
      </div>
      {children}
    </div>
  );
}

export function CheckInSimulator({
  patientId,
  onSubmitted,
}: {
  patientId: string;
  onSubmitted?: () => void;
}) {
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [mood, setMood] = useState("okay");
  const [sob, setSob] = useState(false);
  const [swelling, setSwelling] = useState(false);
  const [dizziness, setDizziness] = useState(false);
  const [chest, setChest] = useState(false);
  const [medTaken, setMedTaken] = useState(true);
  const [weight, setWeight] = useState("");

  async function submit() {
    setBusy(true);
    try {
      const res = await api.submitCheckIn(patientId, {
        mood,
        shortness_of_breath: sob,
        swelling,
        dizziness,
        chest_discomfort: chest,
        medication_taken: medTaken,
        weight: weight ? Number(weight) : undefined,
        free_text_note: null,
        source: "simulated_call",
      });
      setOpen(false);
      onSubmitted?.();
      const rules = res.risk.matched_rules.map((m) => m.code).join(", ") || "none";
      toast.success(`Check-in saved — ${SEVERITY_LABEL[res.risk.severity]}`, {
        description: `Matched rules: ${rules}.`,
      });
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not save check-in");
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <Button variant="outline" size="sm" className="gap-1.5" onClick={() => setOpen(true)}>
        <ClipboardList className="size-4" /> New check-in
      </Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <PhoneCall className="size-4 text-primary" /> Daily check-in · 每日電話報到
            </DialogTitle>
            <DialogDescription>
              Simulated daily call. Responses are saved as a check-in and re-evaluated by the rule
              engine.
            </DialogDescription>
          </DialogHeader>

          <div className="max-h-[60vh] space-y-4 overflow-y-auto pr-1">
            <Question en="How are you feeling today?" zh="今日覺得點呀？">
              <div className="flex flex-wrap gap-1.5">
                {MOODS.map((m) => (
                  <button
                    key={m.v}
                    type="button"
                    onClick={() => setMood(m.v)}
                    className={cn(
                      "rounded-lg border px-3 py-1.5 text-sm font-medium transition-colors",
                      mood === m.v
                        ? "border-primary bg-primary/10 text-foreground"
                        : "border-border bg-card text-muted-foreground hover:bg-muted",
                    )}
                  >
                    {m.en} · {m.zh}
                  </button>
                ))}
              </div>
            </Question>

            <Question en="Any shortness of breath?" zh="有冇覺得氣促？">
              <YesNo value={sob} onChange={setSob} invertColor />
            </Question>
            <Question en="Any swelling in legs or feet?" zh="對腳或腳踝有冇腫？">
              <YesNo value={swelling} onChange={setSwelling} invertColor />
            </Question>
            <Question en="Any dizziness?" zh="有冇頭暈？">
              <YesNo value={dizziness} onChange={setDizziness} invertColor />
            </Question>
            <Question en="Any chest discomfort?" zh="胸口有冇唔舒服？">
              <YesNo value={chest} onChange={setChest} invertColor />
            </Question>
            <Question en="Did you take your medicine today?" zh="今日食咗藥未？">
              <YesNo value={medTaken} onChange={setMedTaken} />
            </Question>
            <Question en="What is your weight today? (kg)" zh="今日量到體重係幾多？(公斤)">
              <input
                type="number"
                inputMode="decimal"
                step="0.1"
                value={weight}
                onChange={(e) => setWeight(e.target.value)}
                placeholder="e.g. 64.3"
                className="w-32 rounded-lg border border-border bg-card px-3 py-1.5 text-sm outline-none focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/40"
              />
            </Question>
          </div>

          <div className="flex justify-end gap-2 border-t border-border pt-3">
            <Button variant="outline" size="sm" onClick={() => setOpen(false)} disabled={busy}>
              Cancel
            </Button>
            <Button size="sm" onClick={submit} disabled={busy}>
              {busy ? "Saving…" : "Submit check-in"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
