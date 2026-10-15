import type { CategoryOption } from "@/features/catalog/types";
import { cn } from "@/lib/utils/cn";
import { getCategoryIcon } from "../lib/category-icons";

interface CategoryNavProps {
  options: readonly CategoryOption[];
  value: string | null;
  onChange: (value: string | null) => void;
}

/**
 * Refined vertical category dock for desktop viewports.
 * Displays organic icons, clear counts, and active gold indicator styling.
 */
export function CategoryNav({ options, value, onChange }: CategoryNavProps) {
  return (
    <nav aria-label="Categorías" className="space-y-3">
      <div className="flex items-center gap-2 px-3 text-xs font-bold uppercase tracking-wider text-brand-gold">
        <span>Despensa &amp; Categorías</span>
      </div>
      <ul className="space-y-1.5">
        {options.map((option) => {
          const selected = option.value === value;
          const icon = getCategoryIcon(option.value);

          return (
            <li key={option.value ?? "all"}>
              <button
                type="button"
                aria-current={selected ? "true" : undefined}
                onClick={() => onChange(option.value)}
                className={cn(
                  "group flex min-h-[46px] w-full items-center justify-between rounded-xl px-3.5 text-sm transition-all border",
                  selected
                    ? "border-brand-gold/60 bg-brand-gold/15 font-semibold text-white shadow-xs"
                    : "border-transparent text-zinc-300 hover:border-border hover:bg-brand-surface hover:text-white"
                )}
              >
                <div className="flex items-center gap-2.5">
                  <span className="text-base" aria-hidden="true">
                    {icon}
                  </span>
                  <span>{option.label}</span>
                </div>
                <span
                  className={cn(
                    "rounded-full px-2 py-0.5 text-[11px] font-semibold tabular-nums transition-colors",
                    selected
                      ? "bg-brand-gold text-brand-surface font-bold"
                      : "bg-muted/80 text-muted-foreground group-hover:bg-muted"
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
