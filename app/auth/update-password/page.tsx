import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { UpdatePasswordForm } from "@/components/UpdatePasswordForm";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("auth.updatePassword");
  return { title: t("metaTitle"), robots: { index: false, follow: false } };
}

// Reached from the invite/recovery email via /auth/callback, which has already
// established a session. Requires only a raw session (not a profile) — a fresh
// invitee sets their password before first using the app.
export default async function UpdatePasswordPage() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  return (
    <div className="flex flex-1 items-center justify-center px-6 py-16">
      <UpdatePasswordForm email={user.email ?? ""} />
    </div>
  );
}
