import Link from "next/link";
import { PatientDetail } from "@/components/PatientDetail";
import { getTimeline } from "@/lib/store";

export const dynamic = "force-dynamic";

export default async function PatientPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const timeline = getTimeline(id);

  if (!timeline) {
    return (
      <div className="py-16 text-center">
        <p className="text-muted-foreground">Patient not found.</p>
        <Link href="/dashboard" className="mt-2 inline-block text-primary hover:underline">
          Back to dashboard
        </Link>
      </div>
    );
  }

  return <PatientDetail patientId={id} initialTimeline={timeline} />;
}
