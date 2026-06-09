import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { AlertQueue } from "@/components/AlertQueue";
import { SafetyLabels } from "@/components/SafetyLabels";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("alerts");
  return { title: t("metaTitle") };
}

export default async function AlertsPage() {
  const t = await getTranslations("alerts");
  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">{t("title")}</h1>
          <p className="mt-1 text-sm text-muted-foreground">{t("sub")}</p>
        </div>
        <SafetyLabels />
      </div>
      <AlertQueue />
    </div>
  );
}
