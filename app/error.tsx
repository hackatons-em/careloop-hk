"use client";

import { useEffect } from "react";
import Link from "next/link";
import * as Sentry from "@sentry/nextjs";
import { AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function AppError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[careloop] unhandled error:", error);
    Sentry.captureException(error);
  }, [error]);

  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center px-4 text-center">
      <span className="flex size-12 items-center justify-center rounded-full bg-destructive/10 text-destructive">
        <AlertTriangle className="size-6" />
      </span>
      <h1 className="mt-4 text-xl font-semibold">Something went wrong</h1>
      <p className="mt-1 max-w-md text-sm text-muted-foreground">
        An unexpected error occurred. Your data is safe — try again, or head back to the
        dashboard.
      </p>
      <div className="mt-5 flex gap-2">
        <Button size="sm" onClick={() => reset()}>
          Try again
        </Button>
        <Link
          href="/dashboard"
          className="inline-flex h-7 items-center rounded-lg border border-border px-3 text-[0.8rem] font-medium hover:bg-muted"
        >
          Back to dashboard
        </Link>
      </div>
    </div>
  );
}
