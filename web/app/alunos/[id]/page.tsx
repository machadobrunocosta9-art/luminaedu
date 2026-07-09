import AppLayout from "@/components/layout/AppLayout";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  AlertTriangle,
  ArrowRight,
  CalendarDays,
  CheckCircle2,
  ClipboardList,
  CreditCard,
  FileText,
  GraduationCap,
  MessageCircle,
  Plus,
  Sparkles,
  UserRound,
} from "lucide-react";

export const dynamic = "force-dynamic";

type PageProps = {
  params: Promise<{
    id: string;
  }>;
};

function formatDate(date?: Date | null) {
  if (!date) return "Não informado";

  return new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "short",
  }).format(date);
}

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

export default async function AlunoPage({ params }: PageProps) {
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
      },
      ocorrencias: {
        orderBy: {
          criadoEm: "desc",
        },
      },
      destinatariosComunicados: {
        orderBy: {
          criadoEm: "desc",
        },
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

  const tarefasFinanceiras = aluno.tarefas.filter(
    (tarefa) => tarefa.setor === "Financeiro" && tarefa.status !== "CONCLUIDA",
  );

  const tarefasDocumentais = aluno.tarefas.filter(
    (tarefa) => tarefa.setor === "Documentos" && tarefa.status !== "CONCLUIDA",
  );

  const comunicadosPendentes = aluno.destinatariosComunicados.filter(
    (item) => item.status !== "RESPONDIDO" && item.status !== "CANCELADO",
  );

  const comunicadosRespondidos = aluno.destinatariosComunicados.filter(
    (item) => item.status === "RESPONDIDO",
  );

  const ultimaMovimentacao = [
    ...aluno.matriculas.map((matricula) => ({
      data: matricula.criadoEm,
      titulo: "Matrícula registrada",
    })),
    ...aluno.tarefas.map((tarefa) => ({
      data: tarefa.criadoEm,
      titulo: tarefa.titulo,
    })),
    ...aluno.ocorrencias.map((ocorrencia) => ({
      data: ocorrencia.criadoEm,
      titulo: ocorrencia.titulo,
    })),
    ...aluno.destinatariosComunicados.map((item) => ({
      data: item.criadoEm,
      titulo: item.comunicado.titulo,
    })),
  ].sort((a, b) => b.data.getTime() - a.data.getTime())[0];

  const pontosAtencao: string[] = [];
  const sugestoesLumi: string[] = [];

  if (tarefasAbertas.length > 0) {
    pontosAtencao.push(
      `${tarefasAbertas.length} tarefa(s) Pulse aberta(s) vinculada(s) ao aluno.`,
    );

    sugestoesLumi.push(
      "Verificar as tarefas abertas no Pulse e definir próximos responsáveis.",
    );
  }

  if (comunicadosPendentes.length > 0) {
    pontosAtencao.push(
      `${comunicadosPendentes.length} comunicado(s) aguardando resposta da família.`,
    );

    sugestoesLumi.push(
      "Acompanhar os comunicados pendentes e reforçar o contato com o responsável.",
    );
  }

  if (aluno.ocorrencias.length > 0) {
    pontosAtencao.push(
      `${aluno.ocorrencias.length} ocorrência(s) registrada(s) no prontuário.`,
    );

    sugestoesLumi.push(
      "Observar o histórico de ocorrências antes de novas decisões pedagógicas.",
    );
  }

  if (!matriculaAtual) {
    pontosAtencao.push("Aluno sem matrícula registrada.");

    sugestoesLumi.push("Cadastrar ou revisar a matrícula do aluno.");
  }

  if (pontosAtencao.length === 0) {
    pontosAtencao.push("Nenhum ponto crítico encontrado no momento.");
  }

  if (sugestoesLumi.length === 0) {
    sugestoesLumi.push(
      "Manter acompanhamento regular do aluno e atualizar o prontuário sempre que necessário.",
    );
  }

  const timeline = [
    ...aluno.matriculas.map((matricula) => ({
      id: `matricula-${matricula.id}`,
      data: matricula.criadoEm,
      tipo: "Matrícula",
      titulo: "Matrícula registrada",
      descricao: `${getStatusLabel(matricula.status)} · Ano letivo ${
        matricula.anoLetivo
      }`,
    })),
    ...aluno.ocorrencias.map((ocorrencia) => ({
      id: `ocorrencia-${ocorrencia.id}`,
      data: ocorrencia.criadoEm,
      tipo: getTipoOcorrenciaLabel(ocorrencia.tipo),
      titulo: ocorrencia.titulo,
      descricao: getStatusLabel(ocorrencia.status),
    })),
    ...aluno.tarefas.map((tarefa) => ({
      id: `tarefa-${tarefa.id}`,
      data: tarefa.criadoEm,
      tipo: "Pulse",
      titulo: tarefa.titulo,
      descricao: `${tarefa.setor} · ${getStatusLabel(
        tarefa.status,
      )} · ${getPrioridadeLabel(tarefa.prioridade)}`,
    })),
    ...aluno.destinatariosComunicados.map((item) => ({
      id: `comunicado-${item.id}`,
      data: item.criadoEm,
      tipo: "Comunicação",
      titulo: item.comunicado.titulo,
      descricao: getStatusLabel(item.status),
    })),
  ]
    .sort((a, b) => b.data.getTime() - a.data.getTime())
    .slice(0, 12);

  return (
    <AppLayout>
      <div className="mb-8 flex flex-wrap items-start justify-between gap-6">
        <div>
          <p className="text-sm font-medium text-muted-foreground">
            Prontuário do Aluno
          </p>

          <h1 className="mt-2 text-3xl font-semibold tracking-tight text-foreground">
            {aluno.nome}
          </h1>

          <p className="mt-2 max-w-3xl text-sm leading-6 text-muted-foreground">
            Histórico escolar, família, matrícula, comunicação, ocorrências e
            pendências em um só lugar.
          </p>
        </div>

        <div className="flex flex-wrap gap-3">
          <form action={`/alunos/${aluno.id}/lumi`} method="get">
            <button
              type="submit"
              className="group inline-flex items-center gap-2 rounded-2xl bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground shadow-sm shadow-primary/20 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg hover:shadow-primary/25 active:translate-y-0 active:scale-[0.98]"
            >
              <Sparkles
                size={17}
                className="transition-transform duration-200 group-hover:rotate-12 group-hover:scale-110"
              />
              Análise da Lumi
            </button>
          </form>

          <Link
            href={`/alunos/${aluno.id}/ocorrencias/novo`}
            className="group inline-flex items-center gap-2 rounded-2xl border border-border bg-card px-5 py-3 text-sm font-semibold text-foreground shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:bg-muted hover:shadow-md active:translate-y-0 active:scale-[0.98]"
          >
            <Plus
              size={17}
              className="transition-transform duration-200 group-hover:rotate-90"
            />
            Nova ocorrência
          </Link>
        </div>
      </div>

      <div className="mb-8 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <section className="rounded-3xl border border-border bg-card p-5 shadow-sm">
          <UserRound size={22} className="text-primary" />
          <p className="mt-4 text-sm text-muted-foreground">Responsável</p>
          <p className="mt-1 truncate text-lg font-semibold text-foreground">
            {aluno.responsavel?.nome || "Não informado"}
          </p>
          <p className="mt-2 text-xs text-muted-foreground">
            {aluno.responsavel?.telefone || "Telefone não informado"}
          </p>
        </section>

        <section className="rounded-3xl border border-border bg-card p-5 shadow-sm">
          <GraduationCap size={22} className="text-primary" />
          <p className="mt-4 text-sm text-muted-foreground">Turma</p>
          <p className="mt-1 text-lg font-semibold text-foreground">
            {aluno.turma?.nome || "Sem turma"}
          </p>
          <p className="mt-2 text-xs text-muted-foreground">
            {aluno.turma?.segmento || "Segmento não informado"}
          </p>
        </section>

        <section className="rounded-3xl border border-border bg-card p-5 shadow-sm">
          <ClipboardList size={22} className="text-primary" />
          <p className="mt-4 text-sm text-muted-foreground">Matrícula</p>
          <p className="mt-1 text-lg font-semibold text-foreground">
            {matriculaAtual
              ? getStatusLabel(matriculaAtual.status)
              : "Sem matrícula"}
          </p>
          <p className="mt-2 text-xs text-muted-foreground">
            {matriculaAtual
              ? `Ano letivo ${matriculaAtual.anoLetivo}`
              : "Nenhum histórico encontrado"}
          </p>
        </section>

        <section className="rounded-3xl border border-border bg-card p-5 shadow-sm">
          <MessageCircle size={22} className="text-primary" />
          <p className="mt-4 text-sm text-muted-foreground">Comunicação</p>
          <p className="mt-1 text-3xl font-semibold text-foreground">
            {comunicadosPendentes.length}
          </p>
          <p className="mt-2 text-xs text-muted-foreground">
            Pendência(s) da família
          </p>
        </section>
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
        <div className="space-y-6">
          <section className="rounded-[2rem] border border-border bg-card p-6 shadow-sm">
            <div className="mb-6 flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-3xl bg-primary text-primary-foreground">
                <Sparkles size={23} />
              </div>

              <div>
                <h2 className="text-lg font-semibold text-foreground">
                  Resumo Lumi do Aluno
                </h2>
                <p className="text-sm text-muted-foreground">
                  Leitura automática do prontuário com base nos registros atuais
                </p>
              </div>
            </div>

            <div className="rounded-3xl bg-muted p-5">
              <p className="text-sm leading-7 text-foreground">
                {aluno.nome} possui{" "}
                <strong>{aluno.ocorrencias.length}</strong> ocorrência(s)
                registrada(s),{" "}
                <strong>{aluno.destinatariosComunicados.length}</strong>{" "}
                comunicação(ões) vinculada(s),{" "}
                <strong>{comunicadosRespondidos.length}</strong> resposta(s) da
                família e <strong>{tarefasAbertas.length}</strong> tarefa(s)
                aberta(s) no Pulse.
              </p>

              <p className="mt-4 text-sm leading-7 text-muted-foreground">
                Última movimentação:{" "}
                <strong className="text-foreground">
                  {ultimaMovimentacao?.titulo || "Nenhuma movimentação"}
                </strong>{" "}
                {ultimaMovimentacao
                  ? `em ${formatDateTime(ultimaMovimentacao.data)}.`
                  : ""}
              </p>
            </div>

            <div className="mt-5 grid gap-4 md:grid-cols-2">
              <div className="rounded-3xl border border-border bg-background p-5">
                <h3 className="font-semibold text-foreground">
                  Pontos de atenção
                </h3>

                <div className="mt-4 space-y-3">
                  {pontosAtencao.map((item) => (
                    <div key={item} className="flex items-start gap-3">
                      <AlertTriangle
                        size={18}
                        className="mt-0.5 shrink-0 text-muted-foreground"
                      />
                      <p className="text-sm leading-6 text-muted-foreground">
                        {item}
                      </p>
                    </div>
                  ))}
                </div>
              </div>

              <div className="rounded-3xl border border-border bg-background p-5">
                <h3 className="font-semibold text-foreground">
                  Sugestões da Lumi
                </h3>

                <div className="mt-4 space-y-3">
                  {sugestoesLumi.map((item) => (
                    <div key={item} className="flex items-start gap-3">
                      <CheckCircle2
                        size={18}
                        className="mt-0.5 shrink-0 text-muted-foreground"
                      />
                      <p className="text-sm leading-6 text-muted-foreground">
                        {item}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="mt-6 flex flex-wrap gap-3">
              <form action={`/alunos/${aluno.id}/lumi`} method="get">
                <button
                  type="submit"
                  className="group inline-flex items-center justify-center gap-2 rounded-2xl bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground shadow-sm shadow-primary/20 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg hover:shadow-primary/25 active:translate-y-0 active:scale-[0.98]"
                >
                  Ver análise completa da Lumi
                  <ArrowRight
                    size={16}
                    className="transition-transform duration-200 group-hover:translate-x-1"
                  />
                </button>
              </form>

              <Link
                href={`/alunos/${aluno.id}/ocorrencias/novo`}
                className="group inline-flex items-center justify-center gap-2 rounded-2xl border border-border bg-background px-5 py-3 text-sm font-semibold text-foreground transition-all duration-200 hover:-translate-y-0.5 hover:bg-muted hover:shadow-md active:translate-y-0 active:scale-[0.98]"
              >
                Registrar nova ocorrência
                <Plus
                  size={16}
                  className="transition-transform duration-200 group-hover:rotate-90"
                />
              </Link>
            </div>
          </section>

          <section className="rounded-[2rem] border border-border bg-card p-6 shadow-sm">
            <div className="mb-6 flex items-center gap-3">
              <CalendarDays size={22} className="text-primary" />

              <div>
                <h2 className="text-lg font-semibold text-foreground">
                  Linha do Tempo do Aluno
                </h2>
                <p className="text-sm text-muted-foreground">
                  Matrículas, ocorrências, comunicados, respostas e tarefas em
                  ordem cronológica
                </p>
              </div>
            </div>

            {timeline.length === 0 ? (
              <p className="rounded-2xl border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
                Nenhum evento encontrado no histórico do aluno.
              </p>
            ) : (
              <div className="space-y-3">
                {timeline.map((item) => (
                  <div
                    key={item.id}
                    className="rounded-2xl border border-border bg-background p-4 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-sm"
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
        </div>

        <div className="space-y-6">
          <section className="rounded-[2rem] border border-border bg-card p-6 shadow-sm">
            <div className="mb-5 flex items-center gap-3">
              <GraduationCap size={22} className="text-primary" />

              <div>
                <h2 className="text-lg font-semibold text-foreground">
                  Matrículas
                </h2>
                <p className="text-sm text-muted-foreground">
                  Histórico escolar
                </p>
              </div>
            </div>

            {aluno.matriculas.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                Nenhuma matrícula registrada.
              </p>
            ) : (
              <div className="space-y-3">
                {aluno.matriculas.map((matricula) => (
                  <div
                    key={matricula.id}
                    className="rounded-3xl bg-muted p-5 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-sm"
                  >
                    <p className="font-semibold text-foreground">
                      Ano letivo {matricula.anoLetivo}
                    </p>
                    <p className="mt-1 text-sm text-muted-foreground">
                      {getStatusLabel(matricula.status)} ·{" "}
                      {formatDate(matricula.criadoEm)}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </section>

          <section className="rounded-[2rem] border border-border bg-card p-6 shadow-sm">
            <div className="mb-5 flex items-center gap-3">
              <CreditCard size={22} className="text-primary" />

              <div>
                <h2 className="text-lg font-semibold text-foreground">
                  Financeiro
                </h2>
                <p className="text-sm text-muted-foreground">
                  Pendências financeiras
                </p>
              </div>
            </div>

            {tarefasFinanceiras.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                Nenhuma pendência financeira registrada.
              </p>
            ) : (
              <div className="space-y-3">
                {tarefasFinanceiras.map((tarefa) => (
                  <div
                    key={tarefa.id}
                    className="rounded-3xl bg-muted p-5 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-sm"
                  >
                    <p className="font-semibold text-foreground">
                      {tarefa.titulo}
                    </p>
                    <p className="mt-1 text-sm text-muted-foreground">
                      {getStatusLabel(tarefa.status)} ·{" "}
                      {getPrioridadeLabel(tarefa.prioridade)}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </section>

          <section className="rounded-[2rem] border border-border bg-card p-6 shadow-sm">
            <div className="mb-5 flex items-center gap-3">
              <FileText size={22} className="text-primary" />

              <div>
                <h2 className="text-lg font-semibold text-foreground">
                  Documentos
                </h2>
                <p className="text-sm text-muted-foreground">
                  Pendências documentais
                </p>
              </div>
            </div>

            {tarefasDocumentais.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                Nenhuma pendência documental registrada.
              </p>
            ) : (
              <div className="space-y-3">
                {tarefasDocumentais.map((tarefa) => (
                  <div
                    key={tarefa.id}
                    className="rounded-3xl bg-muted p-5 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-sm"
                  >
                    <p className="font-semibold text-foreground">
                      {tarefa.titulo}
                    </p>
                    <p className="mt-1 text-sm text-muted-foreground">
                      {getStatusLabel(tarefa.status)} ·{" "}
                      {getPrioridadeLabel(tarefa.prioridade)}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </section>

          <section className="rounded-[2rem] border border-border bg-card p-6 shadow-sm">
            <div className="mb-5 flex items-center gap-3">
              <AlertTriangle size={22} className="text-primary" />

              <div>
                <h2 className="text-lg font-semibold text-foreground">
                  Ocorrências
                </h2>
                <p className="text-sm text-muted-foreground">
                  Advertências, suspensões, relatórios e atendimentos
                </p>
              </div>
            </div>

            {aluno.ocorrencias.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                Nenhuma ocorrência registrada.
              </p>
            ) : (
              <div className="space-y-3">
                {aluno.ocorrencias.slice(0, 5).map((ocorrencia) => (
                  <div
                    key={ocorrencia.id}
                    className="rounded-3xl bg-muted p-5 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-sm"
                  >
                    <div className="mb-2 flex flex-wrap gap-2">
                      <span className="rounded-full bg-background px-3 py-1 text-xs font-semibold text-foreground">
                        {getTipoOcorrenciaLabel(ocorrencia.tipo)}
                      </span>

                      <span className="rounded-full bg-background px-3 py-1 text-xs font-semibold text-muted-foreground">
                        {formatDate(ocorrencia.criadoEm)}
                      </span>
                    </div>

                    <p className="font-semibold text-foreground">
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

          <section className="rounded-[2rem] border border-border bg-card p-6 shadow-sm">
            <div className="mb-5 flex items-center gap-3">
              <MessageCircle size={22} className="text-primary" />

              <div>
                <h2 className="text-lg font-semibold text-foreground">
                  Comunicação
                </h2>
                <p className="text-sm text-muted-foreground">
                  Comunicados e respostas da família
                </p>
              </div>
            </div>

            {aluno.destinatariosComunicados.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                Nenhum comunicado vinculado a este aluno.
              </p>
            ) : (
              <div className="space-y-3">
                {aluno.destinatariosComunicados.slice(0, 5).map((item) => {
                  const ultimaResposta = item.respostas[0] ?? null;

                  return (
                    <div
                      key={item.id}
                      className="rounded-3xl bg-muted p-5 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-sm"
                    >
                      <div className="mb-2 flex flex-wrap gap-2">
                        <span className="rounded-full bg-background px-3 py-1 text-xs font-semibold text-foreground">
                          {getStatusLabel(item.status)}
                        </span>

                        <span className="rounded-full bg-background px-3 py-1 text-xs font-semibold text-muted-foreground">
                          {formatDate(item.criadoEm)}
                        </span>
                      </div>

                      <p className="font-semibold text-foreground">
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
      </div>
    </AppLayout>
  );
}