import { Skeleton } from "@/components/atoms/skeleton";

/** Same footprint as `ProductCard` so the grid does not shift when data arrives. */
export function ProductCardSkeleton() {
  return (
    <div className="flex flex-col gap-3" aria-hidden="true">
      <Skeleton className="aspect-square w-full rounded-xl" />
      <div className="flex flex-col gap-2">
        <Skeleton className="h-3 w-1/3" />
        <Skeleton className="h-4 w-3/4" />
      </div>
      <div className="flex items-end justify-between">
        <Skeleton className="h-5 w-16" />
        <Skeleton className="size-11 rounded-full" />
      </div>
    </div>
  );
}
