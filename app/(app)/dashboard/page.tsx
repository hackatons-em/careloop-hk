import Link from "next/link";
import { QrCode } from "lucide-react";
import { Dashboard } from "@/components/Dashboard";
import { DemoControls } from "@/components/DemoControls";
import { SafetyLabels } from "@/components/SafetyLabels";

export const metadata = { title: "Nurse dashboard — CareLoop" };

export default function DashboardPage() {
  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Nurse dashboard</h1>
          <p className="mt-1 max-w-xl text-sm text-muted-foreground">
            Elderly chronic-care patients, their latest check-in, deterministic risk state, and the
            next action.
          </p>
          <SafetyLabels className="mt-3" />
        </div>
        <div className="flex flex-col items-stretch gap-2 sm:flex-row sm:items-start lg:flex-col lg:items-end">
          <Link
            href="/onboard"
            className="inline-flex items-center justify-center gap-1.5 rounded-lg bg-primary px-3.5 py-2 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90"
          >
            <QrCode className="size-4" /> Onboard a patient
          </Link>
          <DemoControls />
        </div>
      </div>
      <Dashboard />
    </div>
  );
}
