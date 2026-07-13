import AppLayout from "@/components/layout/AppLayout";
import EmptyState from "@/components/lumina/EmptyState";
import MetricCard from "@/components/lumina/MetricCard";
import PageHeader from "@/components/lumina/PageHeader";
import PrimaryAction from "@/components/lumina/PrimaryAction";
import SecondaryAction from "@/components/lumina/SecondaryAction";
import SectionCard from "@/components/lumina/SectionCard";
import StatusBadge, {
  type StatusBadgeTone,
} from "@/components/lumina/StatusBadge";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
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

type EnrollmentStatus = {
  label: string;
  tone: StatusBadgeTone;
};

function getEnrollmentStatus(
  status?: string | null,
): EnrollmentStatus {
  if (!status) {
    return {
      label: "Sem matrícula",
      tone: "neutral",
    };
  }

  const statusMap: Record<string, EnrollmentStatus> = {
    PENDENTE: {
      label: "Pendente",
      tone: "warning",
    },
    EM_ANALISE: {
      label: "Em análise",
      tone: "warning",
    },
    AGUARDANDO_DOCUMENTOS: {
      label: "Aguardando documentos",
      tone: "warning",
    },
    AGUARDANDO_PAGAMENTO: {
      label: "Aguardando pagamento",
      tone: "warning",
    },
    ATIVA: {
      label: "Ativa",
      tone: "primary",
    },
    CANCELADA: {
      label: "Cancelada",
      tone: "danger",
    },
    CONCLUIDA: {
      label: "Concluída",
      tone: "success",
    },
  };

  return (
    statusMap[status] ?? {
      label: status,
      tone: "neutral",
    }
  );
}

