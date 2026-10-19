import type { CategoryOption } from "@/features/catalog/types";
import { cn } from "@/lib/utils/cn";

interface CategoryNavProps {
  options: readonly CategoryOption[];
  value: string | null;
  onChange: (value: string | null) => void;
}

/**
 * Editorial, typography-first vertical category menu for desktop viewports.
 * Free of emojis or clutter; focuses on clean hierarchy and clear counts.
 */
export function CategoryNav({ options, value, onChange }: CategoryNavProps) {
  return (
    <nav aria-label="Categorías" className="space-y-3">
      <h2 className="px-3 text-xs font-bold uppercase tracking-wider text-brand-gold-text">
        Categorías
      </h2>
      <ul className="space-y-1">
        {options.map((option) => {
          const selected = option.value === value;

          return (
            <li key={option.value ?? "all"}>
              <button
                type="button"
                aria-current={selected ? "true" : undefined}
                onClick={() => onChange(option.value)}
                className={cn(
                  "group flex min-h-[44px] w-full items-center justify-between rounded-xl px-3.5 text-sm transition-all border",
                  selected
                    ? "border-brand-gold/60 bg-brand-gold/15 font-semibold text-foreground shadow-2xs"
                    : "border-transparent text-muted-foreground hover:border-border hover:bg-brand-surface hover:text-foreground"
                )}
              >
                <span>{option.label}</span>
                <span
                  className={cn(
                    "rounded-full px-2 py-0.5 text-[11px] font-semibold tabular-nums transition-colors",
                    selected
                      ? "bg-brand-gold text-brand-dark font-bold"
                      : "bg-muted/70 text-muted-foreground group-hover:bg-muted"
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
