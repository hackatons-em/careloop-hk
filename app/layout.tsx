import type { Metadata } from "next";
import { Geist, Geist_Mono, Noto_Sans_Arabic } from "next/font/google";
import { NextIntlClientProvider } from "next-intl";
import { getLocale, getTranslations } from "next-intl/server";
import { Toaster } from "sonner";
import "./globals.css";
import { Footer } from "@/components/Footer";
import { TooltipProvider } from "@/components/ui/tooltip";
import { getDir } from "@/lib/direction";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://miruwa.com";

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

// Arabic webfont — Geist has no Arabic glyphs, so the RTL UI would otherwise
// fall back to an unpredictable system face. Scoped to lang="ar" via globals.css.
const notoSansArabic = Noto_Sans_Arabic({
  variable: "--font-arabic",
  subsets: ["arabic"],
  display: "swap",
});

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getLocale();
  const t = await getTranslations("metadata");
  return {
    metadataBase: new URL(SITE_URL),
    title: {
      default: t("rootTitle"),
      template: "%s · Miruwa",
    },
    description: t("rootDescription"),
    applicationName: "Miruwa",
    openGraph: {
      type: "website",
      siteName: "Miruwa",
      locale: locale === "zh-HK" ? "zh_HK" : locale === "ar" ? "ar_AR" : "en_HK",
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
  const dir = getDir(locale);
  const t = await getTranslations("common");
  return (
    <html
      lang={locale}
      dir={dir}
      // The inline script below adds `.js` to <html> before hydration; that
      // intentional className mutation would otherwise trip a hydration
      // attribute warning on this element (next-themes does the same).
      suppressHydrationWarning
      className={`${geistSans.variable} ${geistMono.variable} ${notoSansArabic.variable} h-full antialiased`}
    >
      <body className="min-h-full">
        {/* Mark the document JS-capable before first paint. Scroll-reveal's
            hidden initial state is gated on `.js` (see globals.css), so a
            no-JS visitor — or a crawler — always gets fully-visible content. */}
        <script
          dangerouslySetInnerHTML={{
            __html: "document.documentElement.classList.add('js')",
          }}
        />
        <a
          href="#main"
          className="sr-only focus:not-sr-only focus:fixed focus:start-4 focus:top-4 focus:z-50 focus:rounded-lg focus:bg-primary focus:px-4 focus:py-2 focus:text-sm focus:font-semibold focus:text-primary-foreground"
        >
          {t("skipToContent")}
        </a>
        <NextIntlClientProvider>
          <TooltipProvider>
            <div className="flex min-h-screen flex-col">
              {children}
              <Footer />
            </div>
            <Toaster
              richColors
              position={dir === "rtl" ? "top-left" : "top-right"}
              dir={dir}
              theme="light"
              closeButton
            />
          </TooltipProvider>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
