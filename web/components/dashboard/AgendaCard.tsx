import LuminaCard from "@/components/ui/LuminaCard";

const events = [
  {
    time: "08:00",
    title: "Reunião pedagógica",
    description: "Coordenação e professores",
  },
  {
    time: "10:00",
    title: "Entrega de boletins",
    description: "Secretaria escolar",
  },
  {
    time: "14:00",
    title: "Treino de futsal",
    description: "Quadra principal",
  },
];

export default function AgendaCard() {
  return (
    <LuminaCard className="h-full">
      <div className="mb-8">
        <h2 className="text-xl font-semibold text-foreground">
          Agenda de Hoje
        </h2>

        <p className="mt-1 text-sm text-muted-foreground">
          Compromissos importantes do dia.
        </p>
      </div>

      <div className="space-y-6">
        {events.map((event) => (
          <div key={`${event.time}-${event.title}`} className="flex gap-4">
            <div className="flex h-12 w-16 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-sm font-semibold text-primary">
              {event.time}
            </div>

            <div>
              <h3 className="font-semibold text-foreground">{event.title}</h3>

              <p className="mt-1 text-sm text-muted-foreground">
                {event.description}
              </p>
            </div>
          </div>
        ))}
      </div>
    </LuminaCard>
  );
}

