import AppLayout from "@/components/layout/AppLayout";
import EmptyState from "@/components/lumina/EmptyState";
import MetricCard from "@/components/lumina/MetricCard";
import PageHeader from "@/components/lumina/PageHeader";
import PrimaryAction from "@/components/lumina/PrimaryAction";
import ProgressBar from "@/components/lumina/ProgressBar";
import SecondaryAction from "@/components/lumina/SecondaryAction";
import SectionCard from "@/components/lumina/SectionCard";
import StatusBadge, {
  type StatusBadgeTone,
} from "@/components/lumina/StatusBadge";
import { prisma } from "@/lib/prisma";
import {
  AlertTriangle,
  ArrowRight,
  CheckCircle2,
  CircleDollarSign,
  ClipboardCheck,
  ClipboardList,
  FileCheck2,
  GraduationCap,
  Plus,
  Search,
  Sparkles,
  UserRound,
} from "lucide-react";

export const dynamic = "force-dynamic";

type PageProps = {
  searchParams?: Promise<{
    busca?: string;
    status?: string;
    ano?: string;
  }>;
};

type EnrollmentStatusInfo = {
  label: string;
  tone: StatusBadgeTone;
  progress: number;
  progressTone:
    | "primary"
    | "success"
    | "warning"
    | "danger"
    | "neutral";
  nextStep: string;
};

function getEnrollmentStatusInfo(
  status: string,
): EnrollmentStatusInfo {
  const statusMap: Record<string, EnrollmentStatusInfo> = {
    PENDENTE: {
      label: "Pendente",
      tone: "warning",
      progress: 15,
      progressTone: "warning",
      nextStep: "Iniciar análise do processo",
    },

    EM_ANALISE: {
      label: "Em análise",
      tone: "info",
      progress: 35,
      progressTone: "primary",
      nextStep: "Concluir análise dos dados",
    },

    AGUARDANDO_DOCUMENTOS: {
      label: "Aguardando documentos",
      tone: "warning",
      progress: 55,
      progressTone: "warning",
      nextStep: "Receber documentos pendentes",
    },

    AGUARDANDO_PAGAMENTO: {
      label: "Aguardando pagamento",
      tone: "warning",
      progress: 75,
      progressTone: "warning",
      nextStep: "Confirmar pagamento",
    },

    ATIVA: {
      label: "Ativa",
      tone: "success",
      progress: 100,
      progressTone: "success",
      nextStep: "Processo regularizado",
    },

    CONCLUIDA: {
      label: "Concluída",
      tone: "success",
      progress: 100,
      progressTone: "success",
      nextStep: "Processo concluído",
    },

    CANCELADA: {
      label: "Cancelada",
      tone: "danger",
      progress: 0,
      progressTone: "danger",
      nextStep: "Processo encerrado",
    },
  };

  return (
    statusMap[status] ?? {
      label: status,
      tone: "neutral",
      progress: 0,
      progressTone: "neutral",
      nextStep: "Verificar situação da matrícula",
    }
  );
}

