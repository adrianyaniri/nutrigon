import { useState } from "react";
import { Wheat } from "lucide-react";
import { cn } from "@/lib/utils/cn";

interface ProductImageProps {
  src: string | null;
  alt: string;
  className?: string;
}

/**
 * Square image with a lazy-loaded <img> and a branded fallback.
 * The fixed aspect ratio reserves space up front, avoiding layout shift.
 */
export function ProductImage({ src, alt, className }: ProductImageProps) {
  const [failed, setFailed] = useState(false);
  const showImage = src !== null && !failed;

  return (
    <div
      className={cn(
        "relative aspect-square w-full overflow-hidden rounded-xl bg-brand-surface",
        className
      )}
    >
      {showImage ? (
        <img
          src={src}
          alt={alt}
          loading="lazy"
          decoding="async"
          onError={() => setFailed(true)}
          className="size-full object-cover transition-transform duration-300 group-hover:scale-105"
        />
      ) : (
        <div
          role="img"
          aria-label={alt}
          className="flex size-full items-center justify-center text-brand-gold/40"
        >
          <Wheat className="size-1/3" aria-hidden="true" />
        </div>
      )}
    </div>
  );
}
