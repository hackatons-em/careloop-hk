import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Toaster } from "sonner";
import "./globals.css";
import { AppProvider } from "@/components/AppProvider";
import { Footer } from "@/components/Footer";
import { TooltipProvider } from "@/components/ui/tooltip";
import { getAlerts, getAuditEvents, getPatientRows } from "@/lib/store";
import type { AuditEvent, PatientRow, RiskAlert } from "@/lib/types";

export const dynamic = "force-dynamic";

// Seed the client provider with the current dashboard state so the app shell
// hydrates instantly. This runs for every route (the root layout wraps the
// marketing pages too), so it must never throw: if the database is unavailable
// we fall back to empty arrays and the client refetches from /api/* on mount.
async function loadInitial(): Promise<{
  rows: PatientRow[];
  alerts: RiskAlert[];
  audit: AuditEvent[];
}> {
  try {
    const [rows, alerts, audit] = await Promise.all([
      getPatientRows(),
      getAlerts(),
      getAuditEvents(60),
    ]);
    return { rows, alerts, audit };
  } catch (err) {
    console.error("[careloop] initial data load failed (is Supabase configured?):", err);
    return { rows: [], alerts: [], audit: [] };
  }
}

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "CareLoop — Remote chronic-care monitoring",
  description:
    "CareLoop turns daily Cantonese check-ins, vital signals, and deterministic escalation rules into a nurse-review workflow for elderly Hong Kong patients between clinic visits. Monitoring support — not diagnosis.",
};

export default async function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const { rows, alerts, audit } = await loadInitial();
  return (
    <html lang="en" className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}>
      <body className="min-h-full">
        <AppProvider
          initialRows={rows}
          initialAlerts={alerts}
          initialAudit={audit}
        >
          <TooltipProvider>
            <div className="flex min-h-screen flex-col">
              {children}
              <Footer />
            </div>
            <Toaster richColors position="top-right" theme="light" closeButton />
          </TooltipProvider>
        </AppProvider>
      </body>
    </html>
  );
}
