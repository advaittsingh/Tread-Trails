import { Skeleton } from "@/components/ui/skeleton";

export default function ProductsLoading() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
      <div className="mb-14 space-y-4">
        <Skeleton className="h-4 w-40 rounded-full" />
        <Skeleton className="h-12 max-w-xl rounded-lg" />
        <Skeleton className="h-20 max-w-2xl rounded-lg" />
      </div>
      <div className="grid gap-8 sm:grid-cols-2 xl:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <Skeleton key={i} className="h-[420px] rounded-2xl" />
        ))}
      </div>
    </div>
  );
}
