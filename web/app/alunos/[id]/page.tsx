import AppLayout from "@/components/layout/AppLayout";
import { prisma } from "@/lib/prisma";
import {
  AlertTriangle,
  ArrowLeft,
  CalendarDays,
  CheckCircle2,
  ClipboardList,
  CreditCard,
  FileText,
  GraduationCap,
  Mail,
  NotebookText,
  ShieldAlert,
  UserRound,
  UsersRound,
} from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";

type AlunoDetalhePageProps = {
  params: Promise<{
    id: string;
  }>;
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
    ENVIADO: "Enviado",
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
      escola: true,
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
    },
  });

  if (!aluno) {
    notFound();
  }

  const tarefasAbertas = aluno.tarefas.filter(
    (tarefa) => tarefa.status !== "CONCLUIDA",
  );

  const tarefasFinanceiro = aluno.tarefas.filter(
    (tarefa) => tarefa.setor === "Financeiro",
  );

  const tarefasDocumentos = aluno.tarefas.filter(
    (tarefa) => tarefa.setor === "Documentos",
  );

  const tarefasComunicacao = aluno.tarefas.filter(
    (tarefa) => tarefa.setor === "Comunicação",
  );

  const advertencias = aluno.ocorrencias.filter(
    (ocorrencia) => ocorrencia.tipo === "ADVERTENCIA",
  );

  const suspensoes = aluno.ocorrencias.filter(
    (ocorrencia) => ocorrencia.tipo === "SUSPENSAO",
  );

  const relatorios = aluno.ocorrencias.filter(
    (ocorrencia) => ocorrencia.tipo === "RELATORIO",
  );

  const ultimaMatricula = aluno.matriculas[0];

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
                {aluno.nome}
              </h1>

              <p className="mt-1 text-sm text-muted-foreground">
                Prontuário digital completo do aluno
              </p>
            </div>
          </div>
        </div>

        <Link
          href={`/alunos/${aluno.id}/ocorrencias/novo`}
          className="rounded-2xl bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground transition hover:opacity-90"
        >
          Nova ocorrência
        </Link>
      </div>

      <div className="mb-8 grid gap-4 md:grid-cols-4">
        <div className="rounded-3xl border border-border bg-card p-5 shadow-sm">
          <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-2xl bg-muted text-foreground">
            <ClipboardList size={20} />
          </div>

          <p className="text-sm text-muted-foreground">Ocorrências</p>
          <p className="mt-1 text-3xl font-semibold text-foreground">
            {aluno.ocorrencias.length}
          </p>
        </div>

        <div className="rounded-3xl border border-border bg-card p-5 shadow-sm">
          <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-2xl bg-muted text-foreground">
            <ShieldAlert size={20} />
          </div>

          <p className="text-sm text-muted-foreground">Advertências</p>
          <p className="mt-1 text-3xl font-semibold text-foreground">
            {advertencias.length}
          </p>
        </div>

        <div className="rounded-3xl border border-border bg-card p-5 shadow-sm">
          <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-2xl bg-muted text-foreground">
            <AlertTriangle size={20} />
          </div>

          <p className="text-sm text-muted-foreground">Suspensões</p>
          <p className="mt-1 text-3xl font-semibold text-foreground">
            {suspensoes.length}
          </p>
        </div>

        <div className="rounded-3xl border border-border bg-card p-5 shadow-sm">
          <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-2xl bg-muted text-foreground">
            <CheckCircle2 size={20} />
          </div>

          <p className="text-sm text-muted-foreground">Pulse aberto</p>
          <p className="mt-1 text-3xl font-semibold text-foreground">
            {tarefasAbertas.length}
          </p>
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
        <div className="space-y-6">
          <section className="rounded-3xl border border-border bg-card p-6 shadow-sm">
            <div className="mb-5 flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-muted">
                <UserRound size={19} />
              </div>

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
                  {aluno.nome}
                </p>
              </div>

              <div className="rounded-2xl bg-muted p-4">
                <p className="text-xs font-medium uppercase tracking-[0.16em] text-muted-foreground">
                  Nascimento
                </p>
                <p className="mt-1 font-medium text-foreground">
                  {formatDate(aluno.dataNascimento)}
                </p>
              </div>

              <div className="rounded-2xl bg-muted p-4">
                <p className="text-xs font-medium uppercase tracking-[0.16em] text-muted-foreground">
                  Turma
                </p>
                <p className="mt-1 font-medium text-foreground">
                  {aluno.turma?.nome ?? "Sem turma"}
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

              <div className="rounded-2xl bg-muted p-4">
                <p className="text-xs font-medium uppercase tracking-[0.16em] text-muted-foreground">
                  CPF
                </p>
                <p className="mt-1 font-medium text-foreground">
                  {aluno.cpf || "Não informado"}
                </p>
              </div>

              <div className="rounded-2xl bg-muted p-4">
                <p className="text-xs font-medium uppercase tracking-[0.16em] text-muted-foreground">
                  Certidão
                </p>
                <p className="mt-1 font-medium text-foreground">
                  {aluno.certidaoNascimento || "Não informado"}
                </p>
              </div>
            </div>

            <div className="mt-4 rounded-2xl bg-muted p-4">
              <p className="text-xs font-medium uppercase tracking-[0.16em] text-muted-foreground">
                Alergias
              </p>
              <p className="mt-1 text-sm leading-6 text-foreground">
                {aluno.alergias || "Nenhuma alergia informada."}
              </p>
            </div>

            <div className="mt-4 rounded-2xl bg-muted p-4">
              <p className="text-xs font-medium uppercase tracking-[0.16em] text-muted-foreground">
                Observações
              </p>
              <p className="mt-1 text-sm leading-6 text-foreground">
                {aluno.observacoes || "Nenhuma observação cadastrada."}
              </p>
            </div>
          </section>

          <section className="rounded-3xl border border-border bg-card p-6 shadow-sm">
            <div className="mb-5 flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-muted">
                <ClipboardList size={19} />
              </div>

              <div>
                <h2 className="font-semibold text-foreground">
                  Ocorrências e relatórios
                </h2>
                <p className="text-sm text-muted-foreground">
                  Advertências, suspensões, atendimentos e relatórios do aluno
                </p>
              </div>
            </div>

            {aluno.ocorrencias.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-border p-6 text-center">
                <p className="font-medium text-foreground">
                  Nenhuma ocorrência registrada
                </p>
                <p className="mt-1 text-sm text-muted-foreground">
                  Quando a escola registrar advertências, suspensões ou
                  relatórios, eles aparecerão aqui.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {aluno.ocorrencias.map((ocorrencia) => (
                  <div
                    key={ocorrencia.id}
                    className="rounded-2xl border border-border bg-background p-4"
                  >
                    <div className="mb-3 flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="rounded-full bg-muted px-3 py-1 text-xs font-semibold text-foreground">
                            {getTipoLabel(ocorrencia.tipo)}
                          </span>

                          <span className="rounded-full bg-muted px-3 py-1 text-xs font-semibold text-muted-foreground">
                            {getStatusLabel(ocorrencia.status)}
                          </span>

                          {ocorrencia.enviarParaResponsavel && (
                            <span className="rounded-full bg-muted px-3 py-1 text-xs font-semibold text-muted-foreground">
                              Envio ao responsável preparado
                            </span>
                          )}
                        </div>

                        <h3 className="mt-3 font-semibold text-foreground">
                          {ocorrencia.titulo}
                        </h3>
                      </div>

                      <p className="text-xs text-muted-foreground">
                        {formatDateTime(ocorrencia.criadoEm)}
                      </p>
                    </div>

                    <p className="text-sm leading-6 text-muted-foreground">
                      {ocorrencia.descricao}
                    </p>

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

          <section className="rounded-3xl border border-border bg-card p-6 shadow-sm">
            <div className="mb-5 flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-muted">
                <NotebookText size={19} />
              </div>

              <div>
                <h2 className="font-semibold text-foreground">
                  Boletim, presença e acadêmico
                </h2>
                <p className="text-sm text-muted-foreground">
                  Área preparada para notas, frequência e acompanhamento escolar
                </p>
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-3">
              <div className="rounded-2xl bg-muted p-4">
                <p className="font-medium text-foreground">Presença</p>
                <p className="mt-2 text-sm leading-6 text-muted-foreground">
                  Em breve, professores poderão lançar presença por turma.
                </p>
              </div>

              <div className="rounded-2xl bg-muted p-4">
                <p className="font-medium text-foreground">Boletim</p>
                <p className="mt-2 text-sm leading-6 text-muted-foreground">
                  Em breve, professores poderão lançar notas e observações.
                </p>
              </div>

              <div className="rounded-2xl bg-muted p-4">
                <p className="font-medium text-foreground">Relatórios</p>
                <p className="mt-2 text-sm leading-6 text-muted-foreground">
                  {relatorios.length} relatório(s) registrado(s) no prontuário.
                </p>
              </div>
            </div>
          </section>
        </div>

        <aside className="space-y-6">
          <section className="rounded-3xl border border-border bg-card p-6 shadow-sm">
            <div className="mb-5 flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-muted">
                <UsersRound size={19} />
              </div>

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
                  {aluno.responsavel.nome}
                </p>
              </div>

              <div className="rounded-2xl bg-muted p-4">
                <p className="text-xs font-medium uppercase tracking-[0.16em] text-muted-foreground">
                  Telefone
                </p>
                <p className="mt-1 font-medium text-foreground">
                  {aluno.responsavel.telefone}
                </p>
              </div>

              <div className="rounded-2xl bg-muted p-4">
                <p className="text-xs font-medium uppercase tracking-[0.16em] text-muted-foreground">
                  E-mail
                </p>
                <p className="mt-1 font-medium text-foreground">
                  {aluno.responsavel.email || "Não informado"}
                </p>
              </div>

              <div className="rounded-2xl bg-muted p-4">
                <p className="text-xs font-medium uppercase tracking-[0.16em] text-muted-foreground">
                  Endereço
                </p>
                <p className="mt-1 text-sm leading-6 text-foreground">
                  {aluno.responsavel.endereco || "Não informado"}
                </p>
              </div>
            </div>
          </section>

          <section className="rounded-3xl border border-border bg-card p-6 shadow-sm">
            <div className="mb-5 flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-muted">
                <GraduationCap size={19} />
              </div>

              <div>
                <h2 className="font-semibold text-foreground">Matrículas</h2>
                <p className="text-sm text-muted-foreground">
                  Histórico de vínculo escolar
                </p>
              </div>
            </div>

            {aluno.matriculas.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                Nenhuma matrícula encontrada.
              </p>
            ) : (
              <div className="space-y-3">
                {aluno.matriculas.map((matricula) => (
                  <div
                    key={matricula.id}
                    className="rounded-2xl bg-muted p-4"
                  >
                    <div className="flex items-center justify-between gap-3">
                      <p className="font-medium text-foreground">
                        Ano letivo {matricula.anoLetivo}
                      </p>

                      <span className="rounded-full bg-background px-3 py-1 text-xs font-semibold text-muted-foreground">
                        {getStatusLabel(matricula.status)}
                      </span>
                    </div>

                    <p className="mt-2 text-sm text-muted-foreground">
                      Matrícula em {formatDate(matricula.dataMatricula)}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </section>

          <section className="rounded-3xl border border-border bg-card p-6 shadow-sm">
            <div className="mb-5 flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-muted">
                <CreditCard size={19} />
              </div>

              <div>
                <h2 className="font-semibold text-foreground">Financeiro</h2>
                <p className="text-sm text-muted-foreground">
                  Pendências financeiras vinculadas ao aluno
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

                    <p className="mt-2 text-sm text-muted-foreground">
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
              <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-muted">
                <FileText size={19} />
              </div>

              <div>
                <h2 className="font-semibold text-foreground">Documentos</h2>
                <p className="text-sm text-muted-foreground">
                  Pendências documentais do aluno
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

                    <p className="mt-2 text-sm text-muted-foreground">
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
              <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-muted">
                <Mail size={19} />
              </div>

              <div>
                <h2 className="font-semibold text-foreground">Comunicação</h2>
                <p className="text-sm text-muted-foreground">
                  Comunicados e contatos com a família
                </p>
              </div>
            </div>

            {tarefasComunicacao.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                Nenhum comunicado vinculado ao aluno.
              </p>
            ) : (
              <div className="space-y-3">
                {tarefasComunicacao.map((tarefa) => (
                  <div key={tarefa.id} className="rounded-2xl bg-muted p-4">
                    <p className="font-medium text-foreground">
                      {tarefa.titulo}
                    </p>

                    <p className="mt-2 text-sm text-muted-foreground">
                      {getStatusLabel(tarefa.status)}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </section>

          <section className="rounded-3xl border border-border bg-card p-6 shadow-sm">
            <div className="mb-5 flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-muted">
                <CalendarDays size={19} />
              </div>

              <div>
                <h2 className="font-semibold text-foreground">
                  Histórico Pulse
                </h2>
                <p className="text-sm text-muted-foreground">
                  Últimas tarefas relacionadas ao aluno
                </p>
              </div>
            </div>

            {aluno.tarefas.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                Nenhuma tarefa no Pulse vinculada a este aluno.
              </p>
            ) : (
              <div className="space-y-3">
                {aluno.tarefas.slice(0, 6).map((tarefa) => (
                  <div key={tarefa.id} className="rounded-2xl bg-muted p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="font-medium text-foreground">
                          {tarefa.titulo}
                        </p>

                        <p className="mt-1 text-sm text-muted-foreground">
                          {tarefa.setor} · {getStatusLabel(tarefa.status)}
                        </p>
                      </div>

                      <span className="rounded-full bg-background px-3 py-1 text-xs font-semibold text-muted-foreground">
                        {getPrioridadeLabel(tarefa.prioridade)}
                      </span>
                    </div>
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