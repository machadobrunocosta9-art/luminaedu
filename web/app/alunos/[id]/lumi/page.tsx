import AppLayout from "@/components/layout/AppLayout";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  AlertTriangle,
  ArrowLeft,
  ArrowRight,
  CalendarDays,
  CheckCircle2,
  ClipboardList,
  FileText,
  GraduationCap,
  MessageCircle,
  Sparkles,
  UserRound,
} from "lucide-react";

export const dynamic = "force-dynamic";

type PageProps = {
  params: Promise<{
    id: string;
  }>;
};

function formatDateTime(date?: Date | null) {
  if (!date) return "Não informado";

  return new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(date);
}

function getStatusLabel(status: string) {
  const labels: Record<string, string> = {
    PENDENTE: "Pendente",
    EM_ANALISE: "Em análise",
    AGUARDANDO_DOCUMENTOS: "Aguardando documentos",
    AGUARDANDO_PAGAMENTO: "Aguardando pagamento",
    ATIVA: "Ativa",
    CANCELADA: "Cancelada",
    CONCLUIDA: "Concluída",
    A_FAZER: "A fazer",
    EM_ANDAMENTO: "Em andamento",
    AGUARDANDO: "Aguardando",
    REGISTRADO: "Registrado",
    ENVIADO: "Enviado",
    VISUALIZADO: "Visualizado",
    RESPONDIDO: "Respondido",
    RASCUNHO: "Rascunho",
    CANCELADO: "Cancelado",
  };

  return labels[status] ?? status;
}

function getTipoOcorrenciaLabel(tipo: string) {
  const labels: Record<string, string> = {
    ADVERTENCIA: "Advertência",
    SUSPENSAO: "Suspensão",
    OCORRENCIA: "Ocorrência",
    RELATORIO: "Relatório",
    RESUMO: "Resumo",
    ATENDIMENTO: "Atendimento",
  };

  return labels[tipo] ?? tipo;
}

function getPrioridadeLabel(prioridade: string) {
  const labels: Record<string, string> = {
    BAIXA: "Baixa",
    MEDIA: "Média",
    ALTA: "Alta",
    CRITICA: "Crítica",
  };

  return labels[prioridade] ?? prioridade;
}

