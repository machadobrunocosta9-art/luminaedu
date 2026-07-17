import type { InputHTMLAttributes, ReactNode } from "react";
import { cn } from "@/lib/utils";

type LuminaInputProps = InputHTMLAttributes<HTMLInputElement> & {
  label?: string;
  leadingIcon?: ReactNode;
  trailingAction?: ReactNode;
};

export function LuminaInput({
  id,
  label,
  leadingIcon,
  trailingAction,
  className,
  ...props
}: LuminaInputProps) {
  return (
    <div className="space-y-2">
      {label && (
        <label
          htmlFor={id}
          className="block text-sm font-medium tracking-[-0.01em] text-foreground"
        >
          {label}
        </label>
      )}

      <div className="group relative">
        {leadingIcon && (
          <span className="pointer-events-none absolute inset-y-0 left-0 flex w-12 items-center justify-center text-muted-foreground transition-colors duration-200 group-focus-within:text-primary">
            {leadingIcon}
          </span>
        )}

        <input
          id={id}
          className={cn(
            "h-13 w-full rounded-2xl border border-primary/15 bg-white/70 px-4 text-[15px] text-foreground shadow-[0_1px_2px_rgba(42,31,79,0.03)] outline-none transition-all duration-300 placeholder:text-muted-foreground/75 hover:border-primary/35 hover:bg-white focus:border-primary/60 focus:bg-white focus:ring-4 focus:ring-primary/10",
            leadingIcon && "pl-12",
            trailingAction && "pr-13",
            className,
          )}
          {...props}
        />

        {trailingAction && (
          <span className="absolute inset-y-0 right-0 flex w-12 items-center justify-center">
            {trailingAction}
          </span>
        )}
      </div>
    </div>
  );
}
