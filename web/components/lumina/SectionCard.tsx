import type { ReactNode } from "react";

type SectionCardProps = {
  title?: string;
  description?: string;
  action?: ReactNode;
  children: ReactNode;
  className?: string;
  contentClassName?: string;
};

export default function SectionCard({
  title,
  description,
  action,
  children,
  className = "",
  contentClassName = "",
}: SectionCardProps) {
  const hasHeader = title || description || action;

  return (
    <section
      className={`rounded-[2rem] border border-border bg-card p-5 shadow-sm ${className}`}
    >
      {hasHeader && (
        <div className="mb-5 flex flex-wrap items-center justify-between gap-4">
          <div className="min-w-0">
            {title && (
              <h2 className="font-semibold text-foreground">
                {title}
              </h2>
            )}

            {description && (
              <p className="mt-1 text-sm leading-6 text-muted-foreground">
                {description}
              </p>
            )}
          </div>

          {action && (
            <div className="shrink-0">
              {action}
            </div>
          )}
        </div>
      )}

      <div className={contentClassName}>
        {children}
      </div>
    </section>
  );
}