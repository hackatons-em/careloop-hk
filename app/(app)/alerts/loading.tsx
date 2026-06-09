import { Skeleton } from "@/components/ui/skeleton";

export default function AlertsLoading() {
  return (
    <div className="cl-fade space-y-4">
      <div>
        <Skeleton className="h-7 w-64" />
        <Skeleton className="mt-2 h-4 w-96 max-w-full" />
      </div>

      <Skeleton className="h-9 w-64 rounded-lg" />

      {Array.from({ length: 3 }).map((_, i) => (
        <div key={i} className="rounded-2xl border border-border bg-card p-4">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <Skeleton className="h-5 w-20 rounded-full" />
              <Skeleton className="h-4 w-28" />
            </div>
            <Skeleton className="h-4 w-32" />
          </div>
          <Skeleton className="mt-3 h-4 w-full max-w-lg" />
          <Skeleton className="mt-2 h-4 w-72 max-w-full" />
          <div className="mt-4 flex gap-2">
            <Skeleton className="h-8 flex-1 rounded-lg" />
            <Skeleton className="h-8 w-32 rounded-lg" />
          </div>
        </div>
      ))}
    </div>
  );
}
