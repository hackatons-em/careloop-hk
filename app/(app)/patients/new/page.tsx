import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { PatientForm } from "@/components/PatientForm";

export const metadata = { title: "Add patient" };
export const dynamic = "force-dynamic";

export default function NewPatientPage() {
  return (
    <div className="mx-auto max-w-2xl space-y-4">
      <Link
        href="/dashboard"
        className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        <ChevronLeft className="size-4" /> Back to dashboard
      </Link>
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Add a patient</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Enroll a patient in daily WhatsApp monitoring. Baselines drive the deterministic risk
          rules.
        </p>
      </div>
      <PatientForm mode="create" />
    </div>
  );
}
