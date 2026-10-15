import type { HTMLAttributes } from "react";
import { cn } from "@/lib/utils/cn";

type BadgeVariant = "sale" | "neutral";

interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  variant?: BadgeVariant;
}

const VARIANT_CLASSES: Record<BadgeVariant, string> = {
  sale: "bg-primary text-primary-foreground",
  neutral: "bg-secondary text-secondary-foreground",
};

export function Badge({ variant = "neutral", className, ...props }: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-semibold leading-none",
        VARIANT_CLASSES[variant],
        className
      )}
      {...props}
    />
  );
}
