import { AlertQueue } from "@/components/AlertQueue";
import { SafetyLabels } from "@/components/SafetyLabels";

export const metadata = { title: "Nurse review queue — CareLoop HK" };

export default function AlertsPage() {
  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Nurse review queue</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Alerts raised by the deterministic rule engine, with matched rules, evidence, and the
            suggested owner. Acknowledge and add a note.
          </p>
        </div>
        <SafetyLabels />
      </div>
      <AlertQueue />
    </div>
  );
}
