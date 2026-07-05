import LuminaCard from "@/components/ui/LuminaCard";

type StatCardProps = {
  title: string;
  value: string;
  description: string;
  action?: string;
};

export default function StatCard({
  title,
  value,
  description,
  action,
}: StatCardProps) {
  return (
    <LuminaCard className="group h-full p-6 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md">
      <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">
        {title}
      </p>

      <div className="mt-5 flex items-end gap-2">
        <span className="text-4xl font-semibold tracking-tight text-foreground">
          {value}
        </span>
      </div>

      <p className="mt-3 text-sm leading-6 text-muted-foreground">
        {description}
      </p>

      {action && (
        <button className="mt-6 text-sm font-medium text-primary transition hover:opacity-80">
          {action} →
        </button>
      )}
    </LuminaCard>
  );
}

