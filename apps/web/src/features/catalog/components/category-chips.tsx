import { Menu } from "lucide-react";
import type { CategoryOption } from "@/features/catalog/types";
import { cn } from "@/lib/utils/cn";

interface CategoryChipsProps {
  options: readonly CategoryOption[];
  value: string | null;
  onChange: (value: string | null) => void;
  onOpenDrawer?: () => void;
}

/**
 * Clean, typography-first horizontal scrolling category dock with integrated
 * hamburger drawer trigger for mobile viewports. Zero emojis.
 */
export function CategoryChips({
  options,
  value,
  onChange,
  onOpenDrawer,
}: CategoryChipsProps) {
  return (
    <nav aria-label="Categorías" className="flex items-center gap-2">
      {onOpenDrawer && (
        <button
          type="button"
          onClick={onOpenDrawer}
          aria-label="Abrir todas las categorías"
          className="flex min-h-[44px] shrink-0 items-center gap-1.5 rounded-2xl border border-brand-gold/40 bg-brand-surface/90 px-3.5 py-2 text-xs font-semibold text-brand-gold hover:border-brand-gold hover:text-white transition-colors shadow-2xs"
        >
          <Menu className="size-4" aria-hidden="true" />
          <span>Categorías</span>
        </button>
      )}

      <ul className="-mx-1 flex flex-1 gap-2 overflow-x-auto px-1 pb-1 pt-0.5 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {options.map((option) => {
          const isSelected = option.value === value;

          return (
            <li key={option.value ?? "all"} className="shrink-0">
              <button
                type="button"
                aria-pressed={isSelected}
                onClick={() => onChange(option.value)}
                className={cn(
                  "flex min-h-[44px] items-center gap-1.5 rounded-2xl px-3.5 py-2 text-xs sm:text-sm font-medium transition-all select-none border",
                  isSelected
                    ? "border-brand-gold bg-brand-gold/15 text-white ring-1 ring-brand-gold/40 shadow-xs font-semibold"
                    : "border-border/80 bg-brand-surface/70 text-zinc-300 hover:border-brand-gold/40 hover:bg-brand-surface hover:text-white"
                )}
              >
                <span>{option.label}</span>
                <span
                  className={cn(
                    "rounded-full px-1.5 py-0.5 text-[11px] font-bold tabular-nums",
                    isSelected
                      ? "bg-brand-gold text-brand-surface font-extrabold"
                      : "bg-muted text-muted-foreground"
                  )}
                >
                  {option.count}
                </span>
              </button>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
