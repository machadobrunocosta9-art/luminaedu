import AppLayout from "@/components/layout/AppLayout";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

function formatStatus(status: string) {
  const labels: Record<string, string> = {
    A_FAZER: "A fazer",
    EM_ANDAMENTO: "Em andamento",
    AGUARDANDO: "Aguardando",
    CONCLUIDA: "Concluída",
  };

  return labels[status] ?? status;
}

function formatPriority(prioridade: string) {
  const labels: Record<string, string> = {
    BAIXA: "Baixa",
    MEDIA: "Média",
    ALTA: "Alta",
    CRITICA: "Crítica",
  };

  return labels[prioridade] ?? prioridade;
}

function getPriorityClass(prioridade: string) {
  const classes: Record<string, string> = {
    BAIXA: "bg-green-50 text-green-700 ring-green-200",
    MEDIA: "bg-slate-50 text-slate-700 ring-slate-200",
    ALTA: "bg-orange-50 text-orange-700 ring-orange-200",
    CRITICA: "bg-red-50 text-red-700 ring-red-200",
  };

  return classes[prioridade] ?? "bg-muted text-muted-foreground ring-border";
}

function getStatusClass(status: string) {
  const classes: Record<string, string> = {
    A_FAZER: "bg-slate-50 text-slate-700 ring-slate-200",
    EM_ANDAMENTO: "bg-blue-50 text-blue-700 ring-blue-200",
    AGUARDANDO: "bg-yellow-50 text-yellow-700 ring-yellow-200",
    CONCLUIDA: "bg-green-50 text-green-700 ring-green-200",
  };

  return classes[status] ?? "bg-muted text-muted-foreground ring-border";
}

async function getPulseData() {
  const tarefas = await prisma.tarefa.findMany({
    orderBy: {
      criadoEm: "desc",
    },
    include: {
      aluno: true,
      matricula: true,
    },
  });

  const abertas = tarefas.filter((tarefa) => tarefa.status !== "CONCLUIDA");
  const criticas = tarefas.filter((tarefa) => tarefa.prioridade === "CRITICA");
  const financeiro = tarefas.filter((tarefa) => tarefa.setor === "Financeiro");

  return {
    tarefas,
    abertas,
    criticas,
    financeiro,
  };
}

export default async function PulsePage() {
  const data = await getPulseData();

  return (
    <AppLayout>
      <div className="mb-8 flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-sm font-medium text-muted-foreground">
            Centro de Operações
          </p>

          <h1 className="mt-2 text-4xl font-semibold tracking-tight text-foreground">
            Pulse
          </h1>

          <p className="mt-3 max-w-3xl text-base leading-7 text-muted-foreground">
            Acompanhe tarefas, gargalos e fluxos entre os setores da escola em
            tempo real.
          </p>
        </div>

        <button className="inline-flex items-center justify-center rounded-2xl bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground transition hover:opacity-90">
          Nova tarefa
        </button>
      </div>

      <div className="mb-6 grid grid-cols-1 gap-5 md:grid-cols-4">
        <div className="rounded-3xl border border-border bg-card p-6 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">
            Tarefas
          </p>

          <div className="mt-4 text-4xl font-semibold text-foreground">
            {data.tarefas.length}
          </div>

          <p className="mt-2 text-sm text-muted-foreground">
            registradas no Pulse
          </p>
        </div>

        <div className="rounded-3xl border border-border bg-card p-6 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">
            Abertas
          </p>

          <div className="mt-4 text-4xl font-semibold text-foreground">
            {data.abertas.length}
          </div>

          <p className="mt-2 text-sm text-muted-foreground">
            precisam de acompanhamento
          </p>
        </div>

        <div className="rounded-3xl border border-border bg-card p-6 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">
            Críticas
          </p>

          <div className="mt-4 text-4xl font-semibold text-foreground">
            {data.criticas.length}
          </div>

          <p className="mt-2 text-sm text-muted-foreground">
            exigem atenção imediata
          </p>
        </div>

        <div className="rounded-3xl border border-border bg-card p-6 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">
            Financeiro
          </p>

          <div className="mt-4 text-4xl font-semibold text-foreground">
            {data.financeiro.length}
          </div>

          <p className="mt-2 text-sm text-muted-foreground">
            tarefas do setor financeiro
          </p>
        </div>
      </div>

      <div className="rounded-3xl border border-border bg-card p-6 shadow-sm">
        <div className="mb-6">
          <h2 className="text-xl font-semibold text-foreground">
            Fluxo operacional
          </h2>

          <p className="mt-1 text-sm text-muted-foreground">
            {data.tarefas.length} tarefa
            {data.tarefas.length === 1 ? "" : "s"} encontrada
            {data.tarefas.length === 1 ? "" : "s"}.
          </p>
        </div>

        {data.tarefas.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-border bg-muted/40 p-8 text-center">
            <h3 className="font-semibold text-foreground">
              Nenhuma tarefa cadastrada ainda.
            </h3>

            <p className="mt-2 text-sm text-muted-foreground">
              Quando uma matrícula ou processo gerar tarefas, elas aparecerão
              aqui.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
            {data.tarefas.map((tarefa) => (
              <div
                key={tarefa.id}
                className="rounded-3xl border border-border bg-background p-5 transition hover:border-primary/30 hover:bg-primary/5"
              >
                <div className="mb-4 flex items-start justify-between gap-4">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                      {tarefa.setor}
                    </p>

                    <h3 className="mt-1 text-lg font-semibold text-foreground">
                      {tarefa.titulo}
                    </h3>
                  </div>

                  <span
                    className={[
                      "rounded-full px-3 py-1 text-xs font-semibold ring-1",
                      getPriorityClass(tarefa.prioridade),
                    ].join(" ")}
                  >
                    {formatPriority(tarefa.prioridade)}
                  </span>
                </div>

                {tarefa.descricao && (
                  <p className="text-sm leading-6 text-muted-foreground">
                    {tarefa.descricao}
                  </p>
                )}

                <div className="mt-5 flex flex-wrap gap-2">
                  <span
                    className={[
                      "rounded-full px-3 py-1 text-xs font-semibold ring-1",
                      getStatusClass(tarefa.status),
                    ].join(" ")}
                  >
                    {formatStatus(tarefa.status)}
                  </span>

                  {tarefa.aluno && (
                    <span className="rounded-full bg-muted px-3 py-1 text-xs font-medium text-muted-foreground">
                      Aluno: {tarefa.aluno.nome}
                    </span>
                  )}

                  {tarefa.matricula && (
                    <span className="rounded-full bg-muted px-3 py-1 text-xs font-medium text-muted-foreground">
                      Matrícula {tarefa.matricula.anoLetivo}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </AppLayout>
  );
}

