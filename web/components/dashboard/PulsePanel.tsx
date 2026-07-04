import LuminaCard from "@/components/ui/LuminaCard";
import LuminaBadge from "@/components/ui/LuminaBadge";

type PulseTask = {
  id: string;
  titulo: string;
  descricao: string | null;
  setor: string;
  prioridade: "BAIXA" | "MEDIA" | "ALTA" | "CRITICA";
  status: "A_FAZER" | "EM_ANDAMENTO" | "AGUARDANDO" | "CONCLUIDA";
};

type PulsePanelProps = {
  tarefas: PulseTask[];
};

function getPriorityVariant(prioridade: PulseTask["prioridade"]) {
  if (prioridade === "CRITICA") return "danger";
  if (prioridade === "ALTA") return "warning";
  if (prioridade === "MEDIA") return "soft";
  return "success";
}

function formatPriority(prioridade: PulseTask["prioridade"]) {
  const labels = {
    BAIXA: "Baixa",
    MEDIA: "Média",
    ALTA: "Alta",
    CRITICA: "Crítica",
  };

  return labels[prioridade];
}

function formatStatus(status: PulseTask["status"]) {
  const labels = {
    A_FAZER: "A fazer",
    EM_ANDAMENTO: "Em andamento",
    AGUARDANDO: "Aguardando",
    CONCLUIDA: "Concluída",
  };

  return labels[status];
}

export default function PulsePanel({ tarefas }: PulsePanelProps) {
  return (
    <LuminaCard className="h-full">
      <div className="mb-6 flex items-start justify-between gap-4">
        <div>
          <p className="text-sm font-medium text-primary">Pulse</p>

          <h2 className="mt-1 text-xl font-semibold text-foreground">
            Centro de Operações
          </h2>

          <p className="mt-1 text-sm text-muted-foreground">
            Tarefas reais puxadas do banco de dados.
          </p>
        </div>

        <LuminaBadge variant="default">{tarefas.length} abertas</LuminaBadge>
      </div>

      <div className="space-y-4">
        {tarefas.length === 0 && (
          <div className="rounded-2xl border border-border bg-muted/40 p-5">
            <p className="text-sm font-medium text-foreground">
              Tudo em ordem por aqui.
            </p>

            <p className="mt-1 text-sm text-muted-foreground">
              Nenhuma tarefa pendente foi encontrada no Pulse.
            </p>
          </div>
        )}

        {tarefas.map((tarefa) => (
          <div
            key={tarefa.id}
            className="rounded-2xl border border-border bg-background p-5 transition hover:border-primary/30 hover:bg-primary/5"
          >
            <div className="mb-3 flex items-start justify-between gap-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                  {tarefa.setor}
                </p>

                <h3 className="mt-1 font-semibold text-foreground">
                  {tarefa.titulo}
                </h3>
              </div>

              <LuminaBadge variant={getPriorityVariant(tarefa.prioridade)}>
                {formatPriority(tarefa.prioridade)}
              </LuminaBadge>
            </div>

            {tarefa.descricao && (
              <p className="text-sm leading-6 text-muted-foreground">
                {tarefa.descricao}
              </p>
            )}

            <div className="mt-4 text-xs font-medium text-muted-foreground">
              Status: {formatStatus(tarefa.status)}
            </div>
          </div>
        ))}
      </div>
    </LuminaCard>
  );
}