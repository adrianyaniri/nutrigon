import { cn } from "@/lib/utils/cn";

interface BranchOption {
  slug: string;
  name: string;
}

interface BranchSwitcherProps {
  branches: readonly BranchOption[];
  value: string;
  onChange: (slug: string) => void;
  className?: string;
}

/** Segmented control to pick the branch whose prices/stock are shown. */
export function BranchSwitcher({ branches, value, onChange, className }: BranchSwitcherProps) {
  return (
    <div
      role="radiogroup"
      aria-label="Sucursal"
      className={cn(
        "inline-flex max-w-full overflow-x-auto rounded-full border border-border bg-card p-0.5",
        className
      )}
    >
      {branches.map((branch) => {
        const checked = branch.slug === value;
        return (
          <button
            key={branch.slug}
            type="button"
            role="radio"
            aria-checked={checked}
            onClick={() => onChange(branch.slug)}
            className={cn(
              "min-h-[40px] shrink-0 rounded-full px-4 text-sm font-medium transition-colors",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
              checked
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            {branch.name}
          </button>
        );
      })}
    </div>
  );
}