export default async function AlunosPage({
  searchParams,
}: PageProps) {
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
        const statusAtual =
          matriculaAtual?.status ?? "SEM_MATRICULA";

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
    const temComunicado =
      aluno.destinatariosComunicados.length > 0;
    const temOcorrencia = aluno.ocorrencias.length > 0;
    const semMatricula = aluno.matriculas.length === 0;

    return (
      temTarefa ||
      temComunicado ||
      temOcorrencia ||
      semMatricula
    );
  }).length;

  return (
    <AppLayout>
      <PageHeader
        eyebrow="Vida Escolar"
        title="Alunos"
        description="Consulte alunos, responsáveis, turmas, situação de matrícula e alertas rápidos antes de abrir o prontuário."
        action={{
          label: "Novo aluno",
          href: "/alunos/novo",
          icon: Plus,
        }}
      />

      <section className="mb-7 overflow-hidden rounded-[2rem] border border-border bg-card shadow-sm">
        <div className="relative p-5">
          <div className="absolute right-0 top-0 h-32 w-32 rounded-full bg-primary/10 blur-3xl" />

          <form
            action="/alunos"
            method="get"
            className="relative grid gap-3 xl:grid-cols-[1fr_210px_210px_auto]"
          >
            <div className="flex h-12 items-center gap-3 rounded-2xl border border-border bg-background px-4 shadow-sm">
              <Search
                size={18}
                className="text-muted-foreground"
              />

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
                <option
                  key={turma.id}
                  value={turma.id}
                >
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
              <option value="EM_ANALISE">
                Em análise
              </option>
              <option value="AGUARDANDO_DOCUMENTOS">
                Aguardando documentos
              </option>
              <option value="AGUARDANDO_PAGAMENTO">
                Aguardando pagamento
              </option>
              <option value="SEM_MATRICULA">
                Sem matrícula
              </option>
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
              <SecondaryAction
                label="Limpar filtros"
                href="/alunos"
              />
            </div>
          )}
        </div>
      </section>

      <section className="mb-7 grid gap-4 md:grid-cols-2 xl:grid-cols-5">
        <MetricCard
          label="Alunos"
          value={totalAlunos}
          description="Resultado atual"
          icon={GraduationCap}
        />

        <MetricCard
          label="Atenção"
          value={alunosComAtencao}
          description={`${alunosComOcorrencia} com ocorrência`}
          icon={AlertTriangle}
          tone={
            alunosComAtencao > 0
              ? "warning"
              : "primary"
          }
        />

        <MetricCard
          label="Pulse"
          value={alunosComTarefaAberta}
          description="Com tarefa aberta"
          icon={ClipboardList}
        />

        <MetricCard
          label="Comunicação"
          value={alunosComComunicacaoPendente}
          description="Família pendente"
          icon={MessageCircle}
        />

        <MetricCard
          label="Sem matrícula"
          value={alunosSemMatricula}
          description="Precisam revisar"
          icon={UsersRound}
          tone={
            alunosSemMatricula > 0
              ? "danger"
              : "primary"
          }
        />
      </section>

      <SectionCard
        title="Turmas cadastradas"
        description="Acesse rapidamente os alunos de cada turma."
        className="mb-7"
        action={
          <Link
            href="/turmas"
            className="group inline-flex items-center gap-2 text-sm font-semibold text-primary"
          >
            Ver turmas

            <ArrowRight
              size={16}
              className="transition-transform duration-200 group-hover:translate-x-1"
            />
          </Link>
        }
      >
        {turmas.length === 0 ? (
          <EmptyState
            compact
            icon={UsersRound}
            title="Nenhuma turma cadastrada"
            description="Cadastre uma turma para começar a organizar os alunos."
          />
        ) : (
          <div className="flex gap-3 overflow-x-auto pb-2">
            <Link
              href="/alunos"
              className={`shrink-0 rounded-2xl border px-4 py-3 text-sm font-semibold transition-all duration-200 hover:-translate-y-0.5 hover:shadow-sm ${
                !turmaFiltro
                  ? "border-primary bg-primary/10 text-primary"
                  : "border-border bg-background text-foreground hover:bg-muted"
              }`}
            >
              Todas
            </Link>

            {turmas.map((turma) => (
              <Link
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
              </Link>
            ))}
          </div>
        )}
      </SectionCard>

      <SectionCard
        title="Lista inteligente de alunos"
        description="Visualize status, alertas e ações rápidas."
        className="mb-24"
        action={
          <p className="rounded-full bg-muted px-4 py-2 text-sm font-medium text-muted-foreground">
            {totalAlunos} aluno
            {totalAlunos === 1 ? "" : "s"}
          </p>
        }
      >
        {alunos.length === 0 ? (
          <EmptyState
            icon={GraduationCap}
            title="Nenhum aluno encontrado"
            description="Tente limpar os filtros ou cadastrar um novo aluno."
            action={{
              label: "Cadastrar aluno",
              href: "/alunos/novo",
              icon: Plus,
            }}
          />
        ) : (
          <div className="grid gap-4 xl:grid-cols-2">
            {alunos.map((aluno) => {
              const matriculaAtual =
                aluno.matriculas[0] ?? null;

              const statusMatricula =
                matriculaAtual?.status ?? null;

              const enrollmentStatus =
                getEnrollmentStatus(statusMatricula);

              const tarefasAbertas =
                aluno.tarefas.length;

              const comunicadosPendentes =
                aluno.destinatariosComunicados.length;

              const ocorrencias =
                aluno.ocorrencias.length;

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
                          {aluno.turma?.nome ||
                            "Sem turma"}{" "}
                          ·{" "}
                          {aluno.turma?.segmento ||
                            "Segmento não informado"}
                        </p>
                      </div>
                    </div>

                    <StatusBadge
                      tone={enrollmentStatus.tone}
                    >
                      {enrollmentStatus.label}
                    </StatusBadge>
                  </div>

                  <div className="mb-4 grid gap-3 md:grid-cols-2">
                    <div className="rounded-2xl border border-border bg-background p-3">
                      <div className="mb-2 flex items-center gap-2">
                        <UserRound
                          size={16}
                          className="text-primary"
                        />

                        <p className="text-xs font-medium text-muted-foreground">
                          Responsável
                        </p>
                      </div>

                      <p className="truncate text-sm font-semibold text-foreground">
                        {aluno.responsavel?.nome ||
                          "Não informado"}
                      </p>

                      <p className="mt-1 truncate text-xs text-muted-foreground">
                        {aluno.responsavel?.telefone ||
                          "Telefone não informado"}
                      </p>
                    </div>

                    <div className="rounded-2xl border border-border bg-background p-3">
                      <div className="mb-2 flex items-center gap-2">
                        <ClipboardList
                          size={16}
                          className="text-primary"
                        />

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
                        {enrollmentStatus.label}
                      </p>
                    </div>
                  </div>

                  <div className="mb-4 flex flex-wrap gap-2">
                    {tarefasAbertas > 0 && (
                      <StatusBadge tone="primary">
                        <span className="inline-flex items-center gap-1">
                          <ClipboardList size={13} />
                          {tarefasAbertas} tarefa
                          {tarefasAbertas === 1
                            ? ""
                            : "s"}
                        </span>
                      </StatusBadge>
                    )}

                    {comunicadosPendentes > 0 && (
                      <StatusBadge tone="primary">
                        <span className="inline-flex items-center gap-1">
                          <MessageCircle size={13} />
                          {comunicadosPendentes} comunicado
                          {comunicadosPendentes === 1
                            ? ""
                            : "s"}
                        </span>
                      </StatusBadge>
                    )}

                    {ocorrencias > 0 && (
                      <StatusBadge tone="warning">
                        <span className="inline-flex items-center gap-1">
                          <AlertTriangle size={13} />
                          {ocorrencias} ocorrência
                          {ocorrencias === 1
                            ? ""
                            : "s"}
                        </span>
                      </StatusBadge>
                    )}

                    {semMatricula && (
                      <StatusBadge tone="danger">
                        <span className="inline-flex items-center gap-1">
                          <AlertTriangle size={13} />
                          Sem matrícula
                        </span>
                      </StatusBadge>
                    )}

                    {!temAlerta && (
                      <StatusBadge tone="neutral">
                        <span className="inline-flex items-center gap-1">
                          <CheckCircle2 size={13} />
                          Sem alertas
                        </span>
                      </StatusBadge>
                    )}
                  </div>

                  <div className="mt-auto flex flex-wrap gap-3 border-t border-border pt-4">
                    <SecondaryAction
                      label="Abrir prontuário"
                      href={`/alunos/${aluno.id}`}
                      trailingIcon={ArrowRight}
                    />

                    <PrimaryAction
                      label="Lumi"
                      href={`/alunos/${aluno.id}/lumi`}
                      icon={Sparkles}
                      iconAnimation="scale"
                    />
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </SectionCard>
    </AppLayout>
  );
}