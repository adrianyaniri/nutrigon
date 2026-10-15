import type { ButtonHTMLAttributes, ReactNode } from "react";
import { cn } from "@/lib/utils/cn";

type IconButtonVariant = "solid" | "outline" | "ghost";

interface IconButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  /** Required: icon-only controls must be named for assistive tech. */
  "aria-label": string;
  variant?: IconButtonVariant;
  children: ReactNode;
}

const VARIANT_CLASSES: Record<IconButtonVariant, string> = {
  solid: "bg-primary text-primary-foreground hover:bg-brand-gold-hover",
  outline: "border border-border bg-card text-foreground hover:border-primary hover:text-primary",
  ghost: "text-foreground hover:bg-muted",
};

/** Round icon button; always at least 44x44px so it is easy to tap. */
export function IconButton({
  variant = "outline",
  className,
  type = "button",
  ...props
}: IconButtonProps) {
  return (
    <button
      type={type}
      className={cn(
        "relative inline-flex size-11 shrink-0 items-center justify-center rounded-full transition-colors",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
        "active:scale-95 disabled:pointer-events-none disabled:opacity-50",
        VARIANT_CLASSES[variant],
        className
      )}
      {...props}
    />
  );
}
