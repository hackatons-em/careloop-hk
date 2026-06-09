// Administrative state pill. Teal accent on purpose — the red/amber/blue/green
// hues are reserved for clinical severity (see lib/severity.ts).
export function NeedsReviewBadge() {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full border border-primary/20 bg-accent px-2.5 py-0.5 text-xs font-semibold text-accent-foreground">
      <span aria-hidden className="size-1.5 rounded-full bg-primary" />
      Needs review
    </span>
  );
}

export function ArchivedBadge() {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full border border-border bg-muted px-2.5 py-0.5 text-xs font-semibold text-muted-foreground">
      Archived
    </span>
  );
}
