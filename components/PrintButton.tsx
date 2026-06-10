"use client";

import { Printer } from "lucide-react";

export function PrintButton({ label }: { label: string }) {
  return (
    <button
      type="button"
      onClick={() => window.print()}
      className="inline-flex h-10 items-center gap-2 rounded-lg border border-border bg-card px-4 text-sm font-semibold outline-none hover:bg-muted focus-visible:ring-2 focus-visible:ring-ring print:hidden"
    >
      <Printer className="size-4" /> {label}
    </button>
  );
}
