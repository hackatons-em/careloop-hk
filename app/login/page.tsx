import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { LoginForm } from "@/components/LoginForm";
import { getAuthContext } from "@/lib/auth";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Sign in",
  robots: { index: false, follow: false },
};

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  // A full auth context (session + profile) goes straight to the app. A session
  // WITHOUT a profile stays here so the user can sign out instead of looping.
  const ctx = await getAuthContext();
  const { next } = await searchParams;
  // Same-site paths only — "//evil.example" is protocol-relative, reject it.
  const safeNext = next && next.startsWith("/") && !next.startsWith("//") ? next : "/dashboard";
  if (ctx) redirect(safeNext);

  return (
    <div className="flex flex-1 items-center justify-center px-6 py-16">
      <LoginForm next={next} />
    </div>
  );
}
