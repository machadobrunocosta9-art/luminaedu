import AppLayout from "@/components/layout/AppLayout";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { notFound } from "next/navigation";
import Link from "next/link";
import { randomUUID } from "crypto";
import {
  AlertTriangle,
  ArrowLeft,
  CalendarDays,
  CheckCircle2,
  ClipboardList,
  CreditCard,
  ExternalLink,
  FileText,
  GraduationCap,
  History,
  Mail,
  MessageCircle,
  NotebookText,
  ShieldAlert,
  Sparkles,
  UserRound,
  UsersRound,
} from "lucide-react";

type AlunoDetalhePageProps = {
  params: Promise<{
    id: string;
  }>;
};

type LinhaTempoItem = {
  id: string;
  data: Date;
  categoria: string;
  titulo: string;
  descricao: string;
  status?: string;
  href?: string;
};

function formatDate(date?: Date | null) {
  if (!date) return "Não informado";

  return new Intl.DateTimeFormat("pt-BR", {
    timeZone: "UTC",
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
    RASCUNHO: "Rascunho",
    PREPARADO: "Preparado",
    ENVIADO: "Enviado",
    VISUALIZADO: "Visualizado",
    RESPONDIDO: "Respondido",
    ARQUIVADO: "Arquivado",
  };

  return labels[status] ?? status;
}

function getTipoLabel(tipo: string) {
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

function getTipoComunicadoLabel(tipo: string) {
  const labels: Record<string, string> = {
    SIMPLES: "Comunicado simples",
    CIENCIA: "Comunicado com ciência",
    EVENTO: "Evento",
    AUTORIZACAO: "Autorização",
    PAGAMENTO: "Pagamento",
  };

  return labels[tipo] ?? tipo;
}

function getTipoRespostaLabel(tipo: string) {
  const labels: Record<string, string> = {
    CIENTE: "Responsável ciente",
    PARTICIPA: "Vai participar",
    NAO_PARTICIPA: "Não vai participar",
    AUTORIZADO: "Autorizado",
    NAO_AUTORIZADO: "Não autorizado",
    RESPOSTA_TEXTO: "Resposta enviada",
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

export default async function AlunoDetalhePage({
  params,
}: AlunoDetalhePageProps) {
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
          responsavel: true,
          respostas: {
            orderBy: {
              dataResposta: "desc",
            },
          },
          comunicado: {
            include: {
              turma: true,
            },
          },
        },
      },
    },
  });

  if (!aluno) {
    notFound();
  }

  const alunoEncontrado = aluno;

  async function marcarComoEnviado(formData: FormData) {
    "use server";

    const ocorrenciaId = String(formData.get("ocorrenciaId") || "");

    if (!ocorrenciaId) {
      throw new Error("Ocorrência não encontrada.");
    }

    await prisma.ocorrenciaAluno.update({
      where: {
        id: ocorrenciaId,
      },
      data: {
        status: "ENVIADO",
        enviadoPorEmail: true,
        dataEnvioEmail: new Date(),
        tokenCiencia: randomUUID(),
      },
    });

    revalidatePath(`/alunos/${alunoEncontrado.id}`);
    revalidatePath("/comunicacao");
    revalidatePath("/relatorios");
  }

  const tarefasAbertas = alunoEncontrado.tarefas.filter(
    (tarefa) => tarefa.status !== "CONCLUIDA",
  );

  const tarefasFinanceiro = alunoEncontrado.tarefas.filter(
    (tarefa) => tarefa.setor === "Financeiro",
  );

  const tarefasDocumentos = alunoEncontrado.tarefas.filter(
    (tarefa) => tarefa.setor === "Documentos",
  );

  const advertencias = alunoEncontrado.ocorrencias.filter(
    (ocorrencia) => ocorrencia.tipo === "ADVERTENCIA",
  );

  const suspensoes = alunoEncontrado.ocorrencias.filter(
    (ocorrencia) => ocorrencia.tipo === "SUSPENSAO",
  );

  const enviosPreparados = alunoEncontrado.ocorrencias.filter(
    (ocorrencia) =>
      ocorrencia.enviarParaResponsavel && !ocorrencia.enviadoPorEmail,
  );

  const enviosRealizados = alunoEncontrado.ocorrencias.filter(
    (ocorrencia) => ocorrencia.enviadoPorEmail,
  );

  const comunicacoesAluno = alunoEncontrado.destinatariosComunicados;

  const comunicacoesRespondidas = comunicacoesAluno.filter(
    (comunicacao) =>
      comunicacao.status === "RESPONDIDO" || comunicacao.respostas.length > 0,
  );

  const comunicacoesPendentes = comunicacoesAluno.filter(
    (comunicacao) =>
      comunicacao.status !== "RESPONDIDO" && comunicacao.respostas.length === 0,
  );

  const eventosMatricula: LinhaTempoItem[] = alunoEncontrado.matriculas.map(
    (matricula) => ({
      id: `matricula-${matricula.id}`,
      data: matricula.criadoEm,
      categoria: "Matrícula",
      titulo: `Matrícula ${getStatusLabel(matricula.status)}`,
      descricao: `Ano letivo ${matricula.anoLetivo}. Data da matrícula: ${formatDate(
        matricula.dataMatricula,
      )}.`,
      status: getStatusLabel(matricula.status),
    }),
  );

  const eventosOcorrencias: LinhaTempoItem[] =
    alunoEncontrado.ocorrencias.flatMap((ocorrencia) => {
      const eventos: LinhaTempoItem[] = [
        {
          id: `ocorrencia-${ocorrencia.id}`,
          data: ocorrencia.criadoEm,
          categoria: getTipoLabel(ocorrencia.tipo),
          titulo: ocorrencia.titulo,
          descricao: ocorrencia.descricao,
          status: getStatusLabel(ocorrencia.status),
        },
      ];

      if (ocorrencia.dataEnvioEmail) {
        eventos.push({
          id: `ocorrencia-envio-${ocorrencia.id}`,
          data: ocorrencia.dataEnvioEmail,
          categoria: "Comunicação",
          titulo: `${getTipoLabel(ocorrencia.tipo)} enviada ao responsável`,
          descricao: `Registro "${ocorrencia.titulo}" enviado para ciência da família.`,
          status: "Enviado",
          href: ocorrencia.tokenCiencia
            ? `/ciencia/${ocorrencia.tokenCiencia}`
            : undefined,
        });
      }

      if (ocorrencia.dataCiencia) {
        eventos.push({
          id: `ocorrencia-ciencia-${ocorrencia.id}`,
          data: ocorrencia.dataCiencia,
          categoria: "Ciência digital",
          titulo: "Responsável confirmou ciência",
          descricao: `${ocorrencia.nomeConfirmante || "Responsável"} confirmou ciência do registro "${ocorrencia.titulo}".`,
          status: "Confirmado",
        });
      }

      return eventos;
    });

  const eventosComunicacao: LinhaTempoItem[] = comunicacoesAluno.flatMap(
    (comunicacao) => {
      const resposta = comunicacao.respostas[0];

      const eventos: LinhaTempoItem[] = [
        {
          id: `comunicacao-${comunicacao.id}`,
          data:
            comunicacao.comunicado.enviadoEm ||
            comunicacao.enviadoEm ||
            comunicacao.comunicado.criadoEm,
          categoria: "Comunicação",
          titulo: comunicacao.comunicado.titulo,
          descricao: `${getTipoComunicadoLabel(
            comunicacao.comunicado.tipo,
          )} vinculado ao aluno. Status: ${getStatusLabel(comunicacao.status)}.`,
          status: getStatusLabel(comunicacao.status),
          href:
            !resposta && comunicacao.tokenResposta
              ? `/responder/${comunicacao.tokenResposta}`
              : undefined,
        },
      ];

      if (comunicacao.visualizadoEm && !resposta) {
        eventos.push({
          id: `comunicacao-visualizada-${comunicacao.id}`,
          data: comunicacao.visualizadoEm,
          categoria: "Comunicação",
          titulo: "Responsável visualizou o comunicado",
          descricao: `O comunicado "${comunicacao.comunicado.titulo}" foi visualizado pela família.`,
          status: "Visualizado",
          href: comunicacao.tokenResposta
            ? `/responder/${comunicacao.tokenResposta}`
            : undefined,
        });
      }

      if (resposta) {
        eventos.push({
          id: `comunicacao-resposta-${resposta.id}`,
          data: resposta.dataResposta,
          categoria: "Resposta da família",
          titulo: getTipoRespostaLabel(resposta.tipo),
          descricao: `${resposta.nomeRespondente || "Responsável"} respondeu ao comunicado "${
            comunicacao.comunicado.titulo
          }".${
            resposta.motivoNegativa
              ? ` Motivo informado: ${resposta.motivoNegativa}.`
              : ""
          }${resposta.observacao ? ` Observação: ${resposta.observacao}.` : ""}`,
          status: "Respondido",
        });
      }

      return eventos;
    },
  );

  const eventosPulse: LinhaTempoItem[] = alunoEncontrado.tarefas.map(
    (tarefa) => ({
      id: `tarefa-${tarefa.id}`,
      data: tarefa.criadoEm,
      categoria: "Pulse",
      titulo: tarefa.titulo,
      descricao: `${tarefa.setor} · ${getStatusLabel(
        tarefa.status,
      )} · Prioridade ${getPrioridadeLabel(tarefa.prioridade)}.`,
      status: getStatusLabel(tarefa.status),
    }),
  );

  const linhaDoTempo = [
    ...eventosMatricula,
    ...eventosOcorrencias,
    ...eventosComunicacao,
    ...eventosPulse,
  ].sort((a, b) => b.data.getTime() - a.data.getTime());

  const ultimaMatricula = alunoEncontrado.matriculas[0];
  const ultimoEvento = linhaDoTempo[0];

  const alertasLumi: string[] = [];

  if (tarefasAbertas.length > 0) {
    alertasLumi.push(
      `${tarefasAbertas.length} tarefa(s) Pulse aberta(s) vinculada(s) ao aluno.`,
    );
  }

  if (comunicacoesPendentes.length > 0) {
    alertasLumi.push(
      `${comunicacoesPendentes.length} comunicado(s) ainda aguardando resposta da família.`,
    );
  }

  if (advertencias.length >= 3) {
    alertasLumi.push(
      `O aluno possui ${advertencias.length} advertência(s) registradas. Avalie acompanhamento com a coordenação.`,
    );
  }

  if (suspensoes.length > 0) {
    alertasLumi.push(
      `Há ${suspensoes.length} suspensão(ões) registrada(s) no prontuário.`,
    );
  }

  if (alertasLumi.length === 0) {
    alertasLumi.push(
      "Nenhum alerta crítico identificado neste momento. O prontuário está sem pendências relevantes.",
    );
  }

  const sugestoesLumi: string[] = [];

  if (comunicacoesPendentes.length > 0) {
    sugestoesLumi.push("Reforçar o contato com a família sobre os comunicados pendentes.");
  }

  if (tarefasAbertas.length > 0) {
    sugestoesLumi.push("Verificar as tarefas abertas no Pulse e definir próximos responsáveis.");
  }

  if (advertencias.length >= 3 || suspensoes.length > 0) {
    sugestoesLumi.push("Considerar reunião de acompanhamento com família e coordenação.");
  }

  if (sugestoesLumi.length === 0) {
    sugestoesLumi.push("Manter acompanhamento regular e registrar novos eventos importantes.");
  }

  return (
    <AppLayout>
      <div className="mb-8 flex items-start justify-between gap-6">
        <div>
          <Link
            href="/alunos"
            className="mb-5 inline-flex items-center gap-2 text-sm font-medium text-muted-foreground transition hover:text-foreground"
          >
            <ArrowLeft size={16} />
            Voltar para alunos
          </Link>

          <div className="flex items-center gap-4">
            <div className="flex h-16 w-16 items-center justify-center rounded-3xl bg-primary text-primary-foreground">
              <UserRound size={30} />
            </div>

            <div>
              <h1 className="text-3xl font-semibold tracking-tight text-foreground">
                {alunoEncontrado.nome}
              </h1>

              <p className="mt-1 text-sm text-muted-foreground">
                Prontuário digital completo do aluno
              </p>
            </div>
          </div>
        </div>

        <Link
          href={`/alunos/${alunoEncontrado.id}/ocorrencias/novo`}
          className="rounded-2xl bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground transition hover:opacity-90"
        >
          Nova ocorrência
        </Link>
      </div>

      <div className="mb-8 grid gap-4 md:grid-cols-4">
        <div className="rounded-3xl border border-border bg-card p-5 shadow-sm">
          <ClipboardList size={22} />
          <p className="mt-4 text-sm text-muted-foreground">Ocorrências</p>
          <p className="mt-1 text-3xl font-semibold text-foreground">
            {alunoEncontrado.ocorrencias.length}
          </p>
        </div>

        <div className="rounded-3xl border border-border bg-card p-5 shadow-sm">
          <ShieldAlert size={22} />
          <p className="mt-4 text-sm text-muted-foreground">Advertências</p>
          <p className="mt-1 text-3xl font-semibold text-foreground">
            {advertencias.length}
          </p>
        </div>

        <div className="rounded-3xl border border-border bg-card p-5 shadow-sm">
          <MessageCircle size={22} />
          <p className="mt-4 text-sm text-muted-foreground">Comunicações</p>
          <p className="mt-1 text-3xl font-semibold text-foreground">
            {comunicacoesAluno.length}
          </p>
        </div>

        <div className="rounded-3xl border border-border bg-card p-5 shadow-sm">
          <History size={22} />
          <p className="mt-4 text-sm text-muted-foreground">Linha do tempo</p>
          <p className="mt-1 text-3xl font-semibold text-foreground">
            {linhaDoTempo.length}
          </p>
        </div>
      </div>

      <section className="mb-8 rounded-3xl border border-border bg-card p-6 shadow-sm">
        <h2 className="font-semibold text-foreground">Ações rápidas</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Registre rapidamente os principais documentos do prontuário.
        </p>

        <div className="mt-5 grid gap-3 md:grid-cols-5">
          <Link
            href={`/alunos/${alunoEncontrado.id}/ocorrencias/novo?tipo=ADVERTENCIA`}
            className="rounded-2xl border border-border bg-background p-4 transition hover:-translate-y-0.5 hover:shadow-md"
          >
            <ShieldAlert size={22} className="mb-3" />
            <p className="font-semibold text-foreground">Nova advertência</p>
            <p className="mt-1 text-xs leading-5 text-muted-foreground">
              Registro formal para o responsável.
            </p>
          </Link>

          <Link
            href={`/alunos/${alunoEncontrado.id}/ocorrencias/novo?tipo=SUSPENSAO`}
            className="rounded-2xl border border-border bg-background p-4 transition hover:-translate-y-0.5 hover:shadow-md"
          >
            <AlertTriangle size={22} className="mb-3" />
            <p className="font-semibold text-foreground">Nova suspensão</p>
            <p className="mt-1 text-xs leading-5 text-muted-foreground">
              Inclui período e motivo.
            </p>
          </Link>

          <Link
            href={`/alunos/${alunoEncontrado.id}/ocorrencias/novo?tipo=RELATORIO`}
            className="rounded-2xl border border-border bg-background p-4 transition hover:-translate-y-0.5 hover:shadow-md"
          >
            <NotebookText size={22} className="mb-3" />
            <p className="font-semibold text-foreground">Novo relatório</p>
            <p className="mt-1 text-xs leading-5 text-muted-foreground">
              Relatório pedagógico ou comportamental.
            </p>
          </Link>

          <Link
            href={`/alunos/${alunoEncontrado.id}/ocorrencias/novo?tipo=ATENDIMENTO`}
            className="rounded-2xl border border-border bg-background p-4 transition hover:-translate-y-0.5 hover:shadow-md"
          >
            <UsersRound size={22} className="mb-3" />
            <p className="font-semibold text-foreground">Atendimento</p>
            <p className="mt-1 text-xs leading-5 text-muted-foreground">
              Registro de conversa ou orientação.
            </p>
          </Link>

          <Link
            href={`/alunos/${alunoEncontrado.id}/ocorrencias/novo?tipo=OCORRENCIA`}
            className="rounded-2xl border border-border bg-background p-4 transition hover:-translate-y-0.5 hover:shadow-md"
          >
            <ClipboardList size={22} className="mb-3" />
            <p className="font-semibold text-foreground">Ocorrência</p>
            <p className="mt-1 text-xs leading-5 text-muted-foreground">
              Registro geral no histórico.
            </p>
          </Link>
        </div>
      </section>

      <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
        <div className="space-y-6">
          <section className="rounded-3xl border border-border bg-card p-6 shadow-sm">
            <div className="mb-5 flex items-center gap-3">
              <UserRound size={22} />

              <div>
                <h2 className="font-semibold text-foreground">
                  Dados do aluno
                </h2>
                <p className="text-sm text-muted-foreground">
                  Informações principais do cadastro
                </p>
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="rounded-2xl bg-muted p-4">
                <p className="text-xs font-medium uppercase tracking-[0.16em] text-muted-foreground">
                  Nome
                </p>
                <p className="mt-1 font-medium text-foreground">
                  {alunoEncontrado.nome}
                </p>
              </div>

              <div className="rounded-2xl bg-muted p-4">
                <p className="text-xs font-medium uppercase tracking-[0.16em] text-muted-foreground">
                  Nascimento
                </p>
                <p className="mt-1 font-medium text-foreground">
                  {formatDate(alunoEncontrado.dataNascimento)}
                </p>
              </div>

              <div className="rounded-2xl bg-muted p-4">
                <p className="text-xs font-medium uppercase tracking-[0.16em] text-muted-foreground">
                  Turma
                </p>
                <p className="mt-1 font-medium text-foreground">
                  {alunoEncontrado.turma?.nome ?? "Sem turma"}
                </p>
              </div>

              <div className="rounded-2xl bg-muted p-4">
                <p className="text-xs font-medium uppercase tracking-[0.16em] text-muted-foreground">
                  Status da matrícula
                </p>
                <p className="mt-1 font-medium text-foreground">
                  {ultimaMatricula
                    ? getStatusLabel(ultimaMatricula.status)
                    : "Sem matrícula"}
                </p>
              </div>
            </div>

            <div className="mt-4 rounded-2xl bg-muted p-4">
              <p className="text-xs font-medium uppercase tracking-[0.16em] text-muted-foreground">
                Observações
              </p>
              <p className="mt-1 text-sm leading-6 text-foreground">
                {alunoEncontrado.observacoes ||
                  "Nenhuma observação cadastrada."}
              </p>
            </div>
          </section>

          <section className="rounded-3xl border border-border bg-card p-6 shadow-sm">
            <div className="mb-5 flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-primary text-primary-foreground">
                <Sparkles size={22} />
              </div>

              <div>
                <h2 className="font-semibold text-foreground">
                  Resumo Lumi do Aluno
                </h2>
                <p className="text-sm text-muted-foreground">
                  Leitura automática do prontuário com base nos registros atuais
                </p>
              </div>
            </div>

            <div className="rounded-3xl bg-muted p-5">
              <p className="text-sm leading-7 text-foreground">
                {alunoEncontrado.nome} possui{" "}
                <strong>{alunoEncontrado.ocorrencias.length}</strong>{" "}
                ocorrência(s) registrada(s),{" "}
                <strong>{comunicacoesAluno.length}</strong> comunicação(ões)
                vinculada(s),{" "}
                <strong>{comunicacoesPendentes.length}</strong> resposta(s)
                pendente(s) da família e{" "}
                <strong>{tarefasAbertas.length}</strong> tarefa(s) aberta(s) no
                Pulse.
              </p>

              {ultimoEvento && (
                <p className="mt-3 text-sm leading-7 text-muted-foreground">
                  Última movimentação:{" "}
                  <strong className="text-foreground">
                    {ultimoEvento.titulo}
                  </strong>{" "}
                  em {formatDateTime(ultimoEvento.data)}.
                </p>
              )}
            </div>

            <div className="mt-5 grid gap-4 md:grid-cols-2">
              <div className="rounded-2xl border border-border bg-background p-4">
                <p className="mb-3 text-sm font-semibold text-foreground">
                  Pontos de atenção
                </p>

                <div className="space-y-3">
                  {alertasLumi.map((alerta) => (
                    <div key={alerta} className="flex items-start gap-3">
                      <AlertTriangle
                        size={17}
                        className="mt-0.5 shrink-0 text-muted-foreground"
                      />
                      <p className="text-sm leading-6 text-muted-foreground">
                        {alerta}
                      </p>
                    </div>
                  ))}
                </div>
              </div>

              <div className="rounded-2xl border border-border bg-background p-4">
                <p className="mb-3 text-sm font-semibold text-foreground">
                  Sugestões da Lumi
                </p>

                <div className="space-y-3">
                  {sugestoesLumi.map((sugestao) => (
                    <div key={sugestao} className="flex items-start gap-3">
                      <CheckCircle2
                        size={17}
                        className="mt-0.5 shrink-0 text-muted-foreground"
                      />
                      <p className="text-sm leading-6 text-muted-foreground">
                        {sugestao}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </section>

          <section className="rounded-3xl border border-border bg-card p-6 shadow-sm">
            <div className="mb-5 flex items-center gap-3">
              <History size={22} />

              <div>
                <h2 className="font-semibold text-foreground">
                  Linha do Tempo do Aluno
                </h2>
                <p className="text-sm text-muted-foreground">
                  Matrículas, ocorrências, comunicados, respostas e tarefas em
                  ordem cronológica
                </p>
              </div>
            </div>

            {linhaDoTempo.length === 0 ? (
              <p className="rounded-2xl border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
                Nenhum evento encontrado na linha do tempo.
              </p>
            ) : (
              <div className="relative space-y-4">
                {linhaDoTempo.slice(0, 12).map((evento, index) => (
                  <div key={evento.id} className="relative pl-8">
                    {index !== linhaDoTempo.slice(0, 12).length - 1 && (
                      <div className="absolute left-[11px] top-7 h-full w-px bg-border" />
                    )}

                    <div className="absolute left-0 top-1.5 flex h-6 w-6 items-center justify-center rounded-full bg-primary text-primary-foreground">
                      <span className="h-2 w-2 rounded-full bg-current" />
                    </div>

                    <div className="rounded-2xl border border-border bg-background p-4">
                      <div className="mb-3 flex flex-wrap items-center gap-2">
                        <span className="rounded-full bg-muted px-3 py-1 text-xs font-semibold text-foreground">
                          {evento.categoria}
                        </span>

                        {evento.status && (
                          <span className="rounded-full bg-muted px-3 py-1 text-xs font-semibold text-muted-foreground">
                            {evento.status}
                          </span>
                        )}

                        <span className="rounded-full bg-muted px-3 py-1 text-xs font-semibold text-muted-foreground">
                          {formatDateTime(evento.data)}
                        </span>
                      </div>

                      <h3 className="font-semibold text-foreground">
                        {evento.titulo}
                      </h3>

                      <p className="mt-2 text-sm leading-6 text-muted-foreground">
                        {evento.descricao}
                      </p>

                      {evento.href && (
                        <Link
                          href={evento.href}
                          target="_blank"
                          className="mt-4 inline-flex items-center gap-2 rounded-2xl border border-border bg-muted px-4 py-2 text-xs font-semibold text-foreground transition hover:bg-card"
                        >
                          Abrir link
                          <ExternalLink size={15} />
                        </Link>
                      )}
                    </div>
                  </div>
                ))}

                {linhaDoTempo.length > 12 && (
                  <p className="rounded-2xl bg-muted p-4 text-sm text-muted-foreground">
                    + {linhaDoTempo.length - 12} evento(s) antigo(s) na linha do
                    tempo.
                  </p>
                )}
              </div>
            )}
          </section>

          <section className="rounded-3xl border border-border bg-card p-6 shadow-sm">
            <div className="mb-5 flex items-center gap-3">
              <MessageCircle size={22} />

              <div>
                <h2 className="font-semibold text-foreground">
                  Comunicação do aluno
                </h2>
                <p className="text-sm text-muted-foreground">
                  Comunicados, eventos, autorizações e respostas da família
                </p>
              </div>
            </div>

            <div className="mb-5 grid gap-3 md:grid-cols-3">
              <div className="rounded-2xl bg-muted p-4">
                <p className="text-xs font-medium uppercase tracking-[0.16em] text-muted-foreground">
                  Total
                </p>
                <p className="mt-1 text-2xl font-semibold text-foreground">
                  {comunicacoesAluno.length}
                </p>
              </div>

              <div className="rounded-2xl bg-muted p-4">
                <p className="text-xs font-medium uppercase tracking-[0.16em] text-muted-foreground">
                  Respondidas
                </p>
                <p className="mt-1 text-2xl font-semibold text-foreground">
                  {comunicacoesRespondidas.length}
                </p>
              </div>

              <div className="rounded-2xl bg-muted p-4">
                <p className="text-xs font-medium uppercase tracking-[0.16em] text-muted-foreground">
                  Pendentes
                </p>
                <p className="mt-1 text-2xl font-semibold text-foreground">
                  {comunicacoesPendentes.length}
                </p>
              </div>
            </div>

            {comunicacoesAluno.length === 0 ? (
              <p className="rounded-2xl border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
                Nenhum comunicado vinculado a este aluno ainda.
              </p>
            ) : (
              <div className="space-y-3">
                {comunicacoesAluno.slice(0, 8).map((comunicacao) => {
                  const resposta = comunicacao.respostas[0];

                  return (
                    <div
                      key={comunicacao.id}
                      className="rounded-2xl border border-border bg-background p-4"
                    >
                      <div className="mb-3 flex flex-wrap items-center gap-2">
                        <span className="rounded-full bg-muted px-3 py-1 text-xs font-semibold text-foreground">
                          {getTipoComunicadoLabel(comunicacao.comunicado.tipo)}
                        </span>

                        <span className="rounded-full bg-muted px-3 py-1 text-xs font-semibold text-muted-foreground">
                          {getStatusLabel(comunicacao.status)}
                        </span>

                        {resposta && (
                          <span className="rounded-full bg-muted px-3 py-1 text-xs font-semibold text-muted-foreground">
                            {getTipoRespostaLabel(resposta.tipo)}
                          </span>
                        )}
                      </div>

                      <h3 className="font-semibold text-foreground">
                        {comunicacao.comunicado.titulo}
                      </h3>

                      <p className="mt-2 line-clamp-3 text-sm leading-6 text-muted-foreground">
                        {comunicacao.comunicado.conteudo}
                      </p>

                      <div className="mt-4 grid gap-3 md:grid-cols-2">
                        <div className="rounded-2xl bg-muted p-3">
                          <p className="text-xs text-muted-foreground">
                            Responsável
                          </p>
                          <p className="mt-1 text-sm font-semibold text-foreground">
                            {comunicacao.nomeResponsavel ||
                              comunicacao.responsavel?.nome ||
                              alunoEncontrado.responsavel.nome}
                          </p>
                        </div>

                        <div className="rounded-2xl bg-muted p-3">
                          <p className="text-xs text-muted-foreground">
                            Criado em
                          </p>
                          <p className="mt-1 text-sm font-semibold text-foreground">
                            {formatDateTime(comunicacao.comunicado.criadoEm)}
                          </p>
                        </div>
                      </div>

                      {resposta && (
                        <div className="mt-4 rounded-2xl bg-muted p-4">
                          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                            Resposta da família
                          </p>

                          <p className="mt-2 text-sm font-semibold text-foreground">
                            {getTipoRespostaLabel(resposta.tipo)}
                          </p>

                          <p className="mt-1 text-sm text-muted-foreground">
                            Respondido por{" "}
                            {resposta.nomeRespondente || "responsável"} em{" "}
                            {formatDateTime(resposta.dataResposta)}.
                          </p>

                          {resposta.motivoNegativa && (
                            <p className="mt-3 text-sm text-muted-foreground">
                              Motivo: {resposta.motivoNegativa}
                            </p>
                          )}

                          {resposta.observacao && (
                            <p className="mt-3 text-sm text-muted-foreground">
                              Observação: {resposta.observacao}
                            </p>
                          )}
                        </div>
                      )}

                      {!resposta && comunicacao.tokenResposta && (
                        <Link
                          href={`/responder/${comunicacao.tokenResposta}`}
                          target="_blank"
                          className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-2xl border border-border bg-muted px-4 py-3 text-sm font-semibold text-foreground transition hover:bg-card"
                        >
                          Abrir link de resposta
                          <ExternalLink size={16} />
                        </Link>
                      )}
                    </div>
                  );
                })}

                {comunicacoesAluno.length > 8 && (
                  <p className="rounded-2xl bg-muted p-4 text-sm text-muted-foreground">
                    + {comunicacoesAluno.length - 8} comunicação(ões) neste
                    prontuário.
                  </p>
                )}
              </div>
            )}
          </section>

          <section className="rounded-3xl border border-border bg-card p-6 shadow-sm">
            <div className="mb-5 flex items-center gap-3">
              <ClipboardList size={22} />

              <div>
                <h2 className="font-semibold text-foreground">
                  Ocorrências e relatórios
                </h2>
                <p className="text-sm text-muted-foreground">
                  Histórico completo do aluno
                </p>
              </div>
            </div>

            {alunoEncontrado.ocorrencias.length === 0 ? (
              <p className="rounded-2xl border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
                Nenhuma ocorrência registrada.
              </p>
            ) : (
              <div className="space-y-3">
                {alunoEncontrado.ocorrencias.map((ocorrencia) => (
                  <div
                    key={ocorrencia.id}
                    className="rounded-2xl border border-border bg-background p-4"
                  >
                    <div className="mb-3 flex flex-wrap items-center gap-2">
                      <span className="rounded-full bg-muted px-3 py-1 text-xs font-semibold text-foreground">
                        {getTipoLabel(ocorrencia.tipo)}
                      </span>

                      <span className="rounded-full bg-muted px-3 py-1 text-xs font-semibold text-muted-foreground">
                        {getStatusLabel(ocorrencia.status)}
                      </span>

                      {ocorrencia.cienciaConfirmada && (
                        <span className="rounded-full bg-muted px-3 py-1 text-xs font-semibold text-muted-foreground">
                          Responsável ciente
                        </span>
                      )}
                    </div>

                    <h3 className="font-semibold text-foreground">
                      {ocorrencia.titulo}
                    </h3>

                    <p className="mt-2 text-sm leading-6 text-muted-foreground">
                      {ocorrencia.descricao}
                    </p>

                    {ocorrencia.dataCiencia && (
                      <div className="mt-4 rounded-2xl bg-muted p-4">
                        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                          Ciência digital
                        </p>
                        <p className="mt-2 text-sm text-foreground">
                          Confirmado por{" "}
                          {ocorrencia.nomeConfirmante || "responsável"} em{" "}
                          {formatDateTime(ocorrencia.dataCiencia)}.
                        </p>
                      </div>
                    )}

                    {ocorrencia.textoFinal && (
                      <div className="mt-4 rounded-2xl bg-muted p-4">
                        <p className="mb-2 text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                          Texto final
                        </p>
                        <p className="whitespace-pre-line text-sm leading-6 text-foreground">
                          {ocorrencia.textoFinal}
                        </p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </section>
        </div>

        <aside className="space-y-6">
          <section className="rounded-3xl border border-border bg-card p-6 shadow-sm">
            <div className="mb-5 flex items-center gap-3">
              <UsersRound size={22} />

              <div>
                <h2 className="font-semibold text-foreground">Responsável</h2>
                <p className="text-sm text-muted-foreground">
                  Dados da família vinculada ao aluno
                </p>
              </div>
            </div>

            <div className="space-y-3">
              <div className="rounded-2xl bg-muted p-4">
                <p className="text-xs font-medium uppercase tracking-[0.16em] text-muted-foreground">
                  Nome
                </p>
                <p className="mt-1 font-medium text-foreground">
                  {alunoEncontrado.responsavel.nome}
                </p>
              </div>

              <div className="rounded-2xl bg-muted p-4">
                <p className="text-xs font-medium uppercase tracking-[0.16em] text-muted-foreground">
                  Telefone
                </p>
                <p className="mt-1 font-medium text-foreground">
                  {alunoEncontrado.responsavel.telefone}
                </p>
              </div>

              <div className="rounded-2xl bg-muted p-4">
                <p className="text-xs font-medium uppercase tracking-[0.16em] text-muted-foreground">
                  E-mail
                </p>
                <p className="mt-1 font-medium text-foreground">
                  {alunoEncontrado.responsavel.email || "Não informado"}
                </p>
              </div>
            </div>
          </section>

          <section className="rounded-3xl border border-border bg-card p-6 shadow-sm">
            <div className="mb-5 flex items-center gap-3">
              <GraduationCap size={22} />

              <div>
                <h2 className="font-semibold text-foreground">Matrículas</h2>
                <p className="text-sm text-muted-foreground">
                  Histórico escolar
                </p>
              </div>
            </div>

            {alunoEncontrado.matriculas.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                Nenhuma matrícula encontrada.
              </p>
            ) : (
              <div className="space-y-3">
                {alunoEncontrado.matriculas.map((matricula) => (
                  <div key={matricula.id} className="rounded-2xl bg-muted p-4">
                    <p className="font-medium text-foreground">
                      Ano letivo {matricula.anoLetivo}
                    </p>
                    <p className="mt-1 text-sm text-muted-foreground">
                      {getStatusLabel(matricula.status)} ·{" "}
                      {formatDate(matricula.dataMatricula)}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </section>

          <section className="rounded-3xl border border-border bg-card p-6 shadow-sm">
            <div className="mb-5 flex items-center gap-3">
              <CreditCard size={22} />

              <div>
                <h2 className="font-semibold text-foreground">Financeiro</h2>
                <p className="text-sm text-muted-foreground">
                  Pendências financeiras
                </p>
              </div>
            </div>

            {tarefasFinanceiro.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                Nenhuma pendência financeira registrada.
              </p>
            ) : (
              <div className="space-y-3">
                {tarefasFinanceiro.map((tarefa) => (
                  <div key={tarefa.id} className="rounded-2xl bg-muted p-4">
                    <p className="font-medium text-foreground">
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

          <section className="rounded-3xl border border-border bg-card p-6 shadow-sm">
            <div className="mb-5 flex items-center gap-3">
              <FileText size={22} />

              <div>
                <h2 className="font-semibold text-foreground">Documentos</h2>
                <p className="text-sm text-muted-foreground">
                  Pendências documentais
                </p>
              </div>
            </div>

            {tarefasDocumentos.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                Nenhuma pendência documental registrada.
              </p>
            ) : (
              <div className="space-y-3">
                {tarefasDocumentos.map((tarefa) => (
                  <div key={tarefa.id} className="rounded-2xl bg-muted p-4">
                    <p className="font-medium text-foreground">
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

          <section className="rounded-3xl border border-border bg-card p-6 shadow-sm">
            <div className="mb-5 flex items-center gap-3">
              <Mail size={22} />

              <div>
                <h2 className="font-semibold text-foreground">
                  Comunicação com responsável
                </h2>
                <p className="text-sm text-muted-foreground">
                  Envios e ciência digital
                </p>
              </div>
            </div>

            {enviosPreparados.length === 0 && enviosRealizados.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                Nenhum envio preparado.
              </p>
            ) : (
              <div className="space-y-4">
                {enviosPreparados.map((ocorrencia) => (
                  <div
                    key={ocorrencia.id}
                    className="rounded-2xl border border-border bg-background p-4"
                  >
                    <p className="font-medium text-foreground">
                      {ocorrencia.titulo}
                    </p>

                    <p className="mt-1 text-sm text-muted-foreground">
                      {getTipoLabel(ocorrencia.tipo)} · Preparado
                    </p>

                    <form action={marcarComoEnviado} className="mt-4">
                      <input
                        type="hidden"
                        name="ocorrenciaId"
                        value={ocorrencia.id}
                      />

                      <button
                        type="submit"
                        className="w-full rounded-2xl bg-primary px-4 py-3 text-sm font-semibold text-primary-foreground transition hover:opacity-90"
                      >
                        Marcar como enviado e gerar ciência
                      </button>
                    </form>
                  </div>
                ))}

                {enviosRealizados.slice(0, 5).map((ocorrencia) => (
                  <div key={ocorrencia.id} className="rounded-2xl bg-muted p-4">
                    <p className="font-medium text-foreground">
                      {ocorrencia.titulo}
                    </p>

                    <p className="mt-1 text-sm text-muted-foreground">
                      {getTipoLabel(ocorrencia.tipo)} ·{" "}
                      {ocorrencia.cienciaConfirmada
                        ? "Responsável ciente"
                        : "Aguardando ciência"}
                    </p>

                    {ocorrencia.tokenCiencia && (
                      <Link
                        href={`/ciencia/${ocorrencia.tokenCiencia}`}
                        target="_blank"
                        className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-2xl border border-border bg-background px-4 py-3 text-sm font-semibold text-foreground transition hover:bg-card"
                      >
                        Abrir link de ciência
                        <ExternalLink size={16} />
                      </Link>
                    )}
                  </div>
                ))}
              </div>
            )}
          </section>

          <section className="rounded-3xl border border-border bg-card p-6 shadow-sm">
            <div className="mb-5 flex items-center gap-3">
              <CalendarDays size={22} />

              <div>
                <h2 className="font-semibold text-foreground">
                  Histórico Pulse
                </h2>
                <p className="text-sm text-muted-foreground">
                  Últimas tarefas do aluno
                </p>
              </div>
            </div>

            {alunoEncontrado.tarefas.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                Nenhuma tarefa vinculada.
              </p>
            ) : (
              <div className="space-y-3">
                {alunoEncontrado.tarefas.slice(0, 6).map((tarefa) => (
                  <div key={tarefa.id} className="rounded-2xl bg-muted p-4">
                    <p className="font-medium text-foreground">
                      {tarefa.titulo}
                    </p>
                    <p className="mt-1 text-sm text-muted-foreground">
                      {tarefa.setor} · {getStatusLabel(tarefa.status)}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </section>
        </aside>
      </div>
    </AppLayout>
  );
}