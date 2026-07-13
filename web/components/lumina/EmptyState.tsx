import Link from "next/link";
import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";

type EmptyStateAction = {
  label: string;
  href: string;
  icon?: LucideIcon;
};

type EmptyStateProps = {
  icon: LucideIcon;
  title: string;
  description: string;
  action?: EmptyStateAction;
  secondaryContent?: ReactNode;
  compact?: boolean;
  className?: string;
};

export default function EmptyState({
  icon: Icon,
  title,
  description,
  action,
  secondaryContent,
  compact = false,
  className = "",
}: EmptyStateProps) {
  const ActionIcon = action?.icon;

  return (
    <div
      className={`rounded-3xl border border-dashed border-border text-center ${
        compact ? "p-5" : "p-10"
      } ${className}`}
    >
      <div
        className={`mx-auto flex items-center justify-center bg-primary/10 text-primary ${
          compact
            ? "h-11 w-11 rounded-2xl"
            : "h-14 w-14 rounded-3xl"
        }`}
      >
        <Icon size={compact ? 21 : 27} />
      </div>

      <h3
        className={`font-semibold text-foreground ${
          compact ? "mt-3 text-sm" : "mt-4"
        }`}
      >
        {title}
      </h3>

      <p
        className={`mx-auto text-muted-foreground ${
          compact
            ? "mt-1 max-w-md text-xs leading-5"
            : "mt-2 max-w-xl text-sm leading-6"
        }`}
      >
        {description}
      </p>

      {action && (
        <Link
          href={action.href}
          className="group mt-5 inline-flex min-h-11 items-center justify-center gap-2 rounded-2xl bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground shadow-sm shadow-primary/20 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md active:scale-[0.98]"
        >
          {ActionIcon && (
            <ActionIcon
              size={16}
              className="transition-transform duration-200 group-hover:rotate-90"
            />
          )}

          {action.label}
        </Link>
      )}

      {secondaryContent}
    </div>
  );
}