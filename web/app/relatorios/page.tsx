import AppLayout from "@/components/layout/AppLayout";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

function percent(value: number, total: number) {
  if (total <= 0) return 0;

  return Math.round((value / total) * 100);
}

function formatStatusTarefa(status: string) {
  const labels: Record<string, string> = {
    A_FAZER: "A fazer",
    EM_ANDAMENTO: "Em andamento",
    AGUARDANDO: "Aguardando",
    CONCLUIDA: "Concluída",
  };

  return labels[status] ?? status;
}

function formatStatusMatricula(status: string) {
  const labels: Record<string, string> = {
    PENDENTE: "Pendente",
    EM_ANALISE: "Em análise",
    AGUARDANDO_DOCUMENTOS: "Aguardando documentos",
    AGUARDANDO_PAGAMENTO: "Aguardando pagamento",
    ATIVA: "Ativa",
    CANCELADA: "Cancelada",
    CONCLUIDA: "Concluída",
  };

  return labels[status] ?? status;
}

function StatCard({
  title,
  value,
  description,
}: {
  title: string;
  value: number | string;
  description: string;
}) {
  return (
    <div className="rounded-3xl border border-border bg-card p-6 shadow-sm">
      <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">
        {title}
      </p>

      <div className="mt-4 text-4xl font-semibold text-foreground">
        {value}
      </div>

      <p className="mt-2 text-sm text-muted-foreground">{description}</p>
    </div>
  );
}

function ProgressRow({
  label,
  value,
  total,
}: {
  label: string;
  value: number;
  total: number;
}) {
  const progress = percent(value, total);

  return (
    <div>
      <div className="mb-2 flex items-center justify-between gap-4">
        <p className="text-sm font-medium text-foreground">{label}</p>

        <p className="text-sm text-muted-foreground">
          {value} de {total}
        </p>
      </div>

      <div className="h-3 overflow-hidden rounded-full bg-muted">
        <div
          className="h-full rounded-full bg-primary"
          style={{ width: `${progress}%` }}
        />
      </div>
    </div>
  );
}

async function getRelatoriosData() {
  const [alunos, responsaveis, turmas, matriculas, tarefas] =
    await Promise.all([
      prisma.aluno.findMany({
        include: {
          turma: true,
          responsavel: true,
        },
        orderBy: {
          criadoEm: "desc",
        },
      }),

      prisma.responsavel.findMany(),

      prisma.turma.findMany({
        include: {
          alunos: true,
        },
        orderBy: {
          nome: "asc",
        },
      }),

      prisma.matricula.findMany({
        include: {
          aluno: true,
        },
        orderBy: {
          criadoEm: "desc",
        },
      }),

      prisma.tarefa.findMany({
        include: {
          aluno: true,
        },
        orderBy: {
          atualizadoEm: "desc",
        },
      }),
    ]);

  const capacidadeTotal = turmas.reduce(
    (total, turma) => total + turma.capacidade,
    0
  );

  const alunosAlocados = turmas.reduce(
    (total, turma) => total + turma.alunos.length,
    0
  );

  const vagasLivres = capacidadeTotal - alunosAlocados;

  const tarefasAbertas = tarefas.filter(
    (tarefa) => tarefa.status !== "CONCLUIDA"
  );

  const tarefasConcluidas = tarefas.filter(
    (tarefa) => tarefa.status === "CONCLUIDA"
  );

  const setores = [
    "Secretaria",
    "Financeiro",
    "Coordenação",
    "Comunicação",
    "Documentos",
  ];

  const tarefasPorSetor = setores.map((setor) => ({
    setor,
    total: tarefas.filter((tarefa) => tarefa.setor === setor).length,
    abertas: tarefas.filter(
      (tarefa) => tarefa.setor === setor && tarefa.status !== "CONCLUIDA"
    ).length,
  }));

  const statusTarefas = ["A_FAZER", "EM_ANDAMENTO", "AGUARDANDO", "CONCLUIDA"];

  const tarefasPorStatus = statusTarefas.map((status) => ({
    status,
    total: tarefas.filter((tarefa) => tarefa.status === status).length,
  }));

  const statusMatriculas = [
    "PENDENTE",
    "EM_ANALISE",
    "AGUARDANDO_DOCUMENTOS",
    "AGUARDANDO_PAGAMENTO",
    "ATIVA",
    "CANCELADA",
    "CONCLUIDA",
  ];

  const matriculasPorStatus = statusMatriculas.map((status) => ({
    status,
    total: matriculas.filter((matricula) => matricula.status === status)
      .length,
  }));

  const financeiroPendente = tarefas.filter(
    (tarefa) => tarefa.setor === "Financeiro" && tarefa.status !== "CONCLUIDA"
  ).length;

  const documentosPendentes = tarefas.filter(
    (tarefa) => tarefa.setor === "Documentos" && tarefa.status !== "CONCLUIDA"
  ).length;

  const comunicadosEnviados = tarefas.filter(
    (tarefa) => tarefa.setor === "Comunicação" && tarefa.status === "CONCLUIDA"
  ).length;

  return {
    alunos,
    responsaveis,
    turmas,
    matriculas,
    tarefas,
    capacidadeTotal,
    alunosAlocados,
    vagasLivres,
    tarefasAbertas,
    tarefasConcluidas,
    tarefasPorSetor,
    tarefasPorStatus,
    matriculasPorStatus,
    financeiroPendente,
    documentosPendentes,
    comunicadosEnviados,
  };
}

