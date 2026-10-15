import { Skeleton } from "@/components/atoms/skeleton";

/** Same footprint as `ProductCard` to eliminate layout shift during loading. */
export function ProductCardSkeleton() {
  return (
    <div
      className="flex h-full w-full flex-col justify-between rounded-2xl border border-brand-border/70 bg-brand-card/90 p-3 sm:p-4"
      aria-hidden="true"
    >
      <div className="flex flex-col gap-3">
        <Skeleton className="aspect-square w-full rounded-xl" />
        <div className="flex flex-col gap-1.5">
          <Skeleton className="h-3 w-1/3" />
          <Skeleton className="h-4 w-3/4" />
          <Skeleton className="h-4 w-1/2" />
        </div>
      </div>
      <div className="mt-3 flex items-center justify-between border-t border-brand-border/40 pt-3">
        <Skeleton className="h-5 w-16" />
        <Skeleton className="size-11 rounded-full" />
      </div>
    </div>
  );
}
