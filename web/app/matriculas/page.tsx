import AppLayout from "@/components/layout/AppLayout";
import { prisma } from "@/lib/prisma";
import Link from "next/link";

export const dynamic = "force-dynamic";

function formatStatus(status: string) {
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

function getStatusClass(status: string) {
  const classes: Record<string, string> = {
    PENDENTE: "bg-yellow-50 text-yellow-700 ring-yellow-200",
    EM_ANALISE: "bg-blue-50 text-blue-700 ring-blue-200",
    AGUARDANDO_DOCUMENTOS: "bg-orange-50 text-orange-700 ring-orange-200",
    AGUARDANDO_PAGAMENTO: "bg-purple-50 text-purple-700 ring-purple-200",
    ATIVA: "bg-green-50 text-green-700 ring-green-200",
    CANCELADA: "bg-red-50 text-red-700 ring-red-200",
    CONCLUIDA: "bg-slate-50 text-slate-700 ring-slate-200",
  };

  return classes[status] ?? "bg-muted text-muted-foreground ring-border";
}

async function getMatriculas() {
  const matriculas = await prisma.matricula.findMany({
    orderBy: {
      criadoEm: "desc",
    },
    include: {
      aluno: {
        include: {
          responsavel: true,
          turma: true,
        },
      },
      tarefas: {
        where: {
          status: {
            not: "CONCLUIDA",
          },
        },
      },
    },
  });

  return matriculas;
}

export default async function MatriculasPage() {
  const matriculas = await getMatriculas();

  const pendentes = matriculas.filter(
    (matricula) => matricula.status !== "CONCLUIDA"
  ).length;

  const tarefasAbertas = matriculas.reduce(
    (total, matricula) => total + matricula.tarefas.length,
    0
  );

  return (
    <AppLayout>
      <div className="mb-8 flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-sm font-medium text-muted-foreground">
            Centro de Matrículas
          </p>

          <h1 className="mt-2 text-4xl font-semibold tracking-tight text-foreground">
            Matrículas
          </h1>

          <p className="mt-3 max-w-3xl text-base leading-7 text-muted-foreground">
            Acompanhe a jornada de entrada dos alunos, responsáveis vinculados,
            status do processo e tarefas abertas no Pulse.
          </p>
        </div>

        <Link
          href="/alunos/novo"
          className="inline-flex items-center justify-center rounded-2xl bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground transition hover:opacity-90"
        >
          Nova matrícula
        </Link>
      </div>

      <div className="mb-6 grid grid-cols-1 gap-5 md:grid-cols-3">
        <div className="rounded-3xl border border-border bg-card p-6 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">
            Matrículas
          </p>

          <div className="mt-4 text-4xl font-semibold text-foreground">
            {matriculas.length}
          </div>

          <p className="mt-2 text-sm text-muted-foreground">
            processos cadastrados
          </p>
        </div>

        <div className="rounded-3xl border border-border bg-card p-6 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">
            Em andamento
          </p>

          <div className="mt-4 text-4xl font-semibold text-foreground">
            {pendentes}
          </div>

          <p className="mt-2 text-sm text-muted-foreground">
            ainda precisam de atenção
          </p>
        </div>

        <div className="rounded-3xl border border-border bg-card p-6 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">
            Pulse
          </p>

          <div className="mt-4 text-4xl font-semibold text-foreground">
            {tarefasAbertas}
          </div>

          <p className="mt-2 text-sm text-muted-foreground">
            tarefas abertas ligadas às matrículas
          </p>
        </div>
      </div>

      <div className="rounded-3xl border border-border bg-card p-6 shadow-sm">
        <div className="mb-6">
          <h2 className="text-xl font-semibold text-foreground">
            Processos de matrícula
          </h2>

          <p className="mt-1 text-sm text-muted-foreground">
            {matriculas.length} matrícula
            {matriculas.length === 1 ? "" : "s"} encontrada
            {matriculas.length === 1 ? "" : "s"}.
          </p>
        </div>

        {matriculas.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-border bg-muted/40 p-8 text-center">
            <h3 className="font-semibold text-foreground">
              Nenhuma matrícula cadastrada ainda.
            </h3>

            <p className="mt-2 text-sm text-muted-foreground">
              Quando uma nova matrícula for criada, ela aparecerá aqui.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {matriculas.map((matricula) => (
              <div
                key={matricula.id}
                className="rounded-3xl border border-border bg-background p-5 transition hover:border-primary/30 hover:bg-primary/5"
              >
                <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
                  <div>
                    <div className="flex flex-wrap items-center gap-3">
                      <h3 className="text-lg font-semibold text-foreground">
                        {matricula.aluno.nome}
                      </h3>

                      <span
                        className={[
                          "rounded-full px-3 py-1 text-xs font-semibold ring-1",
                          getStatusClass(matricula.status),
                        ].join(" ")}
                      >
                        {formatStatus(matricula.status)}
                      </span>
                    </div>

                    <div className="mt-2 flex flex-wrap gap-x-6 gap-y-2 text-sm text-muted-foreground">
                      <span>
                        Responsável:{" "}
                        <strong className="font-medium text-foreground">
                          {matricula.aluno.responsavel.nome}
                        </strong>
                      </span>

                      <span>
                        Turma:{" "}
                        <strong className="font-medium text-foreground">
                          {matricula.aluno.turma?.nome ?? "Sem turma"}
                        </strong>
                      </span>

                      <span>
                        Ano letivo:{" "}
                        <strong className="font-medium text-foreground">
                          {matricula.anoLetivo}
                        </strong>
                      </span>
                    </div>
                  </div>

                  <div className="flex flex-col items-start gap-2 lg:items-end">
                    <p className="text-sm text-muted-foreground">
                      Criada em{" "}
                      {matricula.criadoEm.toLocaleDateString("pt-BR")}
                    </p>

                    <p className="text-sm font-medium text-primary">
                      {matricula.tarefas.length} tarefa
                      {matricula.tarefas.length === 1 ? "" : "s"} aberta
                      {matricula.tarefas.length === 1 ? "" : "s"} no Pulse
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </AppLayout>
  );
}

