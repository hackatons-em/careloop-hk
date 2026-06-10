import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { NextIntlClientProvider } from "next-intl";
import { getLocale, getTranslations } from "next-intl/server";
import { Toaster } from "sonner";
import "./globals.css";
import { Footer } from "@/components/Footer";
import { TooltipProvider } from "@/components/ui/tooltip";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://careloop-hk.vercel.app";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
  // "optional": paint immediately with the metric-adjusted fallback instead
  // of re-painting (and re-timing LCP) when the webfont lands; Geist still
  // renders on fast and repeat visits.
  display: "optional",
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
  // Mono only renders small code chips — keep it off the critical path.
  preload: false,
});

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getLocale();
  const t = await getTranslations("metadata");
  return {
    metadataBase: new URL(SITE_URL),
    title: {
      default: t("rootTitle"),
      template: "%s · CareLoop",
    },
    description: t("rootDescription"),
    applicationName: "CareLoop",
    openGraph: {
      type: "website",
      siteName: "CareLoop",
      locale: locale === "zh-HK" ? "zh_HK" : "en_HK",
      title: t("rootTitle"),
      description: t("ogDescription"),
      url: SITE_URL,
    },
    twitter: {
      card: "summary_large_image",
      title: t("rootTitle"),
      description: t("ogDescription"),
    },
  };
}

export default async function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const locale = await getLocale();
  const t = await getTranslations("common");
  return (
    <html
      lang={locale}
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full">
        <a
          href="#main"
          className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50 focus:rounded-lg focus:bg-primary focus:px-4 focus:py-2 focus:text-sm focus:font-semibold focus:text-primary-foreground"
        >
          {t("skipToContent")}
        </a>
        <NextIntlClientProvider>
          <TooltipProvider>
            <div className="flex min-h-screen flex-col">
              {children}
              <Footer />
            </div>
            <Toaster richColors position="top-right" theme="light" closeButton />
          </TooltipProvider>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
