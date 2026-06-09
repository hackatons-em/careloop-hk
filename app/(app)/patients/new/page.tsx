import type { Metadata } from "next";
import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { ChevronLeft } from "lucide-react";
import { PatientForm } from "@/components/PatientForm";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("patient.new");
  return { title: t("metaTitle") };
}

export const dynamic = "force-dynamic";

export default async function NewPatientPage() {
  const t = await getTranslations("patient.new");
  return (
    <div className="mx-auto max-w-2xl space-y-4">
      <Link
        href="/dashboard"
        className="inline-flex items-center gap-1 rounded-md text-sm text-muted-foreground outline-none hover:text-foreground focus-visible:text-foreground focus-visible:ring-2 focus-visible:ring-ring"
      >
        <ChevronLeft className="size-4" /> {t("back")}
      </Link>
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">{t("title")}</h1>
        <p className="mt-1 text-sm text-muted-foreground">{t("sub")}</p>
      </div>
      <PatientForm mode="create" />
    </div>
  );
}
