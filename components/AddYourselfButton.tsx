"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { UserPlus } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

// "Add yourself as a patient": creates a fresh demo patient (cloned from a mock
// template, with history) and sends you to its personalised onboarding QR page.
export function AddYourselfButton({
  className,
  variant = "solid",
}: {
  className?: string;
  variant?: "solid" | "outline";
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function add() {
    setLoading(true);
    try {
      const res = await fetch("/api/onboard/create", { method: "POST" });
      const data = (await res.json().catch(() => ({}))) as { patientId?: string; error?: string };
      if (!res.ok || !data.patientId) throw new Error(data.error ?? "Could not create patient");
      router.push(`/onboard/${data.patientId}`);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not add patient");
      setLoading(false);
    }
  }

  return (
    <button
      onClick={add}
      disabled={loading}
      className={cn(
        "inline-flex items-center gap-1.5 rounded-lg px-3.5 py-2 text-sm font-semibold transition-colors disabled:opacity-60",
        variant === "solid"
          ? "bg-primary text-primary-foreground hover:bg-primary/90"
          : "border border-border bg-card hover:bg-muted",
        className,
      )}
    >
      <UserPlus className="size-4" /> {loading ? "Creating…" : "Add yourself as a patient"}
    </button>
  );
}
