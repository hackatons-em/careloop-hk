import { Building2 } from "lucide-react";
import { DemoSettingsPanel } from "@/components/settings/DemoSettingsPanel";
import { UsersPanel } from "@/components/settings/UsersPanel";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { requireAuthOrRedirect } from "@/lib/auth";
import { isDemoMode } from "@/lib/flags";
import { getOrganization } from "@/lib/org";

export const metadata = { title: "Settings" };
export const dynamic = "force-dynamic";

export default async function SettingsPage() {
  const ctx = await requireAuthOrRedirect("admin");
  const org = await getOrganization(ctx.orgId);
  const demo = isDemoMode();

  return (
    <div className="mx-auto max-w-3xl space-y-5">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Settings</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Manage your organization&apos;s team and configuration.
        </p>
      </div>

      <Tabs defaultValue="team" className="w-full">
        <TabsList>
          <TabsTrigger value="team">Team</TabsTrigger>
          <TabsTrigger value="organization">Organization</TabsTrigger>
          {demo && <TabsTrigger value="demo">Demo</TabsTrigger>}
        </TabsList>

        <TabsContent value="team" className="cl-fade pt-4">
          <UsersPanel currentUserId={ctx.userId} />
        </TabsContent>

        <TabsContent value="organization" className="cl-fade pt-4">
          <div className="cl-rise rounded-2xl border border-border bg-card p-5">
            <div className="flex items-center gap-2 text-sm font-semibold">
              <Building2 className="size-4 text-primary" />
              Organization
            </div>
            <dl className="mt-4 space-y-3 text-sm">
              <div className="flex items-center justify-between gap-4">
                <dt className="text-muted-foreground">Name</dt>
                <dd className="font-medium">{org?.name ?? "—"}</dd>
              </div>
              <div className="flex items-center justify-between gap-4">
                <dt className="text-muted-foreground">Organization ID</dt>
                <dd className="font-mono text-xs text-muted-foreground">{ctx.orgId}</dd>
              </div>
            </dl>
            <p className="mt-4 rounded-lg bg-muted/40 px-3 py-2 text-xs text-muted-foreground">
              CareLoop is multi-tenant ready — every record is scoped to this organization.
              Multi-organization management lands in a future release.
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
