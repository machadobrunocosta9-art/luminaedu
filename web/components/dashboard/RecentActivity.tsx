import LuminaCard from "@/components/ui/LuminaCard";

export type RecentActivityItem = {
  id: string;
  time: string;
  title: string;
  description: string;
};

type RecentActivityProps = {
  activities: RecentActivityItem[];
};

export default function RecentActivity({ activities }: RecentActivityProps) {
  return (
    <LuminaCard className="mt-8">
      <div className="mb-6">
        <h2 className="text-xl font-semibold text-foreground">
          Atividades recentes
        </h2>

        <p className="mt-1 text-sm text-muted-foreground">
          Acompanhe as movimentações mais recentes da escola.
        </p>
      </div>

      {activities.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border bg-muted/40 p-8 text-center">
          <h3 className="font-semibold text-foreground">
            Nenhuma atividade recente.
          </h3>

          <p className="mt-2 text-sm text-muted-foreground">
            Quando novas tarefas, matrículas ou ações acontecerem, elas
            aparecerão aqui.
          </p>
        </div>
      ) : (
        <div className="space-y-5">
          {activities.map((activity) => (
            <div
              key={activity.id}
              className="flex items-start gap-4 border-b border-border pb-4 last:border-0 last:pb-0"
            >
              <div className="w-14 text-sm font-semibold text-primary">
                {activity.time}
              </div>

              <div>
                <h3 className="font-medium text-foreground">
                  {activity.title}
                </h3>

                <p className="mt-1 text-sm text-muted-foreground">
                  {activity.description}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}
    </LuminaCard>
  );
}