import PrimaryAction from "@/components/lumina/PrimaryAction";
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
            <PrimaryAction
              label={action.label}
              href={action.href}
              icon={action.icon}
              iconAnimation="rotate"
            />
          )}
        </div>
      )}
    </header>
  );
}