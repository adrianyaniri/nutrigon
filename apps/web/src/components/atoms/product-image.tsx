import { useEffect, useState } from "react";
import { Wheat } from "lucide-react";
import { cn } from "@/lib/utils/cn";

/**
 * Official default product image uploaded to Cloudflare R2.
 * Used whenever a product or combo does not have a custom image.
 */
export const DEFAULT_PRODUCT_IMAGE =
  "https://pub-3df551b85a3a4afaa8eb83412eb15375.r2.dev/products/test-connection-1792155403129.jpg";

export const FALLBACK_LOCAL_IMAGE = "/Logo.jpeg";

interface ProductImageProps {
  src?: string | null;
  alt: string;
  className?: string;
  fallbackSrc?: string;
}

/**
 * Square image with lazy loading and branded fallback to the Nutrigon R2 image.
 * If no image is provided or loading fails, it uses the official Nutrigon default image.
 */
export function ProductImage({
  src,
  alt,
  className,
  fallbackSrc = DEFAULT_PRODUCT_IMAGE,
}: ProductImageProps) {
  const initial = src?.trim() ? src.trim() : fallbackSrc;
  const [currentSrc, setCurrentSrc] = useState<string>(initial);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    const next = src?.trim() ? src.trim() : fallbackSrc;
    setCurrentSrc(next);
    setFailed(false);
  }, [src, fallbackSrc]);

  function handleError() {
    if (currentSrc !== FALLBACK_LOCAL_IMAGE) {
      setCurrentSrc(FALLBACK_LOCAL_IMAGE);
    } else {
      setFailed(true);
    }
  }

  return (
    <div
      className={cn(
        "relative aspect-square w-full overflow-hidden rounded-xl bg-brand-surface",
        className
      )}
    >
      {!failed ? (
        <img
          src={currentSrc}
          alt={alt}
          loading="lazy"
          decoding="async"
          onError={handleError}
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