export default async function MatriculasPage({
  searchParams,
}: PageProps) {
  const params = await searchParams;

  const busca = params?.busca?.trim() ?? "";
  const statusFiltro = params?.status?.trim() ?? "";
  const anoFiltro = params?.ano?.trim() ?? "";

  const matriculas = await prisma.matricula.findMany({
    where: {
      ...(statusFiltro
        ? {
            status: statusFiltro as
              | "PENDENTE"
              | "EM_ANALISE"
              | "AGUARDANDO_DOCUMENTOS"
              | "AGUARDANDO_PAGAMENTO"
              | "ATIVA"
              | "CANCELADA"
              | "CONCLUIDA",
          }
        : {}),

      ...(anoFiltro
        ? {
            anoLetivo: Number(anoFiltro),
          }
        : {}),

      ...(busca
        ? {
            OR: [
              {
                aluno: {
                  nome: {
                    contains: busca,
                    mode: "insensitive",
                  },
                },
              },
              {
                aluno: {
                  responsavel: {
                    nome: {
                      contains: busca,
                      mode: "insensitive",
                    },
                  },
                },
              },
              {
                aluno: {
                  turma: {
                    nome: {
                      contains: busca,
                      mode: "insensitive",
                    },
                  },
                },
              },
            ],
          }
        : {}),
    },

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

        orderBy: {
          criadoEm: "desc",
        },
      },
    },
  });

  const anosDisponiveisRaw = await prisma.matricula.findMany({
    distinct: ["anoLetivo"],
    orderBy: {
      anoLetivo: "desc",
    },
    select: {
      anoLetivo: true,
    },
  });

  const anosDisponiveis = anosDisponiveisRaw.map(
    (item) => item.anoLetivo,
  );

  const totalMatriculas = matriculas.length;

  const matriculasAtivas = matriculas.filter(
    (matricula) =>
      matricula.status === "ATIVA" ||
      matricula.status === "CONCLUIDA",
  ).length;

  const matriculasEmAndamento = matriculas.filter(
    (matricula) =>
      !["ATIVA", "CONCLUIDA", "CANCELADA"].includes(
        matricula.status,
      ),
  ).length;

  const aguardandoDocumentos = matriculas.filter(
    (matricula) =>
      matricula.status === "AGUARDANDO_DOCUMENTOS",
  ).length;

  const aguardandoPagamento = matriculas.filter(
    (matricula) =>
      matricula.status === "AGUARDANDO_PAGAMENTO",
  ).length;

  const tarefasAbertas = matriculas.reduce(
    (total, matricula) =>
      total + matricula.tarefas.length,
    0,
  );

  const filtrosAtivos =
    Boolean(busca) ||
    Boolean(statusFiltro) ||
    Boolean(anoFiltro);

  return (
    <AppLayout>
      <PageHeader
        eyebrow="Centro de Matrículas"
        title="Matrículas"
        description="Acompanhe cada etapa da entrada do aluno, identifique pendências e mantenha os processos organizados até a ativação."
        action={{
          label: "Nova matrícula",
          href: "/matriculas/novo",
          icon: Plus,
        }}
      />

      <section className="mb-7 overflow-hidden rounded-[2rem] border border-border bg-card shadow-sm">
        <div className="relative p-5">
          <div className="absolute right-0 top-0 h-32 w-32 rounded-full bg-primary/10 blur-3xl" />

          <form
            action="/matriculas"
            method="get"
            className="relative grid gap-3 xl:grid-cols-[1fr_220px_180px_auto]"
          >
            <div className="flex h-12 items-center gap-3 rounded-2xl border border-border bg-background px-4 shadow-sm">
              <Search
                size={18}
                className="shrink-0 text-muted-foreground"
              />

              <input
                name="busca"
                defaultValue={busca}
                placeholder="Buscar aluno, responsável ou turma..."
                className="h-full w-full bg-transparent text-sm text-foreground outline-none placeholder:text-muted-foreground"
              />
            </div>

            <select
              name="status"
              defaultValue={statusFiltro}
              className="h-12 rounded-2xl border border-border bg-background px-4 text-sm text-foreground shadow-sm outline-none"
            >
              <option value="">Todos os status</option>
              <option value="PENDENTE">Pendente</option>
              <option value="EM_ANALISE">Em análise</option>
              <option value="AGUARDANDO_DOCUMENTOS">
                Aguardando documentos
              </option>
              <option value="AGUARDANDO_PAGAMENTO">
                Aguardando pagamento
              </option>
              <option value="ATIVA">Ativa</option>
              <option value="CONCLUIDA">Concluída</option>
              <option value="CANCELADA">Cancelada</option>
            </select>

            <select
              name="ano"
              defaultValue={anoFiltro}
              className="h-12 rounded-2xl border border-border bg-background px-4 text-sm text-foreground shadow-sm outline-none"
            >
              <option value="">Todos os anos</option>

              {anosDisponiveis.map((ano) => (
                <option key={ano} value={ano}>
                  {ano}
                </option>
              ))}
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

          {filtrosAtivos && (
            <div className="relative mt-4">
              <SecondaryAction
                label="Limpar filtros"
                href="/matriculas"
              />
            </div>
          )}
        </div>
      </section>

      <section className="mb-7 grid gap-4 md:grid-cols-2 xl:grid-cols-5">
        <MetricCard
          label="Matrículas"
          value={totalMatriculas}
          description="Processos encontrados"
          icon={GraduationCap}
        />

        <MetricCard
          label="Em andamento"
          value={matriculasEmAndamento}
          description="Precisam de acompanhamento"
          icon={ClipboardList}
          tone={
            matriculasEmAndamento > 0
              ? "warning"
              : "primary"
          }
        />

        <MetricCard
          label="Ativas"
          value={matriculasAtivas}
          description="Processos regularizados"
          icon={CheckCircle2}
          tone="success"
        />

        <MetricCard
          label="Documentos"
          value={aguardandoDocumentos}
          description="Aguardando entrega"
          icon={FileCheck2}
          tone={
            aguardandoDocumentos > 0
              ? "warning"
              : "primary"
          }
        />

        <MetricCard
          label="Pulse"
          value={tarefasAbertas}
          description={`${aguardandoPagamento} aguardando pagamento`}
          icon={ClipboardCheck}
          tone={
            tarefasAbertas > 0
              ? "warning"
              : "primary"
          }
        />
      </section>

      <section className="mb-7 rounded-[2rem] border border-primary/15 bg-primary/5 p-5 shadow-sm">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-start gap-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-3xl bg-primary text-primary-foreground shadow-sm shadow-primary/20">
              <Sparkles size={21} />
            </div>

            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-primary">
                Leitura da Lumi
              </p>

              <h2 className="mt-1 text-lg font-semibold text-foreground">
                {matriculasEmAndamento > 0
                  ? `${matriculasEmAndamento} processo${
                      matriculasEmAndamento === 1
                        ? ""
                        : "s"
                    } ainda precisa${
                      matriculasEmAndamento === 1
                        ? ""
                        : "m"
                    } de acompanhamento.`
                  : "Os processos encontrados estão regularizados."}
              </h2>

              <p className="mt-2 max-w-3xl text-sm leading-6 text-muted-foreground">
                {tarefasAbertas > 0
                  ? `Existem ${tarefasAbertas} tarefas abertas relacionadas às matrículas. Priorize documentos, pagamentos e análises pendentes.`
                  : "Não encontrei tarefas abertas relacionadas às matrículas exibidas."}
              </p>
            </div>
          </div>

          <SecondaryAction
            label="Abrir Pulse"
            href="/pulse"
            icon={ClipboardList}
            trailingIcon={ArrowRight}
          />
        </div>
      </section>

      <SectionCard
        title="Jornada de matrículas"
        description="Acompanhe o progresso, as pendências e o próximo passo de cada processo."
        className="mb-24"
        action={
          <p className="rounded-full bg-muted px-4 py-2 text-sm font-medium text-muted-foreground">
            {totalMatriculas} matrícula
            {totalMatriculas === 1 ? "" : "s"}
          </p>
        }
      >
        {matriculas.length === 0 ? (
          <EmptyState
            icon={GraduationCap}
            title="Nenhuma matrícula encontrada"
            description={
              filtrosAtivos
                ? "Tente limpar os filtros para visualizar outros processos."
                : "Cadastre um aluno para iniciar o primeiro processo de matrícula."
            }
            action={{
              label: "Iniciar matrícula",
              href: "/matriculas/novo",
              icon: Plus,
            }}
          />
        ) : (
          <div className="grid gap-4 xl:grid-cols-2">
            {matriculas.map((matricula) => {
              const statusInfo =
                getEnrollmentStatusInfo(
                  matricula.status,
                );

              const totalTarefas =
                matricula.tarefas.length;

              const possuiTarefas =
                totalTarefas > 0;

              return (
                <article
                  key={matricula.id}
                  className="group flex min-h-[350px] flex-col rounded-3xl border border-border bg-card p-5 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:border-primary/25 hover:shadow-md"
                >
                  <div className="mb-5 flex items-start justify-between gap-4">
                    <div className="flex min-w-0 items-start gap-3">
                      <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-primary transition-transform duration-200 group-hover:scale-105">
                        <GraduationCap size={23} />
                      </div>

                      <div className="min-w-0">
                        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">
                          Ano letivo{" "}
                          {matricula.anoLetivo}
                        </p>

                        <h3 className="mt-1 truncate text-xl font-semibold tracking-tight text-foreground">
                          {matricula.aluno.nome}
                        </h3>

                        <p className="mt-1 text-sm text-muted-foreground">
                          {matricula.aluno.turma?.nome ??
                            "Sem turma definida"}
                        </p>
                      </div>
                    </div>

                    <StatusBadge
                      tone={statusInfo.tone}
                    >
                      {statusInfo.label}
                    </StatusBadge>
                  </div>

                  <div className="mb-4 rounded-3xl border border-border bg-background p-4">
                    <div className="mb-3 flex items-center justify-between gap-4">
                      <div>
                        <p className="text-xs font-medium text-muted-foreground">
                          Progresso da matrícula
                        </p>

                        <p className="mt-1 text-sm font-semibold text-foreground">
                          {statusInfo.nextStep}
                        </p>
                      </div>

                      <p className="text-2xl font-semibold tracking-tight text-foreground">
                        {statusInfo.progress}%
                      </p>
                    </div>

                    <ProgressBar
                      value={statusInfo.progress}
                      tone={statusInfo.progressTone}
                    />
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
                        {
                          matricula.aluno
                            .responsavel.nome
                        }
                      </p>

                      <p className="mt-1 truncate text-xs text-muted-foreground">
                        {matricula.aluno.responsavel
                          .telefone ||
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
                          Processo
                        </p>
                      </div>

                      <p className="text-sm font-semibold text-foreground">
                        Criado em{" "}
                        {matricula.criadoEm.toLocaleDateString(
                          "pt-BR",
                        )}
                      </p>

                      <p className="mt-1 text-xs text-muted-foreground">
                        {totalTarefas} tarefa
                        {totalTarefas === 1 ? "" : "s"}{" "}
                        aberta
                        {totalTarefas === 1 ? "" : "s"}
                      </p>
                    </div>
                  </div>

                  <div className="mb-5 flex flex-wrap gap-2">
                    {possuiTarefas ? (
                      <StatusBadge tone="warning">
                        <span className="inline-flex items-center gap-1">
                          <AlertTriangle size={13} />

                          {totalTarefas} pendência
                          {totalTarefas === 1
                            ? ""
                            : "s"}{" "}
                          no Pulse
                        </span>
                      </StatusBadge>
                    ) : (
                      <StatusBadge tone="success">
                        <span className="inline-flex items-center gap-1">
                          <CheckCircle2 size={13} />
                          Sem tarefas abertas
                        </span>
                      </StatusBadge>
                    )}

                    {matricula.status ===
                      "AGUARDANDO_DOCUMENTOS" && (
                      <StatusBadge tone="warning">
                        <span className="inline-flex items-center gap-1">
                          <FileCheck2 size={13} />
                          Documentação pendente
                        </span>
                      </StatusBadge>
                    )}

                    {matricula.status ===
                      "AGUARDANDO_PAGAMENTO" && (
                      <StatusBadge tone="warning">
                        <span className="inline-flex items-center gap-1">
                          <CircleDollarSign
                            size={13}
                          />
                          Pagamento pendente
                        </span>
                      </StatusBadge>
                    )}
                  </div>

                  <div className="mt-auto flex flex-wrap gap-3 border-t border-border pt-4">
                    <SecondaryAction
                      label="Abrir prontuário"
                      href={`/alunos/${matricula.aluno.id}`}
                      trailingIcon={ArrowRight}
                    />

                    <PrimaryAction
                      label="Lumi"
                      href={`/alunos/${matricula.aluno.id}/lumi`}
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