export default async function RelatoriosPage() {
  const data = await getRelatoriosData();

  const ocupacao = percent(data.alunosAlocados, data.capacidadeTotal);
  const conclusaoPulse = percent(data.tarefasConcluidas.length, data.tarefas.length);

  return (
    <AppLayout>
      <div className="mb-8">
        <p className="text-sm font-medium text-muted-foreground">
          Inteligência da Escola
        </p>

        <h1 className="mt-2 text-4xl font-semibold tracking-tight text-foreground">
          Relatórios
        </h1>

        <p className="mt-3 max-w-3xl text-base leading-7 text-muted-foreground">
          Acompanhe indicadores gerais da escola, operação, matrículas,
          documentos, comunicação e financeiro.
        </p>
      </div>

      <div className="mb-6 grid grid-cols-1 gap-5 md:grid-cols-4">
        <StatCard
          title="Alunos"
          value={data.alunos.length}
          description="cadastrados na escola"
        />

        <StatCard
          title="Responsáveis"
          value={data.responsaveis.length}
          description="contatos vinculados"
        />

        <StatCard
          title="Turmas"
          value={data.turmas.length}
          description="turmas cadastradas"
        />

        <StatCard
          title="Matrículas"
          value={data.matriculas.length}
          description="processos registrados"
        />
      </div>

      <div className="mb-6 grid grid-cols-1 gap-5 md:grid-cols-4">
        <StatCard
          title="Pulse aberto"
          value={data.tarefasAbertas.length}
          description="tarefas ainda pendentes"
        />

        <StatCard
          title="Financeiro"
          value={data.financeiroPendente}
          description="pendências financeiras"
        />

        <StatCard
          title="Documentos"
          value={data.documentosPendentes}
          description="pendências documentais"
        />

        <StatCard
          title="Comunicados"
          value={data.comunicadosEnviados}
          description="comunicados enviados"
        />
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
        <div className="rounded-3xl border border-border bg-card p-6 shadow-sm">
          <h2 className="text-xl font-semibold text-foreground">
            Ocupação das turmas
          </h2>

          <p className="mt-1 text-sm text-muted-foreground">
            Capacidade total, alunos alocados e vagas disponíveis.
          </p>

          <div className="mt-6 space-y-5">
            <ProgressRow
              label="Ocupação geral"
              value={data.alunosAlocados}
              total={data.capacidadeTotal}
            />

            <div className="grid grid-cols-3 gap-3">
              <div className="rounded-2xl bg-muted/50 p-4">
                <p className="text-xs text-muted-foreground">Capacidade</p>

                <p className="mt-1 text-2xl font-semibold text-foreground">
                  {data.capacidadeTotal}
                </p>
              </div>

              <div className="rounded-2xl bg-muted/50 p-4">
                <p className="text-xs text-muted-foreground">Ocupadas</p>

                <p className="mt-1 text-2xl font-semibold text-foreground">
                  {data.alunosAlocados}
                </p>
              </div>

              <div className="rounded-2xl bg-muted/50 p-4">
                <p className="text-xs text-muted-foreground">Livres</p>

                <p className="mt-1 text-2xl font-semibold text-foreground">
                  {data.vagasLivres}
                </p>
              </div>
            </div>

            <p className="text-sm text-muted-foreground">
              Ocupação atual:{" "}
              <strong className="font-semibold text-foreground">
                {ocupacao}%
              </strong>
            </p>
          </div>
        </div>

        <div className="rounded-3xl border border-border bg-card p-6 shadow-sm">
          <h2 className="text-xl font-semibold text-foreground">
            Conclusão do Pulse
          </h2>

          <p className="mt-1 text-sm text-muted-foreground">
            Percentual de tarefas concluídas na operação.
          </p>

          <div className="mt-6 space-y-5">
            <ProgressRow
              label="Tarefas concluídas"
              value={data.tarefasConcluidas.length}
              total={data.tarefas.length}
            />

            <div className="grid grid-cols-3 gap-3">
              <div className="rounded-2xl bg-muted/50 p-4">
                <p className="text-xs text-muted-foreground">Total</p>

                <p className="mt-1 text-2xl font-semibold text-foreground">
                  {data.tarefas.length}
                </p>
              </div>

              <div className="rounded-2xl bg-muted/50 p-4">
                <p className="text-xs text-muted-foreground">Abertas</p>

                <p className="mt-1 text-2xl font-semibold text-foreground">
                  {data.tarefasAbertas.length}
                </p>
              </div>

              <div className="rounded-2xl bg-muted/50 p-4">
                <p className="text-xs text-muted-foreground">Concluídas</p>

                <p className="mt-1 text-2xl font-semibold text-foreground">
                  {data.tarefasConcluidas.length}
                </p>
              </div>
            </div>

            <p className="text-sm text-muted-foreground">
              Conclusão atual:{" "}
              <strong className="font-semibold text-foreground">
                {conclusaoPulse}%
              </strong>
            </p>
          </div>
        </div>
      </div>

      <div className="mt-6 grid grid-cols-1 gap-6 xl:grid-cols-2">
        <div className="rounded-3xl border border-border bg-card p-6 shadow-sm">
          <h2 className="text-xl font-semibold text-foreground">
            Tarefas por setor
          </h2>

          <p className="mt-1 text-sm text-muted-foreground">
            Distribuição operacional entre os módulos da escola.
          </p>

          <div className="mt-6 space-y-5">
            {data.tarefasPorSetor.map((item) => (
              <div key={item.setor}>
                <div className="mb-2 flex items-center justify-between gap-4">
                  <p className="text-sm font-medium text-foreground">
                    {item.setor}
                  </p>

                  <p className="text-sm text-muted-foreground">
                    {item.abertas} abertas / {item.total} total
                  </p>
                </div>

                <div className="h-3 overflow-hidden rounded-full bg-muted">
                  <div
                    className="h-full rounded-full bg-primary"
                    style={{
                      width: `${percent(item.total, data.tarefas.length)}%`,
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-3xl border border-border bg-card p-6 shadow-sm">
          <h2 className="text-xl font-semibold text-foreground">
            Status das tarefas
          </h2>

          <p className="mt-1 text-sm text-muted-foreground">
            Visão geral do fluxo operacional no Pulse.
          </p>

          <div className="mt-6 space-y-4">
            {data.tarefasPorStatus.map((item) => (
              <div
                key={item.status}
                className="flex items-center justify-between rounded-2xl border border-border bg-background p-4"
              >
                <span className="text-sm font-medium text-foreground">
                  {formatStatusTarefa(item.status)}
                </span>

                <span className="rounded-full bg-muted px-3 py-1 text-xs font-semibold text-muted-foreground">
                  {item.total}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="mt-6 rounded-3xl border border-border bg-card p-6 shadow-sm">
        <h2 className="text-xl font-semibold text-foreground">
          Matrículas por status
        </h2>

        <p className="mt-1 text-sm text-muted-foreground">
          Distribuição dos processos de matrícula.
        </p>

        <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          {data.matriculasPorStatus.map((item) => (
            <div
              key={item.status}
              className="rounded-2xl border border-border bg-background p-5"
            >
              <p className="text-sm font-medium text-foreground">
                {formatStatusMatricula(item.status)}
              </p>

              <p className="mt-3 text-3xl font-semibold text-foreground">
                {item.total}
              </p>

              <p className="mt-1 text-sm text-muted-foreground">
                matrícula{item.total === 1 ? "" : "s"}
              </p>
            </div>
          ))}
        </div>
      </div>

      <div className="mt-6 rounded-3xl border border-border bg-card p-6 shadow-sm">
        <h2 className="text-xl font-semibold text-foreground">
          Últimas movimentações
        </h2>

        <p className="mt-1 text-sm text-muted-foreground">
          Tarefas atualizadas recentemente.
        </p>

        {data.tarefas.length === 0 ? (
          <div className="mt-6 rounded-2xl border border-dashed border-border bg-muted/40 p-8 text-center">
            <h3 className="font-semibold text-foreground">
              Nenhuma movimentação encontrada.
            </h3>

            <p className="mt-2 text-sm text-muted-foreground">
              Quando módulos criarem tarefas, elas aparecerão aqui.
            </p>
          </div>
        ) : (
          <div className="mt-6 space-y-4">
            {data.tarefas.slice(0, 8).map((tarefa) => (
              <div
                key={tarefa.id}
                className="flex flex-col gap-3 rounded-2xl border border-border bg-background p-5 md:flex-row md:items-center md:justify-between"
              >
                <div>
                  <p className="font-semibold text-foreground">
                    {tarefa.titulo}
                  </p>

                  <p className="mt-1 text-sm text-muted-foreground">
                    {tarefa.setor}{" "}
                    {tarefa.aluno ? `— ${tarefa.aluno.nome}` : ""}
                  </p>
                </div>

                <div className="text-sm text-muted-foreground">
                  {formatStatusTarefa(tarefa.status)}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </AppLayout>
  );
}