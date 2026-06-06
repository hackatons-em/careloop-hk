import { Dashboard } from "@/components/Dashboard";
import { SafetyLabels } from "@/components/SafetyLabels";

export const metadata = { title: "Nurse dashboard — CareLoop HK" };

export default function DashboardPage() {
  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Nurse dashboard</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Elderly chronic-care patients, their latest check-in, deterministic risk state, and the
            top reason for review.
          </p>
        </div>
        <SafetyLabels />
      </div>
      <Dashboard />
    </div>
  );
}
