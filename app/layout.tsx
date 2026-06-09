import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Toaster } from "sonner";
import "./globals.css";
import { Footer } from "@/components/Footer";
import { TooltipProvider } from "@/components/ui/tooltip";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://careloop-hk.vercel.app";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: "CareLoop — Remote chronic-care monitoring",
    template: "%s · CareLoop",
  },
  description:
    "CareLoop turns daily Cantonese check-ins, vital signals, and deterministic escalation rules into a nurse-review workflow for elderly Hong Kong patients between clinic visits. Monitoring support — not diagnosis.",
  applicationName: "CareLoop",
  openGraph: {
    type: "website",
    siteName: "CareLoop",
    locale: "en_HK",
    title: "CareLoop — Remote chronic-care monitoring",
    description:
      "Daily WhatsApp check-ins, deterministic risk rules, and an exception-first nurse dashboard for chronic care between clinic visits.",
    url: SITE_URL,
  },
  twitter: {
    card: "summary_large_image",
    title: "CareLoop — Remote chronic-care monitoring",
    description:
      "Daily WhatsApp check-ins, deterministic risk rules, and an exception-first nurse dashboard for chronic care between clinic visits.",
  },
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}>
      <body className="min-h-full">
        <a
          href="#main"
          className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50 focus:rounded-lg focus:bg-primary focus:px-4 focus:py-2 focus:text-sm focus:font-semibold focus:text-primary-foreground"
        >
          Skip to main content
        </a>
        <TooltipProvider>
          <div className="flex min-h-screen flex-col">
            {children}
            <Footer />
          </div>
          <Toaster richColors position="top-right" theme="light" closeButton />
        </TooltipProvider>
      </body>
    </html>
  );
}
