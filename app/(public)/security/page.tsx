import type { Metadata } from "next";
import Link from "next/link";
import { getTranslations } from "next-intl/server";
import {
  ArrowRight,
  Award,
  Bug,
  Database,
  FileSearch,
  Globe2,
  KeyRound,
  Lock,
  ScanEye,
  ShieldCheck,
} from "lucide-react";
import { cn } from "@/lib/utils";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("metadata");
  return { title: t("securityTitle"), description: t("securityDescription") };
}

export default async function SecurityPage() {
  const t = await getTranslations("public.security");

  const cards: {
    icon: React.ElementType;
    title: string;
    body: string;
    tone?: "warn";
    wide?: boolean;
  }[] = [
    { icon: ShieldCheck, title: t("isolationTitle"), body: t("isolationBody"), wide: true },
    { icon: KeyRound, title: t("accessTitle"), body: t("accessBody") },
    { icon: Lock, title: t("encryptionTitle"), body: t("encryptionBody") },
    { icon: FileSearch, title: t("auditTitle"), body: t("auditBody") },
    { icon: ScanEye, title: t("deterministicTitle"), body: t("deterministicBody") },
    { icon: Globe2, title: t("residencyTitle"), body: t("residencyBody") },
    { icon: Database, title: t("backupsTitle"), body: t("backupsBody") },
    { icon: Award, title: t("certsTitle"), body: t("certsBody"), tone: "warn", wide: true },
    { icon: Bug, title: t("reportingTitle"), body: t("reportingBody") },
  ];

  return (
    <div className="space-y-8 py-4">
      <div>
        <h1 className="text-3xl font-semibold tracking-tight">{t("title")}</h1>
        <p className="mt-2 max-w-2xl text-sm text-muted-foreground">{t("sub")}</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        {cards.map((c, i) => (
          <section
            key={c.title}
            className={cn(
              "cl-rise rounded-2xl border border-border bg-card p-6",
              c.wide && "sm:col-span-2",
            )}
            style={{ animationDelay: `${i * 60}ms` }}
          >
            <div className="flex items-center gap-2">
              <span
                className={cn(
                  "flex size-9 items-center justify-center rounded-xl",
                  c.tone === "warn"
                    ? "bg-amber-50 text-amber-700"
                    : "bg-accent text-accent-foreground",
                )}
              >
                <c.icon className="size-5" />
              </span>
              <h2 className="text-lg font-semibold">{c.title}</h2>
            </div>
            <p className="mt-3 text-sm leading-relaxed text-foreground/90">{c.body}</p>
          </section>
        ))}
      </div>

      <section
        className="cl-rise rounded-2xl border border-border bg-card p-8 text-center"
        style={{ animationDelay: "540ms" }}
      >
        <h2 className="text-xl font-semibold tracking-tight">{t("ctaTitle")}</h2>
        <p className="mx-auto mt-2 max-w-xl text-sm text-muted-foreground">{t("ctaSub")}</p>
        <div className="mt-5 flex justify-center">
          <Link
            href="/contact?interest=other"
            className="inline-flex h-10 items-center gap-1.5 rounded-lg bg-primary px-5 text-sm font-semibold text-primary-foreground outline-none transition-colors hover:bg-primary/90 focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
          >
            {t("ctaButton")} <ArrowRight className="size-4 rtl:rotate-180" />
          </Link>
        </div>
      </section>
    </div>
  );
}
