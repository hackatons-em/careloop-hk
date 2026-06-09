import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { ShieldAlert } from "lucide-react";
import { SignOutButton } from "@/components/SignOutButton";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("auth.noAccess");
  return { title: t("metaTitle"), robots: { index: false, follow: false } };
}

// Shown to a signed-in session that has NO careloop_profiles row — e.g. an
// invite whose provisioning failed, or a deactivated account.
export default async function NoAccessPage() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  const t = await getTranslations("auth.noAccess");

  return (
    <div className="flex flex-1 items-center justify-center px-6 py-16">
      <div className="cl-rise w-full max-w-md rounded-2xl border border-border bg-card p-8 text-center">
        <span className="mx-auto flex size-12 items-center justify-center rounded-full bg-muted">
          <ShieldAlert className="size-6 text-muted-foreground" />
        </span>
        <h1 className="mt-4 text-xl font-semibold tracking-tight">{t("title")}</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          {t("bodyPrefix")} <span className="font-medium text-foreground">{user.email}</span>
          {t("bodySuffix")}
        </p>
        <div className="mt-6 flex justify-center">
          <SignOutButton />
        </div>
      </div>
    </div>
  );
}
