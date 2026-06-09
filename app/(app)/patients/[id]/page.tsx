import { notFound } from "next/navigation";
import { PatientDetail } from "@/components/PatientDetail";
import { requireAuthOrRedirect } from "@/lib/auth";
import { getTimeline } from "@/lib/store";

export const dynamic = "force-dynamic";

export default async function PatientPage({ params }: { params: Promise<{ id: string }> }) {
  const ctx = await requireAuthOrRedirect();
  const { id } = await params;
  const timeline = await getTimeline(ctx.orgId, id);
  if (!timeline) notFound();

  return <PatientDetail patientId={id} initialTimeline={timeline} />;
}
