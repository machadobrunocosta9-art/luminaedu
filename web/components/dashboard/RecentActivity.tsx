import LuminaCard from "@/components/ui/LuminaCard";

const activities = [
  {
    time: "09:32",
    title: "Nova matrícula realizada",
    description: "João Pedro foi matriculado no 5º ano.",
  },
  {
    time: "09:15",
    title: "Comunicado enviado",
    description: "Aviso sobre a reunião de responsáveis.",
  },
  {
    time: "08:54",
    title: "Pagamento confirmado",
    description: "Mensalidade de Maria Eduarda recebida.",
  },
];

export default function RecentActivity() {
  return (
    <LuminaCard className="mt-8">
      <div className="mb-6">
        <h2 className="text-xl font-semibold">
          Atividades Recentes
        </h2>

        <p className="text-sm text-muted-foreground">
          Acompanhe tudo o que aconteceu hoje.
        </p>
      </div>

      <div className="space-y-5">
        {activities.map((activity) => (
          <div
            key={activity.time}
            className="flex items-start gap-4 border-b border-border pb-4 last:border-0"
          >
            <div className="w-14 text-sm font-semibold text-primary">
              {activity.time}
            </div>

            <div>
              <h3 className="font-medium">
                {activity.title}
              </h3>

              <p className="text-sm text-muted-foreground">
                {activity.description}
              </p>
            </div>
          </div>
        ))}
      </div>
    </LuminaCard>
  );
}