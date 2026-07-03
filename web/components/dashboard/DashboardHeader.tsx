type DashboardHeaderProps = {
  title: string;
  subtitle: string;
  badge?: string;
  action?: React.ReactNode;
};

export default function DashboardHeader({
  title,
  subtitle,
  badge,
  action,
}: DashboardHeaderProps) {
  return (
    <div className="mb-10 flex items-start justify-between">
      <div>
        {badge && (
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-primary">
            {badge}
          </p>
        )}

        <h1 className="mt-2 text-4xl font-bold tracking-tight text-foreground">
          {title}
        </h1>

        <p className="mt-3 max-w-2xl text-base text-muted-foreground">
          {subtitle}
        </p>
      </div>

      {action && <div>{action}</div>}
    </div>
  );
}