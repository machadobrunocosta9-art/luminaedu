import type { ReactNode } from "react";

export type StatusBadgeTone =
  | "primary"
  | "success"
  | "warning"
  | "danger"
  | "info"
  | "neutral";

type StatusBadgeProps = {
  children: ReactNode;
  tone?: StatusBadgeTone;
  className?: string;
};

const toneStyles: Record<StatusBadgeTone, string> = {
  primary:
    "border-primary/20 bg-primary/10 text-primary",
  success:
    "border-emerald-500/20 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300",
  warning:
    "border-amber-500/20 bg-amber-500/10 text-amber-700 dark:text-amber-300",
  danger:
    "border-red-500/20 bg-red-500/10 text-red-700 dark:text-red-300",
  info:
    "border-sky-500/20 bg-sky-500/10 text-sky-700 dark:text-sky-300",
  neutral:
    "border-border bg-muted text-muted-foreground",
};

export default function StatusBadge({
  children,
  tone = "neutral",
  className = "",
}: StatusBadgeProps) {
  return (
    <span
      className={`inline-flex shrink-0 items-center rounded-full border px-3 py-1 text-xs font-semibold ${toneStyles[tone]} ${className}`}
    >
      {children}
    </span>
  );
}