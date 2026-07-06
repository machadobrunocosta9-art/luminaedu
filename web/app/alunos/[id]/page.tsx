import AppLayout from "@/components/layout/AppLayout";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
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

  const relatorios = alunoEncontrado.ocorrencias.filter(
    (ocorrencia) => ocorrencia.tipo === "RELATORIO",
  );

  const enviosPreparados = alunoEncontrado.ocorrencias.filter(
    (ocorrencia) =>
      ocorrencia.enviarParaResponsavel && !ocorrencia.enviadoPorEmail,
  );

  const enviosRealizados = alunoEncontrado.ocorrencias.filter(
    (ocorrencia) => ocorrencia.enviadoPorEmail,
  );

  const ultimaMatricula = alunoEncontrado.matriculas[0];

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
          <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-2xl bg-muted text-foreground">
            <ClipboardList size={20} />
          </div>

          <p className="text-sm text-muted-foreground">Ocorrências</p>
          <p className="mt-1 text-3xl font-semibold text-foreground">
            {alunoEncontrado.ocorrencias.length}
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

      <section className="mb-8 rounded-3xl border border-border bg-card p-6 shadow-sm">
        <div className="mb-5">
          <h2 className="font-semibold text-foreground">Ações rápidas</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Registre rapidamente os principais documentos do prontuário.
          </p>
        </div>

        <div className="grid gap-3 md:grid-cols-5">
          <Link
            href={`/alunos/${alunoEncontrado.id}/ocorrencias/novo?tipo=ADVERTENCIA`}
            className="rounded-2xl border border-border bg-background p-4 transition hover:-translate-y-0.5 hover:shadow-md"
          >
            <ShieldAlert size={22} className="mb-3 text-foreground" />
            <p className="font-semibold text-foreground">Nova advertência</p>
            <p className="mt-1 text-xs leading-5 text-muted-foreground">
              Registro formal para o responsável.
            </p>
          </Link>

          <Link
            href={`/alunos/${alunoEncontrado.id}/ocorrencias/novo?tipo=SUSPENSAO`}
            className="rounded-2xl border border-border bg-background p-4 transition hover:-translate-y-0.5 hover:shadow-md"
          >
            <AlertTriangle size={22} className="mb-3 text-foreground" />
            <p className="font-semibold text-foreground">Nova suspensão</p>
            <p className="mt-1 text-xs leading-5 text-muted-foreground">
              Inclui período e motivo.
            </p>
          </Link>

          <Link
            href={`/alunos/${alunoEncontrado.id}/ocorrencias/novo?tipo=RELATORIO`}
            className="rounded-2xl border border-border bg-background p-4 transition hover:-translate-y-0.5 hover:shadow-md"
          >
            <NotebookText size={22} className="mb-3 text-foreground" />
            <p className="font-semibold text-foreground">Novo relatório</p>
            <p className="mt-1 text-xs leading-5 text-muted-foreground">
              Relatório pedagógico ou comportamental.
            </p>
          </Link>

          <Link
            href={`/alunos/${alunoEncontrado.id}/ocorrencias/novo?tipo=ATENDIMENTO`}
            className="rounded-2xl border border-border bg-background p-4 transition hover:-translate-y-0.5 hover:shadow-md"
          >
            <UsersRound size={22} className="mb-3 text-foreground" />
            <p className="font-semibold text-foreground">Atendimento</p>
            <p className="mt-1 text-xs leading-5 text-muted-foreground">
              Registro de conversa ou orientação.
            </p>
          </Link>

          <Link
            href={`/alunos/${alunoEncontrado.id}/ocorrencias/novo?tipo=OCORRENCIA`}
            className="rounded-2xl border border-border bg-background p-4 transition hover:-translate-y-0.5 hover:shadow-md"
          >
            <ClipboardList size={22} className="mb-3 text-foreground" />
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

              <div className="rounded-2xl bg-muted p-4">
                <p className="text-xs font-medium uppercase tracking-[0.16em] text-muted-foreground">
                  CPF
                </p>
                <p className="mt-1 font-medium text-foreground">
                  {alunoEncontrado.cpf || "Não informado"}
                </p>
              </div>

              <div className="rounded-2xl bg-muted p-4">
                <p className="text-xs font-medium uppercase tracking-[0.16em] text-muted-foreground">
                  Certidão
                </p>
                <p className="mt-1 font-medium text-foreground">
                  {alunoEncontrado.certidaoNascimento || "Não informado"}
                </p>
              </div>
            </div>

            <div className="mt-4 rounded-2xl bg-muted p-4">
              <p className="text-xs font-medium uppercase tracking-[0.16em] text-muted-foreground">
                Alergias
              </p>
              <p className="mt-1 text-sm leading-6 text-foreground">
                {alunoEncontrado.alergias || "Nenhuma alergia informada."}
              </p>
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
            <div className="mb-5 flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
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

              <Link
                href={`/alunos/${alunoEncontrado.id}/ocorrencias/novo`}
                className="hidden rounded-2xl border border-border px-4 py-2 text-sm font-semibold text-foreground transition hover:bg-muted md:inline-flex"
              >
                Novo registro
              </Link>
            </div>

            {alunoEncontrado.ocorrencias.length === 0 ? (
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
                {alunoEncontrado.ocorrencias.map((ocorrencia) => (
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

              <div className="rounded-2xl bg-muted p-4">
                <p className="text-xs font-medium uppercase tracking-[0.16em] text-muted-foreground">
                  Endereço
                </p>
                <p className="mt-1 text-sm leading-6 text-foreground">
                  {alunoEncontrado.responsavel.endereco || "Não informado"}
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

            {alunoEncontrado.matriculas.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                Nenhuma matrícula encontrada.
              </p>
            ) : (
              <div className="space-y-3">
                {alunoEncontrado.matriculas.map((matricula) => (
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
                <h2 className="font-semibold text-foreground">
                  Comunicação com responsável
                </h2>
                <p className="text-sm text-muted-foreground">
                  Envios preparados, comunicados e histórico com a família
                </p>
              </div>
            </div>

            {enviosPreparados.length === 0 && enviosRealizados.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                Nenhum envio preparado para o responsável.
              </p>
            ) : (
              <div className="space-y-4">
                {enviosPreparados.length > 0 && (
                  <div>
                    <p className="mb-3 text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                      Preparados para envio
                    </p>

                    <div className="space-y-3">
                      {enviosPreparados.map((ocorrencia) => (
                        <div
                          key={ocorrencia.id}
                          className="rounded-2xl border border-border bg-background p-4"
                        >
                          <div className="mb-3 flex flex-wrap items-center gap-2">
                            <span className="rounded-full bg-muted px-3 py-1 text-xs font-semibold text-foreground">
                              {getTipoLabel(ocorrencia.tipo)}
                            </span>

                            <span className="rounded-full bg-muted px-3 py-1 text-xs font-semibold text-muted-foreground">
                              Preparado
                            </span>
                          </div>

                          <p className="font-medium text-foreground">
                            {ocorrencia.titulo}
                          </p>

                          <p className="mt-2 text-sm text-muted-foreground">
                            E-mail:{" "}
                            {ocorrencia.emailResponsavel ||
                              alunoEncontrado.responsavel.email ||
                              "Não informado"}
                          </p>

                          {ocorrencia.textoFinal && (
                            <details className="mt-3">
                              <summary className="cursor-pointer text-sm font-semibold text-foreground">
                                Ver texto
                              </summary>

                              <div className="mt-3 rounded-2xl bg-muted p-4">
                                <p className="whitespace-pre-line text-sm leading-6 text-foreground">
                                  {ocorrencia.textoFinal}
                                </p>
                              </div>
                            </details>
                          )}

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
                              Marcar como enviado
                            </button>
                          </form>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {enviosRealizados.length > 0 && (
                  <div>
                    <p className="mb-3 text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                      Envios realizados
                    </p>

                    <div className="space-y-3">
                      {enviosRealizados.slice(0, 4).map((ocorrencia) => (
                        <div
                          key={ocorrencia.id}
                          className="rounded-2xl bg-muted p-4"
                        >
                          <div className="flex items-start justify-between gap-3">
                            <div>
                              <p className="font-medium text-foreground">
                                {ocorrencia.titulo}
                              </p>

                              <p className="mt-1 text-sm text-muted-foreground">
                                {getTipoLabel(ocorrencia.tipo)} · Enviado
                              </p>
                            </div>

                            <span className="rounded-full bg-background px-3 py-1 text-xs font-semibold text-muted-foreground">
                              OK
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
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

            {alunoEncontrado.tarefas.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                Nenhuma tarefa no Pulse vinculada a este aluno.
              </p>
            ) : (
              <div className="space-y-3">
                {alunoEncontrado.tarefas.slice(0, 6).map((tarefa) => (
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