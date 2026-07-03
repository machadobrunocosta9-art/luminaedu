import { ButtonHTMLAttributes } from "react";
import clsx from "clsx";

interface LuminaButtonProps
  extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "ghost";
}

export default function LuminaButton({
  children,
  variant = "primary",
  className,
  ...props
}: LuminaButtonProps) {
  return (
    <button
      className={clsx(
        "inline-flex items-center justify-center rounded-2xl px-5 py-3 text-sm font-semibold transition-all duration-200",
        "focus:outline-none focus:ring-2 focus:ring-primary/40",
        {
          "bg-[#5B3FD6] text-white hover:opacity-90":
            variant === "primary",

          "border border-border bg-white text-foreground hover:bg-muted":
            variant === "secondary",

          "bg-transparent text-foreground hover:bg-muted":
            variant === "ghost",
        },
        className
      )}
      {...props}
    >
      {children}
    </button>
  );
}