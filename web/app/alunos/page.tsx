import AppLayout from "@/components/layout/AppLayout";
import { prisma } from "@/lib/prisma";
import {
  AlertTriangle,
  ArrowRight,
  CheckCircle2,
  ClipboardList,
  GraduationCap,
  MessageCircle,
  Plus,
  Search,
  Sparkles,
  UserRound,
  UsersRound,
} from "lucide-react";

export const dynamic = "force-dynamic";

type PageProps = {
  searchParams?: Promise<{
    busca?: string;
    turma?: string;
    status?: string;
  }>;
};

function getStatusLabel(status?: string | null) {
  if (!status) return "Sem matrícula";

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

function getStatusClass(status?: string | null) {
  if (!status) {
    return "border-border bg-muted text-muted-foreground";
  }

  if (status === "ATIVA") {
    return "border-primary/20 bg-primary/10 text-primary";
  }

  if (
    [
      "PENDENTE",
      "EM_ANALISE",
      "AGUARDANDO_DOCUMENTOS",
      "AGUARDANDO_PAGAMENTO",
    ].includes(status)
  ) {
    return "border-amber-200 bg-amber-50 text-amber-700";
  }

  if (status === "CANCELADA") {
    return "border-red-200 bg-red-50 text-red-700";
  }

  return "border-border bg-muted text-muted-foreground";
}

export default async function AlunosPage({ searchParams }: PageProps) {
  const params = await searchParams;

  const busca = params?.busca?.trim() ?? "";
  const turmaFiltro = params?.turma?.trim() ?? "";
  const statusFiltro = params?.status?.trim() ?? "";

  const [alunosEncontrados, turmas] = await Promise.all([
    prisma.aluno.findMany({
      where: {
        ...(turmaFiltro
          ? {
              turmaId: turmaFiltro,
            }
          : {}),
        ...(busca
          ? {
              OR: [
                {
                  nome: {
                    contains: busca,
                    mode: "insensitive",
                  },
                },
                {
                  responsavel: {
                    nome: {
                      contains: busca,
                      mode: "insensitive",
                    },
                  },
                },
                {
                  turma: {
                    nome: {
                      contains: busca,
                      mode: "insensitive",
                    },
                  },
                },
              ],
            }
          : {}),
      },
      orderBy: {
        nome: "asc",
      },
      include: {
        responsavel: true,
        turma: true,
        matriculas: {
          orderBy: {
            criadoEm: "desc",
          },
          take: 1,
        },
        tarefas: {
          where: {
            status: {
              not: "CONCLUIDA",
            },
          },
          orderBy: {
            criadoEm: "desc",
          },
          take: 5,
        },
        ocorrencias: {
          orderBy: {
            criadoEm: "desc",
          },
          take: 5,
        },
        destinatariosComunicados: {
          where: {
            status: {
              in: ["PENDENTE", "ENVIADO", "VISUALIZADO"],
            },
          },
          orderBy: {
            criadoEm: "desc",
          },
          take: 5,
          include: {
            comunicado: true,
          },
        },
      },
    }),

    prisma.turma.findMany({
      orderBy: {
        nome: "asc",
      },
      include: {
        _count: {
          select: {
            alunos: true,
          },
        },
      },
    }),
  ]);

  const alunos = statusFiltro
    ? alunosEncontrados.filter((aluno) => {
        const matriculaAtual = aluno.matriculas[0] ?? null;
        const statusAtual = matriculaAtual?.status ?? "SEM_MATRICULA";

        return statusAtual === statusFiltro;
      })
    : alunosEncontrados;

  const totalAlunos = alunos.length;

  const alunosComTarefaAberta = alunos.filter(
    (aluno) => aluno.tarefas.length > 0,
  ).length;

  const alunosComComunicacaoPendente = alunos.filter(
    (aluno) => aluno.destinatariosComunicados.length > 0,
  ).length;

  const alunosComOcorrencia = alunos.filter(
    (aluno) => aluno.ocorrencias.length > 0,
  ).length;

  const alunosSemMatricula = alunos.filter(
    (aluno) => aluno.matriculas.length === 0,
  ).length;

  const alunosComAtencao = alunos.filter((aluno) => {
    const temTarefa = aluno.tarefas.length > 0;
    const temComunicado = aluno.destinatariosComunicados.length > 0;
    const temOcorrencia = aluno.ocorrencias.length > 0;
    const semMatricula = aluno.matriculas.length === 0;

    return temTarefa || temComunicado || temOcorrencia || semMatricula;
  }).length;

  return (
    <AppLayout>
      <div className="mb-7 flex flex-wrap items-start justify-between gap-6">
        <div>
          <p className="text-sm font-medium text-muted-foreground">
            Vida Escolar
          </p>

          <h1 className="mt-2 text-3xl font-semibold tracking-tight text-foreground">
            Alunos
          </h1>

          <p className="mt-2 max-w-3xl text-sm leading-6 text-muted-foreground">
            Consulte alunos, responsáveis, turmas, situação de matrícula e
            alertas rápidos antes de abrir o prontuário.
          </p>
        </div>

        <a
          href="/alunos/novo"
          className="group inline-flex items-center gap-2 rounded-2xl bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground shadow-sm shadow-primary/20 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg hover:shadow-primary/25 active:translate-y-0 active:scale-[0.98]"
        >
          <Plus
            size={17}
            className="transition-transform duration-200 group-hover:rotate-90"
          />
          Novo aluno
        </a>
      </div>

      <section className="mb-7 overflow-hidden rounded-[2rem] border border-border bg-card shadow-sm">
        <div className="relative p-5">
          <div className="absolute right-0 top-0 h-32 w-32 rounded-full bg-primary/10 blur-3xl" />

          <form
            action="/alunos"
            method="get"
            className="relative grid gap-3 xl:grid-cols-[1fr_210px_210px_auto]"
          >
            <div className="flex h-12 items-center gap-3 rounded-2xl border border-border bg-background px-4 shadow-sm">
              <Search size={18} className="text-muted-foreground" />

              <input
                name="busca"
                defaultValue={busca}
                placeholder="Buscar por aluno, responsável ou turma..."
                className="h-full w-full bg-transparent text-sm outline-none placeholder:text-muted-foreground"
              />
            </div>

            <select
              name="turma"
              defaultValue={turmaFiltro}
              className="h-12 rounded-2xl border border-border bg-background px-4 text-sm text-foreground shadow-sm outline-none"
            >
              <option value="">Todas as turmas</option>
              {turmas.map((turma) => (
                <option key={turma.id} value={turma.id}>
                  {turma.nome}
                </option>
              ))}
            </select>

            <select
              name="status"
              defaultValue={statusFiltro}
              className="h-12 rounded-2xl border border-border bg-background px-4 text-sm text-foreground shadow-sm outline-none"
            >
              <option value="">Todos os status</option>
              <option value="ATIVA">Matrícula ativa</option>
              <option value="PENDENTE">Pendente</option>
              <option value="EM_ANALISE">Em análise</option>
              <option value="AGUARDANDO_DOCUMENTOS">
                Aguardando documentos
              </option>
              <option value="AGUARDANDO_PAGAMENTO">
                Aguardando pagamento
              </option>
              <option value="SEM_MATRICULA">Sem matrícula</option>
            </select>

            <button
              type="submit"
              className="group inline-flex h-12 items-center justify-center gap-2 rounded-2xl bg-primary px-5 text-sm font-semibold text-primary-foreground shadow-sm shadow-primary/20 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg hover:shadow-primary/25 active:translate-y-0 active:scale-[0.98]"
            >
              Buscar
              <ArrowRight
                size={16}
                className="transition-transform duration-200 group-hover:translate-x-1"
              />
            </button>
          </form>

          {(busca || turmaFiltro || statusFiltro) && (
            <div className="relative mt-4">
              <a
                href="/alunos"
                className="inline-flex rounded-2xl border border-border bg-background px-4 py-2 text-sm font-semibold text-primary transition hover:bg-muted"
              >
                Limpar filtros
              </a>
            </div>
          )}
        </div>
      </section>

      <div className="mb-7 grid gap-4 md:grid-cols-2 xl:grid-cols-5">
        <div className="rounded-3xl border border-border bg-card p-5 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md">
          <GraduationCap size={22} className="text-primary" />
          <p className="mt-4 text-sm text-muted-foreground">Alunos</p>
          <p className="mt-1 text-4xl font-semibold tracking-tight text-foreground">
            {totalAlunos}
          </p>
          <p className="mt-2 text-xs text-muted-foreground">
            Resultado atual
          </p>
        </div>

        <div className="rounded-3xl border border-border bg-card p-5 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md">
          <AlertTriangle size={22} className="text-primary" />
          <p className="mt-4 text-sm text-muted-foreground">Atenção</p>
          <p className="mt-1 text-4xl font-semibold tracking-tight text-foreground">
            {alunosComAtencao}
          </p>
          <p className="mt-2 text-xs text-muted-foreground">
            {alunosComOcorrencia} com ocorrência
          </p>
        </div>

        <div className="rounded-3xl border border-border bg-card p-5 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md">
          <ClipboardList size={22} className="text-primary" />
          <p className="mt-4 text-sm text-muted-foreground">Pulse</p>
          <p className="mt-1 text-4xl font-semibold tracking-tight text-foreground">
            {alunosComTarefaAberta}
          </p>
          <p className="mt-2 text-xs text-muted-foreground">
            Com tarefa aberta
          </p>
        </div>

        <div className="rounded-3xl border border-border bg-card p-5 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md">
          <MessageCircle size={22} className="text-primary" />
          <p className="mt-4 text-sm text-muted-foreground">Comunicação</p>
          <p className="mt-1 text-4xl font-semibold tracking-tight text-foreground">
            {alunosComComunicacaoPendente}
          </p>
          <p className="mt-2 text-xs text-muted-foreground">
            Família pendente
          </p>
        </div>

        <div className="rounded-3xl border border-border bg-card p-5 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md">
          <UsersRound size={22} className="text-primary" />
          <p className="mt-4 text-sm text-muted-foreground">Sem matrícula</p>
          <p className="mt-1 text-4xl font-semibold tracking-tight text-foreground">
            {alunosSemMatricula}
          </p>
          <p className="mt-2 text-xs text-muted-foreground">
            Precisam revisar
          </p>
        </div>
      </div>

      <section className="mb-7 rounded-[2rem] border border-border bg-card p-5 shadow-sm">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-4">
          <div>
            <h2 className="font-semibold text-foreground">
              Turmas cadastradas
            </h2>
            <p className="text-sm text-muted-foreground">
              Acesse rapidamente os alunos de cada turma.
            </p>
          </div>

          <a
            href="/turmas"
            className="group inline-flex items-center gap-2 text-sm font-semibold text-primary"
          >
            Ver turmas
            <ArrowRight
              size={16}
              className="transition-transform duration-200 group-hover:translate-x-1"
            />
          </a>
        </div>

        {turmas.length === 0 ? (
          <p className="rounded-2xl border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
            Nenhuma turma cadastrada.
          </p>
        ) : (
          <div className="flex gap-3 overflow-x-auto pb-2">
            <a
              href="/alunos"
              className={`shrink-0 rounded-2xl border px-4 py-3 text-sm font-semibold transition-all duration-200 hover:-translate-y-0.5 hover:shadow-sm ${
                !turmaFiltro
                  ? "border-primary bg-primary/10 text-primary"
                  : "border-border bg-background text-foreground hover:bg-muted"
              }`}
            >
              Todas
            </a>

            {turmas.map((turma) => (
              <a
                key={turma.id}
                href={`/alunos?turma=${turma.id}`}
                className={`shrink-0 rounded-2xl border px-4 py-3 text-sm font-semibold transition-all duration-200 hover:-translate-y-0.5 hover:shadow-sm ${
                  turmaFiltro === turma.id
                    ? "border-primary bg-primary/10 text-primary"
                    : "border-border bg-background text-foreground hover:bg-muted"
                }`}
              >
                {turma.nome}
                <span className="ml-2 rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground">
                  {turma._count.alunos}
                </span>
              </a>
            ))}
          </div>
        )}
      </section>

      <section className="mb-24 rounded-[2rem] border border-border bg-card p-5 shadow-sm">
        <div className="mb-5 flex flex-wrap items-center justify-between gap-4">
          <div>
            <h2 className="font-semibold text-foreground">
              Lista inteligente de alunos
            </h2>
            <p className="text-sm text-muted-foreground">
              Visualize status, alertas e ações rápidas.
            </p>
          </div>

          <p className="rounded-full bg-muted px-4 py-2 text-sm font-medium text-muted-foreground">
            {totalAlunos} aluno(s)
          </p>
        </div>

        {alunos.length === 0 ? (
          <div className="rounded-3xl border border-dashed border-border p-10 text-center">
            <GraduationCap className="mx-auto text-primary" size={32} />

            <h3 className="mt-4 font-semibold text-foreground">
              Nenhum aluno encontrado
            </h3>

            <p className="mt-2 text-sm text-muted-foreground">
              Tente limpar os filtros ou cadastrar um novo aluno.
            </p>

            <a
              href="/alunos/novo"
              className="mt-5 inline-flex items-center gap-2 rounded-2xl bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground transition hover:opacity-90"
            >
              <Plus size={16} />
              Cadastrar aluno
            </a>
          </div>
        ) : (
          <div className="grid gap-4 xl:grid-cols-2">
            {alunos.map((aluno) => {
              const matriculaAtual = aluno.matriculas[0] ?? null;
              const statusMatricula = matriculaAtual?.status ?? null;

              const tarefasAbertas = aluno.tarefas.length;
              const comunicadosPendentes =
                aluno.destinatariosComunicados.length;
              const ocorrencias = aluno.ocorrencias.length;
              const semMatricula = !matriculaAtual;

              const temAlerta =
                tarefasAbertas > 0 ||
                comunicadosPendentes > 0 ||
                ocorrencias > 0 ||
                semMatricula;

              return (
                <article
                  key={aluno.id}
                  className="group flex min-h-[260px] flex-col rounded-3xl border border-border bg-card p-4 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:border-primary/20 hover:shadow-md"
                >
                  <div className="mb-4 flex items-start justify-between gap-4">
                    <div className="flex min-w-0 items-start gap-3">
                      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-primary transition-transform duration-200 group-hover:scale-105">
                        <GraduationCap size={22} />
                      </div>

                      <div className="min-w-0">
                        <h3 className="truncate text-xl font-semibold tracking-tight text-foreground">
                          {aluno.nome}
                        </h3>

                        <p className="mt-1 text-sm text-muted-foreground">
                          {aluno.turma?.nome || "Sem turma"} ·{" "}
                          {aluno.turma?.segmento || "Segmento não informado"}
                        </p>
                      </div>
                    </div>

                    <span
                      className={`shrink-0 rounded-full border px-3 py-1 text-xs font-semibold ${getStatusClass(
                        statusMatricula,
                      )}`}
                    >
                      {getStatusLabel(statusMatricula)}
                    </span>
                  </div>

                  <div className="mb-4 grid gap-3 md:grid-cols-2">
                    <div className="rounded-2xl border border-border bg-background p-3">
                      <div className="mb-2 flex items-center gap-2">
                        <UserRound size={16} className="text-primary" />
                        <p className="text-xs font-medium text-muted-foreground">
                          Responsável
                        </p>
                      </div>

                      <p className="truncate text-sm font-semibold text-foreground">
                        {aluno.responsavel?.nome || "Não informado"}
                      </p>

                      <p className="mt-1 truncate text-xs text-muted-foreground">
                        {aluno.responsavel?.telefone ||
                          "Telefone não informado"}
                      </p>
                    </div>

                    <div className="rounded-2xl border border-border bg-background p-3">
                      <div className="mb-2 flex items-center gap-2">
                        <ClipboardList size={16} className="text-primary" />
                        <p className="text-xs font-medium text-muted-foreground">
                          Matrícula
                        </p>
                      </div>

                      <p className="text-sm font-semibold text-foreground">
                        {matriculaAtual
                          ? `Ano letivo ${matriculaAtual.anoLetivo}`
                          : "Sem matrícula"}
                      </p>

                      <p className="mt-1 text-xs text-muted-foreground">
                        {getStatusLabel(statusMatricula)}
                      </p>
                    </div>
                  </div>

                  <div className="mb-4 flex flex-wrap gap-2">
                    {tarefasAbertas > 0 && (
                      <span className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
                        <ClipboardList size={13} />
                        {tarefasAbertas} tarefa(s)
                      </span>
                    )}

                    {comunicadosPendentes > 0 && (
                      <span className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
                        <MessageCircle size={13} />
                        {comunicadosPendentes} comunicado(s)
                      </span>
                    )}

                    {ocorrencias > 0 && (
                      <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-700">
                        <AlertTriangle size={13} />
                        {ocorrencias} ocorrência(s)
                      </span>
                    )}

                    {semMatricula && (
                      <span className="inline-flex items-center gap-1 rounded-full bg-red-50 px-3 py-1 text-xs font-semibold text-red-700">
                        <AlertTriangle size={13} />
                        Sem matrícula
                      </span>
                    )}

                    {!temAlerta && (
                      <span className="inline-flex items-center gap-1 rounded-full bg-muted px-3 py-1 text-xs font-semibold text-muted-foreground">
                        <CheckCircle2 size={13} />
                        Sem alertas
                      </span>
                    )}
                  </div>

                  <div className="mt-auto flex flex-wrap gap-3 border-t border-border pt-4">
                    <a
                      href={`/alunos/${aluno.id}`}
                      className="group/button inline-flex items-center justify-center gap-2 rounded-2xl border border-border bg-background px-4 py-2.5 text-sm font-semibold text-foreground transition-all duration-200 hover:-translate-y-0.5 hover:bg-muted hover:shadow-sm active:scale-[0.98]"
                    >
                      Abrir prontuário
                      <ArrowRight
                        size={16}
                        className="transition-transform duration-200 group-hover/button:translate-x-1"
                      />
                    </a>

                    <a
                      href={`/alunos/${aluno.id}/lumi`}
                      className="group/button inline-flex items-center justify-center gap-2 rounded-2xl bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground shadow-sm shadow-primary/20 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg hover:shadow-primary/25 active:scale-[0.98]"
                    >
                      <Sparkles
                        size={16}
                        className="transition-transform duration-200 group-hover/button:rotate-12 group-hover/button:scale-110"
                      />
                      Lumi
                    </a>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </section>
    </AppLayout>
  );
}