export default async function LumiAlunoPage({ params }: PageProps) {
  const { id } = await params;

  const aluno = await prisma.aluno.findUnique({
    where: {
      id,
    },
    include: {
      responsavel: true,
      turma: true,
      matriculas: {
        orderBy: {
          criadoEm: "desc",
        },
      },
      tarefas: {
        orderBy: {
          criadoEm: "desc",
        },
        take: 10,
      },
      ocorrencias: {
        orderBy: {
          criadoEm: "desc",
        },
        take: 10,
      },
      destinatariosComunicados: {
        orderBy: {
          criadoEm: "desc",
        },
        take: 10,
        include: {
          comunicado: true,
          respostas: {
            orderBy: {
              criadoEm: "desc",
            },
            take: 1,
          },
        },
      },
    },
  });

  if (!aluno) {
    notFound();
  }

  const matriculaAtual = aluno.matriculas[0] ?? null;

  const tarefasAbertas = aluno.tarefas.filter(
    (tarefa) => tarefa.status !== "CONCLUIDA",
  );

  const tarefasPrioritarias = tarefasAbertas.filter((tarefa) =>
    ["ALTA", "CRITICA"].includes(tarefa.prioridade),
  );

  const ocorrenciasDisciplinares = aluno.ocorrencias.filter((ocorrencia) =>
    ["ADVERTENCIA", "SUSPENSAO"].includes(ocorrencia.tipo),
  );

  const comunicadosPendentes = aluno.destinatariosComunicados.filter(
    (item) => item.status !== "RESPONDIDO" && item.status !== "CANCELADO",
  );

  const comunicadosRespondidos = aluno.destinatariosComunicados.filter(
    (item) => item.status === "RESPONDIDO",
  );

  const timeline = [
    ...aluno.matriculas.map((matricula) => ({
      id: `matricula-${matricula.id}`,
      data: matricula.criadoEm,
      titulo: "Matrícula registrada",
      descricao: `${getStatusLabel(matricula.status)} · Ano letivo ${
        matricula.anoLetivo
      }`,
      tipo: "Matrícula",
    })),
    ...aluno.tarefas.map((tarefa) => ({
      id: `tarefa-${tarefa.id}`,
      data: tarefa.criadoEm,
      titulo: tarefa.titulo,
      descricao: `${tarefa.setor} · ${getStatusLabel(
        tarefa.status,
      )} · ${getPrioridadeLabel(tarefa.prioridade)}`,
      tipo: "Pulse",
    })),
    ...aluno.ocorrencias.map((ocorrencia) => ({
      id: `ocorrencia-${ocorrencia.id}`,
      data: ocorrencia.criadoEm,
      titulo: ocorrencia.titulo,
      descricao: `${getTipoOcorrenciaLabel(ocorrencia.tipo)} · ${getStatusLabel(
        ocorrencia.status,
      )}`,
      tipo: "Ocorrência",
    })),
    ...aluno.destinatariosComunicados.map((item) => ({
      id: `comunicado-${item.id}`,
      data: item.criadoEm,
      titulo: item.comunicado.titulo,
      descricao: `Comunicação · ${getStatusLabel(item.status)}`,
      tipo: "Comunicação",
    })),
  ]
    .sort((a, b) => b.data.getTime() - a.data.getTime())
    .slice(0, 12);

  const sugestoes: string[] = [];

  if (tarefasPrioritarias.length > 0) {
    sugestoes.push(
      `Resolver ${tarefasPrioritarias.length} tarefa(s) de prioridade alta ou crítica ligada(s) a este aluno.`,
    );
  }

  if (comunicadosPendentes.length > 0) {
    sugestoes.push(
      `Acompanhar ${comunicadosPendentes.length} comunicado(s) sem resposta da família.`,
    );
  }

  if (ocorrenciasDisciplinares.length > 0) {
    sugestoes.push(
      `Observar histórico disciplinar: ${ocorrenciasDisciplinares.length} advertência(s) ou suspensão(ões) registradas.`,
    );
  }

  if (!matriculaAtual) {
    sugestoes.push("Verificar se este aluno possui matrícula cadastrada.");
  }

  if (sugestoes.length === 0) {
    sugestoes.push(
      "Nenhuma pendência importante encontrada para este aluno no momento.",
    );
  }

  return (
    <AppLayout>
      <div className="mb-8 flex flex-wrap items-start justify-between gap-6">
        <div>
          <Link
            href={`/alunos/${aluno.id}`}
            className="mb-4 inline-flex items-center gap-2 text-sm font-semibold text-primary"
          >
            <ArrowLeft size={16} />
            Voltar para o prontuário
          </Link>

          <p className="text-sm font-medium text-muted-foreground">
            Lumi do Aluno
          </p>

          <h1 className="mt-2 text-3xl font-semibold tracking-tight text-foreground">
            {aluno.nome}
          </h1>

          <p className="mt-2 max-w-3xl text-sm leading-6 text-muted-foreground">
            Uma leitura inteligente do histórico, pendências, comunicação e
            acompanhamento escolar deste aluno.
          </p>
        </div>

        <div className="rounded-3xl border border-border bg-card px-5 py-4 shadow-sm">
          <p className="text-xs font-medium uppercase tracking-[0.16em] text-muted-foreground">
            Situação
          </p>
          <p className="mt-1 text-xl font-semibold text-foreground">
            {matriculaAtual
              ? getStatusLabel(matriculaAtual.status)
              : "Sem matrícula"}
          </p>
        </div>
      </div>

      <section className="mb-8 rounded-[2rem] border border-border bg-card p-6 shadow-sm">
        <div className="grid gap-6 xl:grid-cols-[1fr_360px]">
          <div>
            <div className="mb-5 flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-3xl bg-primary text-primary-foreground">
                <Sparkles size={24} />
              </div>

              <div>
                <h2 className="text-xl font-semibold text-foreground">
                  Resumo Lumi
                </h2>
                <p className="text-sm text-muted-foreground">
                  Leitura automática do prontuário do aluno.
                </p>
              </div>
            </div>

            <div className="rounded-3xl bg-primary/10 p-5">
              <p className="text-sm leading-7 text-foreground">
                O aluno <strong>{aluno.nome}</strong>{" "}
                {aluno.turma ? (
                  <>
                    está vinculado à turma <strong>{aluno.turma.nome}</strong>
                  </>
                ) : (
                  <>ainda não possui turma vinculada</>
                )}
                . Foram encontradas <strong>{tarefasAbertas.length}</strong>{" "}
                tarefa(s) aberta(s),{" "}
                <strong>{comunicadosPendentes.length}</strong> comunicado(s)
                pendente(s),{" "}
                <strong>{comunicadosRespondidos.length}</strong> comunicado(s)
                respondido(s) e{" "}
                <strong>{ocorrenciasDisciplinares.length}</strong>{" "}
                advertência(s) ou suspensão(ões) no histórico recente.
              </p>

              <p className="mt-3 text-sm leading-7 text-muted-foreground">
                Responsável principal:{" "}
                <strong>{aluno.responsavel?.nome || "Não informado"}</strong>.
              </p>
            </div>
          </div>

          <div className="rounded-3xl border border-border bg-background p-5">
            <h3 className="font-semibold text-foreground">
              Sugestões da Lumi
            </h3>

            <div className="mt-4 space-y-3">
              {sugestoes.map((item) => (
                <div key={item} className="flex items-start gap-3">
                  <CheckCircle2
                    size={18}
                    className="mt-0.5 shrink-0 text-primary"
                  />
                  <p className="text-sm leading-6 text-muted-foreground">
                    {item}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <div className="mb-8 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <div className="rounded-3xl border border-border bg-card p-5 shadow-sm">
          <UserRound size={22} className="text-primary" />
          <p className="mt-4 text-sm text-muted-foreground">Responsável</p>
          <p className="mt-1 truncate text-lg font-semibold text-foreground">
            {aluno.responsavel?.nome || "Não informado"}
          </p>
          <p className="mt-2 text-xs text-muted-foreground">
            {aluno.responsavel?.telefone || "Telefone não informado"}
          </p>
        </div>

        <div className="rounded-3xl border border-border bg-card p-5 shadow-sm">
          <GraduationCap size={22} className="text-primary" />
          <p className="mt-4 text-sm text-muted-foreground">Turma</p>
          <p className="mt-1 text-lg font-semibold text-foreground">
            {aluno.turma?.nome || "Sem turma"}
          </p>
          <p className="mt-2 text-xs text-muted-foreground">
            {aluno.turma?.segmento || "Segmento não informado"}
          </p>
        </div>

        <div className="rounded-3xl border border-border bg-card p-5 shadow-sm">
          <ClipboardList size={22} className="text-primary" />
          <p className="mt-4 text-sm text-muted-foreground">Pulse</p>
          <p className="mt-1 text-3xl font-semibold text-foreground">
            {tarefasAbertas.length}
          </p>
          <p className="mt-2 text-xs text-muted-foreground">
            Tarefa(s) aberta(s)
          </p>
        </div>

        <div className="rounded-3xl border border-border bg-card p-5 shadow-sm">
          <MessageCircle size={22} className="text-primary" />
          <p className="mt-4 text-sm text-muted-foreground">Comunicação</p>
          <p className="mt-1 text-3xl font-semibold text-foreground">
            {comunicadosPendentes.length}
          </p>
          <p className="mt-2 text-xs text-muted-foreground">
            Pendente(s) de resposta
          </p>
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        <section className="rounded-3xl border border-border bg-card p-6 shadow-sm">
          <div className="mb-5 flex items-center justify-between gap-4">
            <div>
              <h2 className="font-semibold text-foreground">
                Linha do tempo do aluno
              </h2>
              <p className="text-sm text-muted-foreground">
                Últimos acontecimentos registrados.
              </p>
            </div>

            <CalendarDays size={20} className="text-primary" />
          </div>

          {timeline.length === 0 ? (
            <p className="rounded-2xl border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
              Nenhum evento encontrado.
            </p>
          ) : (
            <div className="space-y-3">
              {timeline.map((item) => (
                <div
                  key={item.id}
                  className="rounded-2xl border border-border bg-background p-4"
                >
                  <div className="mb-2 flex flex-wrap items-center gap-2">
                    <span className="rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
                      {item.tipo}
                    </span>

                    <span className="rounded-full bg-muted px-3 py-1 text-xs font-semibold text-muted-foreground">
                      {formatDateTime(item.data)}
                    </span>
                  </div>

                  <p className="font-medium text-foreground">{item.titulo}</p>

                  <p className="mt-1 text-sm text-muted-foreground">
                    {item.descricao}
                  </p>
                </div>
              ))}
            </div>
          )}
        </section>

        <section className="rounded-3xl border border-border bg-card p-6 shadow-sm">
          <div className="mb-5 flex items-center justify-between gap-4">
            <div>
              <h2 className="font-semibold text-foreground">
                Tarefas abertas
              </h2>
              <p className="text-sm text-muted-foreground">
                Pendências do Pulse ligadas ao aluno.
              </p>
            </div>

            <Link
              href="/pulse"
              className="inline-flex items-center gap-2 text-sm font-semibold text-primary"
            >
              Ver Pulse
              <ArrowRight size={16} />
            </Link>
          </div>

          {tarefasAbertas.length === 0 ? (
            <p className="rounded-2xl border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
              Nenhuma tarefa aberta para este aluno.
            </p>
          ) : (
            <div className="space-y-3">
              {tarefasAbertas.map((tarefa) => (
                <div key={tarefa.id} className="rounded-2xl bg-muted p-4">
                  <div className="mb-2 flex flex-wrap items-center gap-2">
                    <span className="rounded-full bg-background px-3 py-1 text-xs font-semibold text-foreground">
                      {tarefa.setor}
                    </span>

                    <span className="rounded-full bg-background px-3 py-1 text-xs font-semibold text-muted-foreground">
                      {getPrioridadeLabel(tarefa.prioridade)}
                    </span>
                  </div>

                  <p className="font-medium text-foreground">
                    {tarefa.titulo}
                  </p>

                  <p className="mt-1 text-sm text-muted-foreground">
                    {getStatusLabel(tarefa.status)}
                  </p>
                </div>
              ))}
            </div>
          )}
        </section>

        <section className="rounded-3xl border border-border bg-card p-6 shadow-sm">
          <div className="mb-5 flex items-center justify-between gap-4">
            <div>
              <h2 className="font-semibold text-foreground">
                Ocorrências recentes
              </h2>
              <p className="text-sm text-muted-foreground">
                Advertências, suspensões, relatórios e atendimentos.
              </p>
            </div>

            <AlertTriangle size={20} className="text-primary" />
          </div>

          {aluno.ocorrencias.length === 0 ? (
            <p className="rounded-2xl border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
              Nenhuma ocorrência registrada.
            </p>
          ) : (
            <div className="space-y-3">
              {aluno.ocorrencias.map((ocorrencia) => (
                <div key={ocorrencia.id} className="rounded-2xl bg-muted p-4">
                  <div className="mb-2 flex flex-wrap items-center gap-2">
                    <span className="rounded-full bg-background px-3 py-1 text-xs font-semibold text-foreground">
                      {getTipoOcorrenciaLabel(ocorrencia.tipo)}
                    </span>

                    <span className="rounded-full bg-background px-3 py-1 text-xs font-semibold text-muted-foreground">
                      {formatDateTime(ocorrencia.criadoEm)}
                    </span>
                  </div>

                  <p className="font-medium text-foreground">
                    {ocorrencia.titulo}
                  </p>

                  <p className="mt-1 text-sm text-muted-foreground">
                    {getStatusLabel(ocorrencia.status)}
                  </p>
                </div>
              ))}
            </div>
          )}
        </section>

        <section className="rounded-3xl border border-border bg-card p-6 shadow-sm">
          <div className="mb-5 flex items-center justify-between gap-4">
            <div>
              <h2 className="font-semibold text-foreground">
                Comunicação com a família
              </h2>
              <p className="text-sm text-muted-foreground">
                Comunicados enviados e respostas recebidas.
              </p>
            </div>

            <FileText size={20} className="text-primary" />
          </div>

          {aluno.destinatariosComunicados.length === 0 ? (
            <p className="rounded-2xl border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
              Nenhum comunicado registrado para este aluno.
            </p>
          ) : (
            <div className="space-y-3">
              {aluno.destinatariosComunicados.map((item) => {
                const ultimaResposta = item.respostas[0] ?? null;

                return (
                  <div key={item.id} className="rounded-2xl bg-muted p-4">
                    <div className="mb-2 flex flex-wrap items-center gap-2">
                      <span className="rounded-full bg-background px-3 py-1 text-xs font-semibold text-foreground">
                        {getStatusLabel(item.status)}
                      </span>

                      <span className="rounded-full bg-background px-3 py-1 text-xs font-semibold text-muted-foreground">
                        {formatDateTime(item.criadoEm)}
                      </span>
                    </div>

                    <p className="font-medium text-foreground">
                      {item.comunicado.titulo}
                    </p>

                    {ultimaResposta ? (
                      <p className="mt-1 text-sm text-muted-foreground">
                        Resposta: {ultimaResposta.nomeRespondente}
                      </p>
                    ) : (
                      <p className="mt-1 text-sm text-muted-foreground">
                        Ainda sem resposta da família.
                      </p>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </section>
      </div>
    </AppLayout>
  );
}