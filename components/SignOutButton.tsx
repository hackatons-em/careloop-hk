"use client";

import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";

export function SignOutButton() {
  const t = useTranslations("common");
  const router = useRouter();

  async function signOut() {
    await fetch("/api/auth/signout", { method: "POST" }).catch(() => undefined);
    router.replace("/login");
    router.refresh();
  }

  return (
    <Button size="lg" onClick={signOut} className="gap-1.5">
      <LogOut className="size-4" /> {t("signOut")}
    </Button>
  );
}
