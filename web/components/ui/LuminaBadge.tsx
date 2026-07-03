import type { HTMLAttributes } from "react";
import clsx from "clsx";

type LuminaBadgeVariant = "default" | "success" | "warning" | "danger" | "soft";

interface LuminaBadgeProps extends HTMLAttributes<HTMLSpanElement> {
  variant?: LuminaBadgeVariant;
}

export default function LuminaBadge({
  children,
  className,
  variant = "default",
  ...props
}: LuminaBadgeProps) {
  return (
    <span
      className={clsx(
        "inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold",
        {
          "bg-primary/10 text-primary": variant === "default",
          "bg-emerald-50 text-emerald-700": variant === "success",
          "bg-amber-50 text-amber-700": variant === "warning",
          "bg-red-50 text-red-700": variant === "danger",
          "bg-muted text-muted-foreground": variant === "soft",
        },
        className
      )}
      {...props}
    >
      {children}
    </span>
  );
}