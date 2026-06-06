import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Toaster } from "sonner";
import "./globals.css";
import { AppProvider } from "@/components/AppProvider";
import { Footer } from "@/components/Footer";
import { TooltipProvider } from "@/components/ui/tooltip";
import { getAlerts, getAuditEvents, getPatientRows } from "@/lib/store";

export const dynamic = "force-dynamic";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "CareLoop HK — Remote chronic-care monitoring",
  description:
    "CareLoop HK turns daily Cantonese check-ins, vital signals, and deterministic escalation rules into a nurse-review workflow for elderly Hong Kong patients between clinic visits. Monitoring support — not diagnosis.",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}>
      <body className="min-h-full">
        <AppProvider
          initialRows={getPatientRows()}
          initialAlerts={getAlerts()}
          initialAudit={getAuditEvents(60)}
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
