import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";

type MetricCardTone = "primary" | "success" | "warning" | "danger" | "neutral";

type MetricCardProps = {
  label: string;
  value: ReactNode;
  description?: string;
  icon: LucideIcon;
  tone?: MetricCardTone;
};

const toneStyles: Record<
  MetricCardTone,
  {
    icon: string;
    iconBackground: string;
  }
> = {
  primary: {
    icon: "text-primary",
    iconBackground: "bg-primary/10",
  },
  success: {
    icon: "text-emerald-700 dark:text-emerald-300",
    iconBackground: "bg-emerald-500/10",
  },
  warning: {
    icon: "text-amber-700 dark:text-amber-300",
    iconBackground: "bg-amber-500/10",
  },
  danger: {
    icon: "text-red-700 dark:text-red-300",
    iconBackground: "bg-red-500/10",
  },
  neutral: {
    icon: "text-muted-foreground",
    iconBackground: "bg-muted",
  },
};

export default function MetricCard({
  label,
  value,
  description,
  icon: Icon,
  tone = "primary",
}: MetricCardProps) {
  const styles = toneStyles[tone];

  return (
    <article className="group rounded-3xl border border-border bg-card p-5 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:border-primary/20 hover:shadow-md">
      <div
        className={`flex h-11 w-11 items-center justify-center rounded-2xl transition-transform duration-200 group-hover:scale-105 ${styles.iconBackground}`}
      >
        <Icon size={21} className={styles.icon} />
      </div>

      <p className="mt-4 text-sm font-medium text-muted-foreground">
        {label}
      </p>

      <div className="mt-1 text-4xl font-semibold tracking-tight text-foreground">
        {value}
      </div>

      {description && (
        <p className="mt-2 text-xs leading-5 text-muted-foreground">
          {description}
        </p>
      )}
    </article>
  );
}