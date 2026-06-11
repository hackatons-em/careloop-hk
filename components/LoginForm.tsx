"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { HeartPulse, Loader2 } from "lucide-react";
import { z } from "zod";
import { Field } from "@/components/forms/Field";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { createSupabaseBrowserClient } from "@/lib/supabase/browser";

const schema = z.object({
  email: z.string().trim().email(),
  password: z.string().min(1),
});

export function LoginForm({ next }: { next?: string }) {
  const t = useTranslations("auth.login");
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fieldErrors, setFieldErrors] = useState<{ email?: string; password?: string }>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setFormError(null);

    const parsed = schema.safeParse({ email, password });
    if (!parsed.success) {
      const errs: { email?: string; password?: string } = {};
      for (const issue of parsed.error.issues) {
        const key = issue.path[0] as "email" | "password";
        if (!errs[key]) errs[key] = t(`errors.${key}`);
      }
      setFieldErrors(errs);
      return;
    }
    setFieldErrors({});
    setSubmitting(true);

    const supabase = createSupabaseBrowserClient();
    const { error } = await supabase.auth.signInWithPassword(parsed.data);
    if (error) {
      setSubmitting(false);
      setFormError(
        error.message === "Invalid login credentials" ? t("invalidCredentials") : error.message,
      );
      return;
    }
    // Same-site paths only — "//evil.example" is protocol-relative, reject it.
    const target = next && next.startsWith("/") && !next.startsWith("//") ? next : "/dashboard";
    router.replace(target);
    router.refresh();
  }

  return (
    <div className="cl-rise w-full max-w-sm rounded-2xl border border-border bg-card p-6">
      <div className="flex items-center gap-2">
        <span className="flex size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
          <HeartPulse className="size-5" />
        </span>
        <span className="text-lg font-semibold tracking-tight">Miruwa</span>
      </div>
      <h1 className="mt-5 text-xl font-semibold tracking-tight">{t("title")}</h1>
      <p className="mt-1 text-sm text-muted-foreground">{t("sub")}</p>

      {formError && (
        <div
          role="alert"
          className="mt-4 rounded-lg border border-destructive/30 bg-destructive/5 px-3 py-2 text-sm text-destructive"
        >
          {formError}
        </div>
      )}

      <form onSubmit={onSubmit} className="mt-5 flex flex-col gap-4" noValidate>
        <Field label={t("email")} error={fieldErrors.email} required>
          {(props) => (
            <Input
              {...props}
              type="email"
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder={t("emailPlaceholder")}
            />
          )}
        </Field>
        <Field label={t("password")} error={fieldErrors.password} required>
          {(props) => (
            <Input
              {...props}
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          )}
        </Field>
        <Button type="submit" size="lg" disabled={submitting} className="mt-1 w-full">
          {submitting && <Loader2 className="size-4 animate-spin" />}
          {submitting ? t("submitting") : t("submit")}
        </Button>
      </form>

      <p className="mt-5 text-xs text-muted-foreground">{t("microcopy")}</p>
    </div>
  );
}
