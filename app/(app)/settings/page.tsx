import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { Building2 } from "lucide-react";
import { DemoSettingsPanel } from "@/components/settings/DemoSettingsPanel";
import { LeadsPanel } from "@/components/settings/LeadsPanel";
import { UsersPanel } from "@/components/settings/UsersPanel";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { requireAuthOrRedirect } from "@/lib/auth";
import { isDemoMode } from "@/lib/flags";
import { getOrganization } from "@/lib/org";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("settings");
  return { title: t("metaTitle") };
}

export const dynamic = "force-dynamic";

export default async function SettingsPage() {
  const ctx = await requireAuthOrRedirect("admin");
  const org = await getOrganization(ctx.orgId);
  const demo = isDemoMode();
  const t = await getTranslations("settings");

  return (
    <div className="mx-auto max-w-3xl space-y-5">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">{t("title")}</h1>
        <p className="mt-1 text-sm text-muted-foreground">{t("sub")}</p>
      </div>

      <Tabs defaultValue="team" className="w-full">
        <TabsList>
          <TabsTrigger value="team">{t("tabs.team")}</TabsTrigger>
          <TabsTrigger value="leads">{t("tabs.leads")}</TabsTrigger>
          <TabsTrigger value="organization">{t("tabs.organization")}</TabsTrigger>
          {demo && <TabsTrigger value="demo">{t("tabs.demo")}</TabsTrigger>}
        </TabsList>

        <TabsContent value="team" className="cl-fade pt-4">
          <UsersPanel currentUserId={ctx.userId} />
        </TabsContent>

        <TabsContent value="leads" className="cl-fade pt-4">
          <LeadsPanel />
        </TabsContent>

        <TabsContent value="organization" className="cl-fade pt-4">
          <div className="cl-rise rounded-2xl border border-border bg-card p-5">
            <div className="flex items-center gap-2 text-sm font-semibold">
              <Building2 className="size-4 text-primary" />
              {t("org.title")}
            </div>
            <dl className="mt-4 space-y-3 text-sm">
              <div className="flex items-center justify-between gap-4">
                <dt className="text-muted-foreground">{t("org.name")}</dt>
                <dd className="font-medium">{org?.name ?? "—"}</dd>
              </div>
              <div className="flex items-center justify-between gap-4">
                <dt className="text-muted-foreground">{t("org.id")}</dt>
                <dd className="font-mono text-xs text-muted-foreground">{ctx.orgId}</dd>
              </div>
            </dl>
            <p className="mt-4 rounded-lg bg-muted/40 px-3 py-2 text-xs text-muted-foreground">
              {t("org.note")}
            </p>
          </div>
        </TabsContent>

        {demo && (
          <TabsContent value="demo" className="cl-fade pt-4">
            <DemoSettingsPanel />
          </TabsContent>
        )}
      </Tabs>
    </div>
  );
}
