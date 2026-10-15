import { useEffect, useRef } from "react";
import { Check, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { CategoryOption } from "@/features/catalog/types";
import { cn } from "@/lib/utils/cn";

export interface CategoryDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  options: readonly CategoryOption[];
  value: string | null;
  onChange: (value: string | null) => void;
}

/**
 * Accessible slide-over drawer for mobile/tablet viewports (< 768px),
 * following AGENTS.md rule 4 (collapsing navigation into hamburger panel).
 */
export function CategoryDrawer({
  isOpen,
  onClose,
  options,
  value,
  onChange,
}: CategoryDrawerProps) {
  const drawerRef = useRef<HTMLDivElement>(null);

  // Close on Escape and lock background scroll
  useEffect(() => {
    if (!isOpen) return;

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        onClose();
      }
    }

    document.addEventListener("keydown", handleKeyDown);
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = originalOverflow;
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="category-drawer-title"
      className="fixed inset-0 z-50 flex"
    >
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-background/80 backdrop-blur-sm transition-opacity"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Slide-over Panel */}
      <div
        ref={drawerRef}
        className="relative z-10 flex h-full w-full max-w-xs flex-col border-r border-border bg-card p-5 shadow-2xl animate-in slide-in-from-left duration-200"
      >
        <div className="flex items-center justify-between pb-4 border-b border-border">
          <h2
            id="category-drawer-title"
            className="font-headline text-lg font-bold text-foreground"
          >
            Categorías
          </h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Cerrar panel de categorías"
            className="rounded-full p-2 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center"
          >
            <X className="size-5" />
          </button>
        </div>

        {/* Category List */}
        <div className="flex-1 overflow-y-auto py-4 space-y-1.5">
          {options.map((option) => {
            const isSelected = option.value === value;

            return (
              <button
                key={option.value ?? "all"}
                type="button"
                aria-current={isSelected ? "true" : undefined}
                onClick={() => {
                  onChange(option.value);
                  onClose();
                }}
                className={cn(
                  "flex min-h-[48px] w-full items-center justify-between rounded-xl px-4 text-sm font-medium transition-all border",
                  isSelected
                    ? "border-brand-gold bg-brand-gold/15 text-white font-semibold shadow-2xs"
                    : "border-border/60 bg-brand-surface/40 text-zinc-300 hover:border-brand-gold/40 hover:bg-brand-surface hover:text-white"
                )}
              >
                <div className="flex items-center gap-2">
                  {isSelected && <Check className="size-4 text-brand-gold" aria-hidden="true" />}
                  <span>{option.label}</span>
                </div>
                <span
                  className={cn(
                    "rounded-full px-2 py-0.5 text-xs font-semibold tabular-nums",
                    isSelected
                      ? "bg-brand-gold text-brand-surface font-bold"
                      : "bg-muted text-muted-foreground"
                  )}
                >
                  {option.count}
                </span>
              </button>
            );
          })}
        </div>

        {/* Bottom Action */}
        <div className="pt-4 border-t border-border">
          <Button
            variant="outline"
            className="w-full min-h-[44px]"
            onClick={() => {
              onChange(null);
              onClose();
            }}
          >
            Ver todos los productos
          </Button>
        </div>
      </div>
    </div>
  );
}
