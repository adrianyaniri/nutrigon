import type { CategoryOption } from "@/features/catalog/types";
import { cn } from "@/lib/utils/cn";
import { getCategoryIcon } from "../lib/category-icons";

interface CategoryChipsProps {
  options: readonly CategoryOption[];
  value: string | null;
  onChange: (value: string | null) => void;
}

/**
 * Tactile, horizontal scrolling category dock for mobile viewports.
 * Uses organic icons, clear counts, and warm gold active states.
 */
export function CategoryChips({ options, value, onChange }: CategoryChipsProps) {
  return (
    <nav aria-label="Categorías" className="relative">
      <ul className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-2 pt-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {options.map((option) => {
          const isSelected = option.value === value;
          const icon = getCategoryIcon(option.value);

          return (
            <li key={option.value ?? "all"} className="shrink-0">
              <button
                type="button"
                role="button"
                aria-pressed={isSelected}
                onClick={() => onChange(option.value)}
                className={cn(
                  "flex min-h-[44px] items-center gap-2 rounded-2xl px-3.5 py-2 text-xs sm:text-sm font-medium transition-all select-none border",
                  isSelected
                    ? "border-brand-gold bg-brand-gold/15 text-white ring-1 ring-brand-gold/40 shadow-xs font-semibold"
                    : "border-border/80 bg-brand-surface/70 text-zinc-300 hover:border-brand-gold/40 hover:bg-brand-surface hover:text-white"
                )}
              >
                <span className="text-sm sm:text-base leading-none" aria-hidden="true">
                  {icon}
                </span>
                <span>{option.label}</span>
                <span
                  className={cn(
                    "rounded-full px-1.5 py-0.5 text-[10px] font-bold tabular-nums",
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
