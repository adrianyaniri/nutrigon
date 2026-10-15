import { Chip } from "@/components/atoms/chip";
import type { CategoryOption } from "@/features/catalog/types";

interface CategoryChipsProps {
  options: readonly CategoryOption[];
  value: string | null;
  onChange: (value: string | null) => void;
}

/** Horizontally scrollable category filter for small screens. */
export function CategoryChips({ options, value, onChange }: CategoryChipsProps) {
  return (
    <nav aria-label="Categorías">
      <ul className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {options.map((option) => (
          <li key={option.value ?? "all"} className="shrink-0">
            <Chip selected={option.value === value} onClick={() => onChange(option.value)}>
              {option.label}
            </Chip>
          </li>
        ))}
      </ul>
    </nav>
  );
}
