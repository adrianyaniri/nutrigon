import { formatPrice } from "@/lib/format/price";
import { cn } from "@/lib/utils/cn";

interface PriceTagProps {
  price: number;
  /** When set, rendered struck-through next to the current price. */
  originalPrice?: number;
  className?: string;
}

export function PriceTag({ price, originalPrice, className }: PriceTagProps) {
  return (
    <div className={cn("flex flex-col leading-tight", className)}>
      {originalPrice !== undefined && (
        <span className="text-[11px] text-brand-muted line-through">
          <span className="sr-only">Precio anterior </span>
          {formatPrice(originalPrice)}
        </span>
      )}
      <span className="text-base font-semibold tracking-tight text-brand-gold">
        {formatPrice(price)}
      </span>
    </div>
  );
}
