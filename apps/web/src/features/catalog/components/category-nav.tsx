import type { CategoryOption } from "@/features/catalog/types";
import { cn } from "@/lib/utils/cn";

interface CategoryNavProps {
  options: readonly CategoryOption[];
  value: string | null;
  onChange: (value: string | null) => void;
}

/** Vertical category list for the desktop sidebar. */
export function CategoryNav({ options, value, onChange }: CategoryNavProps) {
  return (
    <nav aria-label="Categorías">
      <h2 className="mb-3 px-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
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
                  "flex min-h-[44px] w-full items-center justify-between rounded-lg px-3 text-sm transition-colors",
                  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                  selected
                    ? "bg-card font-semibold text-primary"
                    : "text-muted-foreground hover:bg-card/60 hover:text-foreground"
                )}
              >
                <span>{option.label}</span>
                <span className="text-xs text-muted-foreground">{option.count}</span>
              </button>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
