import Link from "next/link";
import { HeartPulse } from "lucide-react";

export function Footer() {
  return (
    <footer className="no-print mt-auto border-t border-border bg-card/50">
      <div className="mx-auto flex max-w-[1180px] flex-col gap-3 px-6 py-6 text-sm text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2">
          <HeartPulse className="size-4 text-primary" />
          <span className="font-medium text-foreground">CareLoop</span>
          <span className="hidden sm:inline">— remote chronic-care monitoring, Hong Kong.</span>
        </div>
        <div className="flex flex-col gap-2 sm:items-end">
          <nav className="flex items-center gap-4 text-xs">
            <Link href="/privacy" className="hover:text-foreground">
              Privacy
            </Link>
            <Link href="/terms" className="hover:text-foreground">
              Terms
            </Link>
            <Link href="/business" className="hover:text-foreground">
              Business case
            </Link>
          </nav>
          <span className="max-w-md text-xs">
            CareLoop flags monitoring risks for professional review. It does not diagnose or
            prescribe.
          </span>
        </div>
      </div>
    </footer>
  );
}
