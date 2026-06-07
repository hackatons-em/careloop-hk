import { Dashboard } from "@/components/Dashboard";
import { DemoControls } from "@/components/DemoControls";
import { SafetyLabels } from "@/components/SafetyLabels";
import { AddYourselfButton } from "@/components/AddYourselfButton";

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
        <div className="flex flex-col gap-2 lg:items-end">
          <AddYourselfButton />
          <DemoControls />
        </div>
      </div>
      <Dashboard />
    </div>
  );
}
