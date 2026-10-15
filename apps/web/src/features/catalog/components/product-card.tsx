import { Plus } from "lucide-react";
import { Badge } from "@/components/atoms/badge";
import { IconButton } from "@/components/atoms/icon-button";
import { PriceTag } from "@/components/atoms/price-tag";
import { ProductImage } from "@/components/atoms/product-image";
import { getEffectivePrice, isOnSale } from "@/features/catalog/lib/filter-products";
import type { CatalogProduct } from "@/features/catalog/types";

interface ProductCardProps {
  product: CatalogProduct;
  onAdd?: (product: CatalogProduct) => void;
}

function describeSaleUnit(saleUnit: CatalogProduct["saleUnit"]): string {
  return saleUnit === "WEIGHT" ? "Granel · 100 g" : "Unidad";
}

export function ProductCard({ product, onAdd }: ProductCardProps) {
  const onSale = isOnSale(product);

  return (
    <article className="group flex flex-col justify-between gap-3">
      <div className="relative">
        <ProductImage src={product.imageUrl} alt={product.name} />
        {onSale && <Badge variant="sale" className="absolute left-2 top-2">Oferta</Badge>}
      </div>

      <div className="flex flex-col gap-0.5">
        <span className="text-[11px] font-medium text-brand-muted">
          {describeSaleUnit(product.saleUnit)}
        </span>
        <h3 className="line-clamp-2 text-sm font-medium text-foreground transition-colors group-hover:text-primary">
          {product.name}
        </h3>
      </div>

      <div className="flex items-end justify-between gap-2">
        <PriceTag
          price={getEffectivePrice(product)}
          originalPrice={onSale ? product.price : undefined}
        />
        {onAdd && (
          <IconButton
            aria-label={`Agregar ${product.name} al pedido`}
            onClick={() => onAdd(product)}
          >
            <Plus className="size-5" aria-hidden="true" />
          </IconButton>
        )}
      </div>
    </article>
  );
}
