import Link from "next/link";
import { QrCode, UserPlus } from "lucide-react";
import { Dashboard } from "@/components/Dashboard";
import { DemoControls } from "@/components/DemoControls";
import { SafetyLabels } from "@/components/SafetyLabels";
import { requireAuthOrRedirect } from "@/lib/auth";
import { isDemoMode } from "@/lib/flags";

export const metadata = { title: "Nurse dashboard" };
export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const ctx = await requireAuthOrRedirect();
  // Demo tooling is decided server-side so the menu never ships to nurses or
  // non-demo deployments.
  const showDemo = isDemoMode() && ctx.role === "admin";

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
          <div className="flex flex-wrap gap-2">
            <Link
              href="/patients/new"
              className="inline-flex items-center justify-center gap-1.5 rounded-lg bg-primary px-3.5 py-2 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90"
            >
              <UserPlus className="size-4" /> Add patient
            </Link>
            <Link
              href="/onboard"
              className="inline-flex items-center justify-center gap-1.5 rounded-lg border border-border bg-card px-3.5 py-2 text-sm font-semibold text-foreground transition-colors hover:bg-muted"
            >
              <QrCode className="size-4" /> Onboard via QR
            </Link>
          </div>
          {showDemo && <DemoControls />}
        </div>
      </div>
      <Dashboard />
    </div>
  );
}
