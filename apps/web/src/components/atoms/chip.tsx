import type { ButtonHTMLAttributes } from "react";
import { cn } from "@/lib/utils/cn";

interface ChipProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  selected?: boolean;
}

/** Pill-shaped toggle button with a 44px touch target. */
export function Chip({ selected = false, className, type = "button", ...props }: ChipProps) {
  return (
    <button
      type={type}
      aria-pressed={selected}
      className={cn(
        "inline-flex min-h-[44px] shrink-0 items-center gap-1.5 rounded-full border px-4 text-sm font-medium transition-colors",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
        selected
          ? "border-primary bg-primary text-primary-foreground"
          : "border-border bg-card text-muted-foreground hover:text-foreground",
        className
      )}
      {...props}
    />
  );
}
