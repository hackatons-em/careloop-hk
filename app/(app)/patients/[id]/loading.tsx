import { Skeleton } from "@/components/ui/skeleton";

export default function PatientLoading() {
  return (
    <div className="cl-fade flex flex-col gap-4">
      <Skeleton className="h-4 w-36" />

      {/* header card */}
      <div className="rounded-2xl border border-border bg-card p-5">
        <div className="flex items-center gap-3">
          <Skeleton className="h-7 w-40" />
          <Skeleton className="h-5 w-24 rounded-full" />
        </div>
        <Skeleton className="mt-2 h-4 w-72 max-w-full" />
        <Skeleton className="mt-4 h-4 w-96 max-w-full" />
      </div>

      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(360px,420px)]">
        <div className="space-y-4">
          <div className="rounded-2xl border border-border bg-card p-5">
            <Skeleton className="h-4 w-32" />
            <Skeleton className="mt-3 h-4 w-full" />
            <Skeleton className="mt-2 h-4 w-5/6" />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            {Array.from({ length: 2 }).map((_, i) => (
              <div key={i} className="rounded-2xl border border-border bg-card p-4">
                <Skeleton className="h-4 w-28" />
                <Skeleton className="mt-3 h-36 w-full rounded-lg" />
              </div>
            ))}
          </div>
        </div>
        <div className="rounded-2xl border border-border bg-card p-4">
          <Skeleton className="h-4 w-40" />
          <div className="mt-4 space-y-3">
            <Skeleton className="ml-auto h-12 w-3/4 rounded-xl" />
            <Skeleton className="h-12 w-3/4 rounded-xl" />
            <Skeleton className="ml-auto h-12 w-2/3 rounded-xl" />
          </div>
        </div>
      </div>
    </div>
  );
}
