import Link from "next/link";
import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";

type PageHeaderAction = {
  label: string;
  href: string;
  icon?: LucideIcon;
};

type PageHeaderProps = {
  eyebrow?: string;
  title: string;
  description?: string;
  action?: PageHeaderAction;
  secondaryContent?: ReactNode;
};

export default function PageHeader({
  eyebrow,
  title,
  description,
  action,
  secondaryContent,
}: PageHeaderProps) {
  const ActionIcon = action?.icon;

  return (
    <header className="mb-7 flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
      <div className="min-w-0">
        {eyebrow && (
          <p className="text-sm font-medium text-muted-foreground">
            {eyebrow}
          </p>
        )}

        <h1 className="mt-2 text-3xl font-semibold tracking-tight text-foreground">
          {title}
        </h1>

        {description && (
          <p className="mt-2 max-w-3xl text-sm leading-6 text-muted-foreground">
            {description}
          </p>
        )}
      </div>

      {(action || secondaryContent) && (
        <div className="flex shrink-0 flex-wrap items-center gap-3">
          {secondaryContent}

          {action && (
            <Link
              href={action.href}
              className="group inline-flex min-h-11 items-center justify-center gap-2 rounded-2xl bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground shadow-sm shadow-primary/20 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg hover:shadow-primary/25 active:translate-y-0 active:scale-[0.98]"
            >
              {ActionIcon && (
                <ActionIcon
                  size={17}
                  className="transition-transform duration-200 group-hover:rotate-90"
                />
              )}

              {action.label}
            </Link>
          )}
        </div>
      )}
    </header>
  );
}