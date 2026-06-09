import Link from "next/link";
import { useTranslations } from "next-intl";
import { HeartPulse } from "lucide-react";
import { LocaleSwitcher } from "@/components/LocaleSwitcher";

export function Footer() {
  const t = useTranslations("footer");
  const links = [
    { href: "/pricing", label: t("pricing") },
    { href: "/security", label: t("security") },
    { href: "/contact", label: t("contact") },
    { href: "/business", label: t("businessCase") },
    { href: "/privacy", label: t("privacy") },
    { href: "/terms", label: t("terms") },
  ];

  return (
    <footer className="no-print mt-auto border-t border-border bg-card/50">
      <div className="mx-auto flex max-w-[1180px] flex-col gap-3 px-6 py-6 text-sm text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <HeartPulse className="size-4 text-primary" />
            <span className="font-medium text-foreground">CareLoop</span>
            <span className="hidden sm:inline">{t("tagline")}</span>
          </div>
          <LocaleSwitcher />
        </div>
        <div className="flex flex-col gap-2 sm:items-end">
          <nav className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs">
            {links.map((l) => (
              <Link key={l.href} href={l.href} className="hover:text-foreground">
                {l.label}
              </Link>
            ))}
          </nav>
          <span className="max-w-md text-xs">{t("disclaimer")}</span>
        </div>
      </div>
    </footer>
  );
}
