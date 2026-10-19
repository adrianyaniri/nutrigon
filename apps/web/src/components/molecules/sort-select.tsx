import { ChevronDown } from "lucide-react";
import { useId } from "react";
import { cn } from "@/lib/utils/cn";

interface SelectOption<T extends string> {
  value: T;
  label: string;
}

interface SortSelectProps<T extends string> {
  value: T;
  options: readonly SelectOption<T>[];
  onChange: (value: T) => void;
  label?: string;
  className?: string;
}

/** Native <select>: best UX on mobile (OS picker) and fully accessible for free. */
export function SortSelect<T extends string>({
  value,
  options,
  onChange,
  label = "Ordenar",
  className,
}: SortSelectProps<T>) {
  const id = useId();

  return (
    <div className={cn("flex items-center gap-2", className)}>
      <label htmlFor={id} className="shrink-0 text-xs text-muted-foreground">
        {label}
      </label>
      <div className="relative">
        <select
          id={id}
          value={value}
          onChange={(event) => onChange(event.target.value as T)}
          className="min-h-[44px] appearance-none rounded-lg border border-border bg-card pl-3 pr-9 text-base text-foreground focus-visible:border-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring md:text-sm"
        >
          {options.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        <ChevronDown
          className="pointer-events-none absolute right-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
          aria-hidden="true"
        />
      </div>
    </div>
  );
}
