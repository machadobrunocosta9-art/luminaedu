import AppLayout from "@/components/layout/AppLayout";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import {
  AlertTriangle,
  ArrowRight,
  CalendarDays,
  CheckCircle2,
  ClipboardList,
  CreditCard,
  GraduationCap,
  MessageCircle,
  Sparkles,
  UsersRound,
} from "lucide-react";

export const dynamic = "force-dynamic";

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
  };

  return labels[status] ?? status;
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

export default async function LumiPage() {
  const dataLimite = new Date();
  dataLimite.setDate(dataLimite.getDate() - 90);

  const [
    totalAlunos,
    tarefasAbertas,
    tarefasPrioritarias,
    matriculasPendentes,
    comunicadosPendentes,
    comunicadosVisualizados,
    pendenciasFinanceiras,
    pendenciasDocumentais,
    ocorrenciasRecentes,
    ultimasTarefas,
    ultimasMatriculas,
    ultimosComunicadosPendentes,
    ultimasOcorrencias,
  ] = await Promise.all([
    prisma.aluno.count(),

    prisma.tarefa.count({
      where: {
        status: {
          not: "CONCLUIDA",
        },
      },
    }),

    prisma.tarefa.count({
      where: {
        status: {
          not: "CONCLUIDA",
        },
        prioridade: {
          in: ["ALTA", "CRITICA"],
        },
      },
    }),

    prisma.matricula.count({
      where: {
        status: {
          in: [
            "PENDENTE",
            "EM_ANALISE",
            "AGUARDANDO_DOCUMENTOS",
            "AGUARDANDO_PAGAMENTO",
          ],
        },
      },
    }),

    prisma.destinatarioComunicado.count({
      where: {
        status: {
          in: ["PENDENTE", "ENVIADO", "VISUALIZADO"],
        },
      },
    }),

    prisma.destinatarioComunicado.count({
      where: {
        status: "VISUALIZADO",
      },
    }),

    prisma.tarefa.count({
      where: {
        setor: "Financeiro",
        status: {
          not: "CONCLUIDA",
        },
      },
    }),

    prisma.tarefa.count({
      where: {
        setor: "Documentos",
        status: {
          not: "CONCLUIDA",
        },
      },
    }),

    prisma.ocorrenciaAluno.count({
      where: {
        criadoEm: {
          gte: dataLimite,
        },
        tipo: {
          in: ["ADVERTENCIA", "SUSPENSAO"],
        },
      },
    }),

    prisma.tarefa.findMany({
      where: {
        status: {
          not: "CONCLUIDA",
        },
      },
      orderBy: [
        {
          prioridade: "desc",
        },
        {
          criadoEm: "desc",
        },
      ],
      take: 6,
      include: {
        aluno: true,
      },
    }),

    prisma.matricula.findMany({
      where: {
        status: {
          in: [
            "PENDENTE",
            "EM_ANALISE",
            "AGUARDANDO_DOCUMENTOS",
            "AGUARDANDO_PAGAMENTO",
          ],
        },
      },
      orderBy: {
        criadoEm: "desc",
      },
      take: 5,
      include: {
        aluno: true,
      },
    }),

    prisma.destinatarioComunicado.findMany({
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
        aluno: true,
        comunicado: true,
      },
    }),

    prisma.ocorrenciaAluno.findMany({
      where: {
        criadoEm: {
          gte: dataLimite,
        },
        tipo: {
          in: ["ADVERTENCIA", "SUSPENSAO"],
        },
      },
      orderBy: {
        criadoEm: "desc",
      },
      take: 5,
      include: {
        aluno: true,
      },
    }),
  ]);

  const totalPendencias =
    tarefasAbertas +
    matriculasPendentes +
    comunicadosPendentes +
    pendenciasFinanceiras +
    pendenciasDocumentais;

  const recomendacoes: string[] = [];

  if (tarefasPrioritarias > 0) {
    recomendacoes.push(
      `Resolver ${tarefasPrioritarias} tarefa(s) de prioridade alta ou crítica no Pulse.`,
    );
  }

  if (comunicadosPendentes > 0) {
    recomendacoes.push(
      `Acompanhar ${comunicadosPendentes} comunicado(s) ainda sem resposta da família.`,
    );
  }

  if (matriculasPendentes > 0) {
    recomendacoes.push(
      `Revisar ${matriculasPendentes} matrícula(s) parada(s) ou aguardando ação.`,
    );
  }

  if (pendenciasFinanceiras > 0) {
    recomendacoes.push(
      `Verificar ${pendenciasFinanceiras} pendência(s) financeira(s) aberta(s).`,
    );
  }

  if (ocorrenciasRecentes > 0) {
    recomendacoes.push(
      `Analisar ${ocorrenciasRecentes} advertência(s) ou suspensão(ões) registradas nos últimos 90 dias.`,
    );
  }

  if (recomendacoes.length === 0) {
    recomendacoes.push(
      "Nenhuma pendência crítica encontrada. Mantenha o acompanhamento regular da escola.",
    );
  }

  return (
    <AppLayout>
      <div className="mb-8 flex flex-wrap items-start justify-between gap-6">
        <div>
          <p className="text-sm font-medium text-muted-foreground">
            Lumi IA
          </p>

          <h1 className="mt-2 text-3xl font-semibold tracking-tight text-foreground">
            Central da Lumi
          </h1>

          <p className="mt-2 max-w-3xl text-sm leading-6 text-muted-foreground">
            Uma visão inteligente da escola para ajudar a direção a priorizar o
            que precisa ser resolvido hoje.
          </p>
        </div>

        <div className="rounded-3xl border border-border bg-card px-5 py-4 shadow-sm">
          <p className="text-xs font-medium uppercase tracking-[0.16em] text-muted-foreground">
            Pendências totais
          </p>
          <p className="mt-1 text-3xl font-semibold text-foreground">
            {totalPendencias}
          </p>
        </div>
      </div>

      <section className="mb-8 rounded-3xl border border-border bg-card p-6 shadow-sm">
        <div className="grid gap-6 xl:grid-cols-[1fr_360px]">
          <div>
            <div className="mb-5 flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-3xl bg-primary text-primary-foreground">
                <Sparkles size={24} />
              </div>

              <div>
                <h2 className="text-xl font-semibold text-foreground">
                  Resolver meu dia
                </h2>
                <p className="text-sm text-muted-foreground">
                  Leitura automática com base nos dados atuais da escola.
                </p>
              </div>
            </div>

            <div className="rounded-3xl bg-primary/10 p-5">
              <p className="text-sm leading-7 text-foreground">
                Hoje a Lumina identificou{" "}
                <strong>{tarefasAbertas}</strong> tarefa(s) aberta(s),{" "}
                <strong>{matriculasPendentes}</strong> matrícula(s) pendente(s),{" "}
                <strong>{comunicadosPendentes}</strong> comunicado(s) aguardando
                resposta e <strong>{pendenciasFinanceiras}</strong> pendência(s)
                financeira(s).
              </p>

              <p className="mt-3 text-sm leading-7 text-muted-foreground">
                A escola possui <strong>{totalAlunos}</strong> aluno(s)
                cadastrado(s). Nos últimos 90 dias, foram registradas{" "}
                <strong>{ocorrenciasRecentes}</strong> advertência(s) ou
                suspensão(ões).
              </p>
            </div>
          </div>

          <div className="rounded-3xl border border-border bg-background p-5">
            <h3 className="font-semibold text-foreground">
              Sugestões da Lumi
            </h3>

            <div className="mt-4 space-y-3">
              {recomendacoes.map((item) => (
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
        <Link
          href="/pulse"
          className="rounded-3xl border border-border bg-card p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
        >
          <CalendarDays size={22} className="text-primary" />
          <p className="mt-4 text-sm text-muted-foreground">Pulse aberto</p>
          <p className="mt-1 text-3xl font-semibold text-foreground">
            {tarefasAbertas}
          </p>
          <p className="mt-2 text-xs text-muted-foreground">
            {tarefasPrioritarias} de alta prioridade
          </p>
        </Link>

        <Link
          href="/comunicacao"
          className="rounded-3xl border border-border bg-card p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
        >
          <MessageCircle size={22} className="text-primary" />
          <p className="mt-4 text-sm text-muted-foreground">Comunicação</p>
          <p className="mt-1 text-3xl font-semibold text-foreground">
            {comunicadosPendentes}
          </p>
          <p className="mt-2 text-xs text-muted-foreground">
            {comunicadosVisualizados} visualizado(s) sem resposta
          </p>
        </Link>

        <Link
          href="/matriculas"
          className="rounded-3xl border border-border bg-card p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
        >
          <ClipboardList size={22} className="text-primary" />
          <p className="mt-4 text-sm text-muted-foreground">Matrículas</p>
          <p className="mt-1 text-3xl font-semibold text-foreground">
            {matriculasPendentes}
          </p>
          <p className="mt-2 text-xs text-muted-foreground">
            Precisam de acompanhamento
          </p>
        </Link>

        <Link
          href="/financeiro"
          className="rounded-3xl border border-border bg-card p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
        >
          <CreditCard size={22} className="text-primary" />
          <p className="mt-4 text-sm text-muted-foreground">Financeiro</p>
          <p className="mt-1 text-3xl font-semibold text-foreground">
            {pendenciasFinanceiras}
          </p>
          <p className="mt-2 text-xs text-muted-foreground">
            Pendências financeiras abertas
          </p>
        </Link>
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        <section className="rounded-3xl border border-border bg-card p-6 shadow-sm">
          <div className="mb-5 flex items-center justify-between gap-4">
            <div>
              <h2 className="font-semibold text-foreground">
                Tarefas que merecem atenção
              </h2>
              <p className="text-sm text-muted-foreground">
                Últimas tarefas abertas no Pulse.
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

          {ultimasTarefas.length === 0 ? (
            <p className="rounded-2xl border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
              Nenhuma tarefa aberta.
            </p>
          ) : (
            <div className="space-y-3">
              {ultimasTarefas.map((tarefa) => (
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
                    {tarefa.aluno ? ` · ${tarefa.aluno.nome}` : ""}
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
                Comunicados aguardando família
              </h2>
              <p className="text-sm text-muted-foreground">
                Responsáveis que ainda precisam responder.
              </p>
            </div>

            <Link
              href="/comunicacao"
              className="inline-flex items-center gap-2 text-sm font-semibold text-primary"
            >
              Ver comunicação
              <ArrowRight size={16} />
            </Link>
          </div>

          {ultimosComunicadosPendentes.length === 0 ? (
            <p className="rounded-2xl border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
              Nenhum comunicado pendente.
            </p>
          ) : (
            <div className="space-y-3">
              {ultimosComunicadosPendentes.map((item) => (
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

                  <p className="mt-1 text-sm text-muted-foreground">
                    {item.aluno?.nome || "Aluno não informado"}
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
                Matrículas pendentes
              </h2>
              <p className="text-sm text-muted-foreground">
                Processos que precisam de acompanhamento.
              </p>
            </div>

            <Link
              href="/matriculas"
              className="inline-flex items-center gap-2 text-sm font-semibold text-primary"
            >
              Ver matrículas
              <ArrowRight size={16} />
            </Link>
          </div>

          {ultimasMatriculas.length === 0 ? (
            <p className="rounded-2xl border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
              Nenhuma matrícula pendente.
            </p>
          ) : (
            <div className="space-y-3">
              {ultimasMatriculas.map((matricula) => (
                <div key={matricula.id} className="rounded-2xl bg-muted p-4">
                  <p className="font-medium text-foreground">
                    {matricula.aluno.nome}
                  </p>

                  <p className="mt-1 text-sm text-muted-foreground">
                    {getStatusLabel(matricula.status)} · Ano letivo{" "}
                    {matricula.anoLetivo}
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
                Alunos que merecem atenção
              </h2>
              <p className="text-sm text-muted-foreground">
                Advertências e suspensões recentes.
              </p>
            </div>

            <Link
              href="/alunos"
              className="inline-flex items-center gap-2 text-sm font-semibold text-primary"
            >
              Ver alunos
              <ArrowRight size={16} />
            </Link>
          </div>

          {ultimasOcorrencias.length === 0 ? (
            <p className="rounded-2xl border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
              Nenhuma advertência ou suspensão recente.
            </p>
          ) : (
            <div className="space-y-3">
              {ultimasOcorrencias.map((ocorrencia) => (
                <Link
                  href={`/alunos/${ocorrencia.alunoId}`}
                  key={ocorrencia.id}
                  className="block rounded-2xl bg-muted p-4 transition hover:bg-background"
                >
                  <div className="mb-2 flex flex-wrap items-center gap-2">
                    <span className="rounded-full bg-background px-3 py-1 text-xs font-semibold text-foreground">
                      {ocorrencia.tipo}
                    </span>

                    <span className="rounded-full bg-background px-3 py-1 text-xs font-semibold text-muted-foreground">
                      {formatDateTime(ocorrencia.criadoEm)}
                    </span>
                  </div>

                  <p className="font-medium text-foreground">
                    {ocorrencia.aluno.nome}
                  </p>

                  <p className="mt-1 text-sm text-muted-foreground">
                    {ocorrencia.titulo}
                  </p>
                </Link>
              ))}
            </div>
          )}
        </section>
      </div>
    </AppLayout>
  );
}