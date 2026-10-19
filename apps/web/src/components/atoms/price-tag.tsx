import { formatPrice } from "@/lib/format/price";
import { cn } from "@/lib/utils/cn";

interface PriceTagProps {
  price: number;
  /** When set, rendered struck-through next to the current price. */
  originalPrice?: number;
  /** Optional unit suffix such as "/ kg" or "/ un." */
  unitLabel?: string;
  className?: string;
}

export function PriceTag({ price, originalPrice, unitLabel, className }: PriceTagProps) {
  return (
    <div className={cn("flex flex-col leading-tight", className)}>
      {originalPrice !== undefined && (
        <span className="text-[11px] text-muted-foreground line-through">
          <span className="sr-only">Precio anterior </span>
          {formatPrice(originalPrice)}
        </span>
      )}
      <span className="flex items-baseline gap-1 text-base font-semibold tracking-tight text-brand-gold-text">
        <span>{formatPrice(price)}</span>
        {unitLabel && (
          <span className="text-[11px] font-medium text-muted-foreground">{unitLabel}</span>
        )}
      </span>
    </div>
  );
}

