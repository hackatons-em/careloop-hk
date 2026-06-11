"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTranslations } from "next-intl";
import { HeartPulse, Bell, Menu, X } from "lucide-react";
import { useApp } from "@/components/AppProvider";
import { UserMenu, type HeaderUser } from "@/components/UserMenu";
import { cn } from "@/lib/utils";

export function Header({ user }: { user: HeaderUser }) {
  const t = useTranslations("nav");
  const pathname = usePathname();
  const { alerts, degraded } = useApp();
  const [menuOpen, setMenuOpen] = useState(false);
  const openAlerts = alerts.filter((a) => a.status !== "resolved").length;

  const nav = [
    { href: "/dashboard", label: t("dashboard") },
    { href: "/alerts", label: t("alerts") },
    // Program outcomes is the admin/renewal view.
    ...(user.role === "admin" ? [{ href: "/program", label: t("program") }] : []),
  ];

  return (
    <header className="no-print sticky top-0 z-40 border-b border-border bg-card/80 backdrop-blur">
      <div className="mx-auto flex max-w-[1180px] items-center gap-4 px-6 py-3">
        <Link href="/" className="flex items-center gap-2">
          <span className="flex size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <HeartPulse className="size-5" />
          </span>
          <span className="text-lg font-semibold tracking-tight">Miruwa</span>
        </Link>

        <nav className="ml-2 hidden items-center gap-1 md:flex">
          {nav.map((item) => {
            const active = pathname === item.href || pathname.startsWith(item.href + "/");
            return (
              <Link
                key={item.href}
                href={item.href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "relative rounded-md px-3 py-1.5 text-sm font-medium transition-colors",
                  active
                    ? "bg-accent text-accent-foreground"
                    : "text-muted-foreground hover:text-foreground",
                )}
              >
                {item.label}
                {item.href === "/alerts" && openAlerts > 0 && (
                  <span className="ml-1.5 inline-flex min-w-5 items-center justify-center rounded-full bg-red-500 px-1 text-[11px] font-semibold text-white">
                    {openAlerts}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>

        <div className="ml-auto flex items-center gap-1.5">
          {degraded && (
            <span className="hidden items-center gap-1.5 rounded-full border border-border bg-muted px-2.5 py-0.5 text-xs font-medium text-muted-foreground sm:inline-flex">
              <span aria-hidden className="size-1.5 animate-pulse rounded-full bg-muted-foreground" />
              {t("reconnecting")}
            </span>
          )}

          <Link
            href="/alerts"
            aria-label={openAlerts ? t("alertsAria", { count: openAlerts }) : t("alertsAriaNone")}
            className="relative flex size-9 items-center justify-center rounded-md text-muted-foreground outline-none hover:bg-accent hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring md:hidden"
          >
            <Bell className="size-5" />
            {openAlerts > 0 && (
              <span className="absolute -right-0.5 -top-0.5 flex size-4 items-center justify-center rounded-full bg-red-500 text-[10px] font-semibold text-white">
                {openAlerts}
              </span>
            )}
          </Link>

          <button
            type="button"
            aria-label={menuOpen ? t("closeMenu") : t("openMenu")}
            aria-expanded={menuOpen}
            aria-controls="mobile-nav"
            onClick={() => setMenuOpen((v) => !v)}
            className="flex size-9 items-center justify-center rounded-md text-muted-foreground outline-none hover:bg-accent hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring md:hidden"
          >
            {menuOpen ? <X className="size-5" /> : <Menu className="size-5" />}
          </button>

          <UserMenu user={user} />
        </div>
      </div>

      {menuOpen && (
        <nav
          id="mobile-nav"
          className="cl-fade border-t border-border bg-card px-6 py-3 md:hidden"
        >
          <div className="flex flex-col gap-1">
            {nav.map((item) => {
              const active = pathname === item.href || pathname.startsWith(item.href + "/");
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  aria-current={active ? "page" : undefined}
                  onClick={() => setMenuOpen(false)}
                  className={cn(
                    "rounded-md px-3 py-2 text-sm font-medium transition-colors",
                    active
                      ? "bg-accent text-accent-foreground"
                      : "text-muted-foreground hover:text-foreground",
                  )}
                >
                  {item.label}
                  {item.href === "/alerts" && openAlerts > 0 && (
                    <span className="ml-1.5 inline-flex min-w-5 items-center justify-center rounded-full bg-red-500 px-1 text-[11px] font-semibold text-white">
                      {openAlerts}
                    </span>
                  )}
                </Link>
              );
            })}
          </div>
        </nav>
      )}
    </header>
  );
}
