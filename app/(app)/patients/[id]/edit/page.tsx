import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { ChevronLeft } from "lucide-react";
import { NeedsReviewBadge } from "@/components/NeedsReviewBadge";
import { PatientForm } from "@/components/PatientForm";
import { requireAuthOrRedirect } from "@/lib/auth";
import { getPatient } from "@/lib/store";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("patient.edit");
  return { title: t("metaTitle") };
}

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
  const t = await getTranslations("patient.edit");

  return (
    <div className="mx-auto max-w-2xl space-y-4">
      <Link
        href={`/patients/${id}`}
        className="inline-flex items-center gap-1 rounded-md text-sm text-muted-foreground outline-none hover:text-foreground focus-visible:text-foreground focus-visible:ring-2 focus-visible:ring-ring"
      >
        <ChevronLeft className="size-4" /> {t("back", { name: patient.name })}
      </Link>
      <div>
        <div className="flex flex-wrap items-center gap-3">
          <h1 className="text-2xl font-semibold tracking-tight">{t("title")}</h1>
          {pending && <NeedsReviewBadge />}
        </div>
        <p className="mt-1 text-sm text-muted-foreground">
          {pending ? t("subPending") : t("sub")}
        </p>
      </div>
      <PatientForm mode="edit" patient={patient} markReviewedOnSave={pending} />
    </div>
  );
}
