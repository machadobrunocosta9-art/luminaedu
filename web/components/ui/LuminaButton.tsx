import { ButtonHTMLAttributes } from "react";
import clsx from "clsx";

interface LuminaButtonProps
  extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "premium" | "secondary" | "ghost";
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

          "bg-gradient-to-r from-primary to-accent text-white shadow-[0_12px_28px_rgba(91,63,214,0.24)] hover:-translate-y-0.5 hover:shadow-[0_16px_36px_rgba(91,63,214,0.3)] active:translate-y-0 active:scale-[0.99] disabled:pointer-events-none disabled:translate-y-0 disabled:opacity-65 disabled:shadow-none":
            variant === "premium",

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

