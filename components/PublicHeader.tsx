import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { HeartPulse } from "lucide-react";
import { LocaleSwitcher } from "@/components/LocaleSwitcher";

/** Slim header for the public marketing/info pages — same chrome as the app
 * header, minus the app nav and account menu. */
export async function PublicHeader() {
  const t = await getTranslations("nav");
  const tc = await getTranslations("common");
  const links = [
    { href: "/#how-it-works", label: t("howItWorks") },
    { href: "/pricing", label: t("pricing") },
    { href: "/security", label: t("security") },
    { href: "/contact", label: t("contact") },
  ];

  return (
    <header className="no-print sticky top-0 z-40 border-b border-border bg-card/80 backdrop-blur">
      <div className="mx-auto flex max-w-[1180px] items-center gap-3 px-6 py-3">
        <Link href="/" className="flex items-center gap-2">
          <span className="flex size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <HeartPulse className="size-5" />
          </span>
          <span className="text-lg font-semibold tracking-tight">CareLoop</span>
        </Link>
        <nav className="ml-auto flex items-center gap-1">
          {links.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className="hidden rounded-md px-3 py-1.5 text-sm font-medium text-muted-foreground outline-none transition-colors hover:text-foreground focus-visible:text-foreground focus-visible:ring-2 focus-visible:ring-ring sm:inline-flex"
            >
              {l.label}
            </Link>
          ))}
          <LocaleSwitcher className="ml-1" />
          <Link
            href="/login"
            className="ml-1 inline-flex h-9 items-center rounded-lg bg-primary px-4 text-sm font-semibold text-primary-foreground outline-none transition-colors hover:bg-primary/90 focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
          >
            {tc("signIn")}
          </Link>
        </nav>
      </div>
    </header>
  );
}
