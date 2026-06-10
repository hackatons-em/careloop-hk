import type { Metadata } from "next";
import { AppProvider } from "@/components/AppProvider";
import { Header } from "@/components/Header";
import { requireAuthOrRedirect } from "@/lib/auth";
import { logger } from "@/lib/logger";
import { getAlerts, getAuditEvents, getPatientRows } from "@/lib/store";
import type { AuditEvent, PatientRow, RiskAlert } from "@/lib/types";

export const dynamic = "force-dynamic";

// The whole app shell is for signed-in clinical staff — never index it.
export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

// Seed the client provider with the current dashboard state so the app shell
// hydrates instantly. Runs ONLY for authenticated users (this layout redirects
// anonymous visitors), so patient data never reaches a public page.
async function loadInitial(orgId: string): Promise<{
  rows: PatientRow[];
  alerts: RiskAlert[];
  audit: AuditEvent[];
}> {
  try {
    const [rows, alerts, audit] = await Promise.all([
      getPatientRows(orgId),
      getAlerts(orgId),
      getAuditEvents(orgId, 60),
    ]);
    return { rows, alerts, audit };
  } catch (err) {
    logger.error("Initial data load failed (is Supabase configured?)", { err });
    return { rows: [], alerts: [], audit: [] };
  }
}

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const ctx = await requireAuthOrRedirect();
  const { rows, alerts, audit } = await loadInitial(ctx.orgId);
  return (
    <AppProvider orgId={ctx.orgId} initialRows={rows} initialAlerts={alerts} initialAudit={audit}>
      <Header user={{ name: ctx.name, email: ctx.email, role: ctx.role }} />
      <main id="main" className="mx-auto w-full max-w-[1180px] flex-1 px-6 py-8">
        {children}
      </main>
    </AppProvider>
  );
}
