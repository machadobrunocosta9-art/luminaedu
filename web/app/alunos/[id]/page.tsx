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
  Mail,
  NotebookText,
  ShieldAlert,
  UserRound,
  UsersRound,
} from "lucide-react";

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
          <AlertTriangle size={22} />
          <p className="mt-4 text-sm text-muted-foreground">Suspensões</p>
          <p className="mt-1 text-3xl font-semibold text-foreground">
            {suspensoes.length}
          </p>
        </div>

        <div className="rounded-3xl border border-border bg-card p-5 shadow-sm">
          <CheckCircle2 size={22} />
          <p className="mt-4 text-sm text-muted-foreground">Pulse aberto</p>
          <p className="mt-1 text-3xl font-semibold text-foreground">
            {tarefasAbertas.length}
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