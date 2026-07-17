import AppLayout from "@/components/layout/AppLayout";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import {
  ArrowRight,
  CalendarDays,
  CheckCircle2,
  CreditCard,
  GraduationCap,
  MessageCircle,
  Sparkles,
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

export default async function DashboardPage() {
  const dataLimite = new Date();
  dataLimite.setDate(dataLimite.getDate() - 90);

  const [
    totalAlunos,
    totalTurmas,
    tarefasAbertas,
    tarefasPrioritarias,
    matriculasPendentes,
    comunicadosPendentes,
    pendenciasFinanceiras,
    pendenciasDocumentais,
    ocorrenciasRecentes,
    ultimasTarefas,
    ultimosComunicados,
    ultimasOcorrencias,
  ] = await Promise.all([
    prisma.aluno.count(),

    prisma.turma.count(),

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

  const escolaSobControle = totalPendencias === 0;

  return (
    <AppLayout>
      <div className="mb-8 grid gap-6 xl:grid-cols-[1fr_380px]">
        <section className="rounded-[2rem] border border-border bg-card p-7 shadow-sm">
          <div className="mb-6 flex items-start justify-between gap-6">
            <div>
              <p className="text-sm font-medium text-muted-foreground">
                Hoje na Lumina
              </p>

              <h1 className="mt-2 text-3xl font-semibold tracking-tight text-foreground">
                Bom dia, Bruno.
              </h1>

              <p className="mt-3 max-w-3xl text-sm leading-6 text-muted-foreground">
                A Lumina organizou os principais pontos da escola para você
                começar o dia sabendo exatamente o que precisa de atenção.
              </p>
            </div>

            <div className="hidden h-14 w-14 items-center justify-center rounded-3xl bg-primary text-primary-foreground md:flex">
              <Sparkles size={26} />
            </div>
          </div>

          <div className="rounded-3xl bg-primary/10 p-5">
            <p className="mb-2 inline-flex rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
              Resolver meu dia
            </p>

            <h2 className="text-xl font-semibold text-foreground">
              {escolaSobControle
                ? "A escola está sem pendências críticas no momento."
                : `Existem ${totalPendencias} ponto(s) que merecem atenção hoje.`}
            </h2>

            <p className="mt-3 text-sm leading-7 text-muted-foreground">
              Foram encontrados <strong>{tarefasAbertas}</strong> tarefa(s)
              aberta(s), <strong>{matriculasPendentes}</strong> matrícula(s)
              pendente(s), <strong>{comunicadosPendentes}</strong>{" "}
              comunicado(s) aguardando resposta e{" "}
              <strong>{pendenciasFinanceiras}</strong> pendência(s)
              financeira(s).
            </p>

            <div className="mt-5 flex flex-wrap gap-3">
              <Link
                href="/lumi"
                className="inline-flex items-center gap-2 rounded-2xl bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground transition hover:opacity-90"
              >
                Abrir Central da Lumi
                <ArrowRight size={18} />
              </Link>

              <Link
                href="/pulse"
                className="inline-flex items-center gap-2 rounded-2xl border border-border bg-background px-5 py-3 text-sm font-semibold text-foreground transition hover:bg-muted"
              >
                Ver Pulse
                <ArrowRight size={18} />
              </Link>
            </div>
          </div>
        </section>

        <section className="rounded-[2rem] border border-border bg-card p-6 shadow-sm">
          <div className="mb-5 flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-primary text-primary-foreground">
              <CheckCircle2 size={22} />
            </div>

            <div>
              <h2 className="font-semibold text-foreground">
                Leitura rápida
              </h2>
              <p className="text-sm text-muted-foreground">
                Prioridades da escola
              </p>
            </div>
          </div>

          <div className="space-y-3 text-sm leading-6 text-muted-foreground">
            <p>
              • <strong className="text-foreground">{tarefasPrioritarias}</strong>{" "}
              tarefa(s) de alta prioridade.
            </p>

            <p>
              • <strong className="text-foreground">{comunicadosPendentes}</strong>{" "}
              responsável(is) ainda precisam responder comunicados.
            </p>

            <p>
              • <strong className="text-foreground">{ocorrenciasRecentes}</strong>{" "}
              advertência(s) ou suspensão(ões) nos últimos 90 dias.
            </p>

            <p>
              • <strong className="text-foreground">{totalAlunos}</strong>{" "}
              aluno(s) e <strong className="text-foreground">{totalTurmas}</strong>{" "}
              turma(s) cadastrados.
            </p>
          </div>
        </section>
      </div>

      <div className="mb-8 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <Link
          href="/alunos"
          className="rounded-3xl border border-border bg-card p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
        >
          <GraduationCap size={22} className="text-primary" />
          <p className="mt-4 text-sm text-muted-foreground">Alunos</p>
          <p className="mt-1 text-3xl font-semibold text-foreground">
            {totalAlunos}
          </p>
          <p className="mt-2 text-xs text-muted-foreground">
            Prontuários ativos na Lumina
          </p>
        </Link>

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
            Aguardando resposta
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
            Pendências abertas
          </p>
        </Link>
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        <section className="rounded-3xl border border-border bg-card p-6 shadow-sm">
          <div className="mb-5 flex items-center justify-between gap-4">
            <div>
              <h2 className="font-semibold text-foreground">
                Próximas ações
              </h2>
              <p className="text-sm text-muted-foreground">
                Tarefas abertas mais recentes no Pulse.
              </p>
            </div>

            <Link
              href="/pulse"
              className="inline-flex items-center gap-2 text-sm font-semibold text-primary"
            >
              Ver tudo
              <ArrowRight size={16} />
            </Link>
          </div>

          {ultimasTarefas.length === 0 ? (
            <p className="rounded-2xl border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
              Nenhuma tarefa aberta no momento.
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
                Famílias aguardando resposta
              </h2>
              <p className="text-sm text-muted-foreground">
                Comunicados pendentes mais recentes.
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

          {ultimosComunicados.length === 0 ? (
            <p className="rounded-2xl border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
              Nenhum comunicado pendente.
            </p>
          ) : (
            <div className="space-y-3">
              {ultimosComunicados.map((item) => (
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

        <section className="rounded-3xl border border-border bg-card p-6 shadow-sm xl:col-span-2">
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
            <div className="grid gap-3 md:grid-cols-2">
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
