import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronLeft } from "lucide-react";
import { NeedsReviewBadge } from "@/components/NeedsReviewBadge";
import { PatientForm } from "@/components/PatientForm";
import { requireAuthOrRedirect } from "@/lib/auth";
import { getPatient } from "@/lib/store";

export const metadata = { title: "Edit patient" };
export const dynamic = "force-dynamic";

export default async function EditPatientPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const ctx = await requireAuthOrRedirect();
  const { id } = await params;
  const patient = await getPatient(ctx.orgId, id);
  if (!patient) notFound();

  const pending = patient.status === "pending_review";

  return (
    <div className="mx-auto max-w-2xl space-y-4">
      <Link
        href={`/patients/${id}`}
        className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        <ChevronLeft className="size-4" /> Back to {patient.name}
      </Link>
      <div>
        <div className="flex flex-wrap items-center gap-3">
          <h1 className="text-2xl font-semibold tracking-tight">Edit patient</h1>
          {pending && <NeedsReviewBadge />}
        </div>
        <p className="mt-1 text-sm text-muted-foreground">
          {pending
            ? "This patient was auto-created from a WhatsApp message. Confirm the details to finish enrolment."
            : "Update the patient's details, WhatsApp number, and monitoring baselines."}
        </p>
      </div>
      <PatientForm mode="edit" patient={patient} markReviewedOnSave={pending} />
    </div>
  );
}
