import type { HTMLAttributes } from "react";
import clsx from "clsx";

interface LuminaCardProps extends HTMLAttributes<HTMLDivElement> {}

export default function LuminaCard({
  children,
  className,
  ...props
}: LuminaCardProps) {
  return (
    <div
      className={clsx(
        "rounded-[28px] border border-border bg-card p-6 shadow-sm",
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}

