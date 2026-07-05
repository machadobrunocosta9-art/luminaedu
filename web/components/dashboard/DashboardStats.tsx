import StatCard from "./StatCard";

export type DashboardStat = {
  title: string;
  value: string;
  description: string;
  action?: string;
};

type DashboardStatsProps = {
  stats: DashboardStat[];
};

export default function DashboardStats({
  stats,
}: DashboardStatsProps) {
  return (
    <section className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-4">
      {stats.map((stat) => (
        <StatCard
          key={stat.title}
          title={stat.title}
          value={stat.value}
          description={stat.description}
          action={stat.action}
        />
      ))}
    </section>
  );
}

