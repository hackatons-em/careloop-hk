import type { Metadata } from "next";
import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { QrCode, UserPlus } from "lucide-react";
import { Dashboard } from "@/components/Dashboard";
import { DemoControls } from "@/components/DemoControls";
import { requireAuthOrRedirect } from "@/lib/auth";
import { isDemoMode } from "@/lib/flags";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("dashboard");
  return { title: t("metaTitle") };
}

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const ctx = await requireAuthOrRedirect();
  // Demo tooling is decided server-side so the menu never ships to nurses or
  // non-demo deployments.
  const showDemo = isDemoMode() && ctx.role === "admin";
  const t = await getTranslations("dashboard");

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">{t("title")}</h1>
          <p className="mt-1 max-w-xl text-sm text-muted-foreground">{t("sub")}</p>
        </div>
        <div className="flex flex-col items-stretch gap-2 sm:flex-row sm:items-start lg:flex-col lg:items-end">
          <div className="flex flex-wrap gap-2">
            <Link
              href="/patients/new"
              className="inline-flex items-center justify-center gap-1.5 rounded-lg bg-primary px-3.5 py-2 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90"
            >
              <UserPlus className="size-4" /> {t("addPatient")}
            </Link>
            <Link
              href="/onboard"
              className="inline-flex items-center justify-center gap-1.5 rounded-lg border border-border bg-card px-3.5 py-2 text-sm font-semibold text-foreground transition-colors hover:bg-muted"
            >
              <QrCode className="size-4" /> {t("onboardQr")}
            </Link>
          </div>
          {showDemo && <DemoControls />}
        </div>
      </div>
      <Dashboard />
    </div>
  );
}
