import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { requireFamily } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { confirmarCienciaOcorrencia } from "@/lib/ocorrencias";

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

export default async function FamilyStudentPage({
  params,
  searchParams,
}: {
  params: Promise<{ alunoId: string }>;
  searchParams?: Promise<{ erro?: string }>;
}) {
  const auth = await requireFamily();
  const { alunoId } = await params;
  const query = searchParams ? await searchParams : {};
  const student = await prisma.aluno.findFirst({
    where: {
      id: alunoId,
      escolaId: auth.escolaId,
      responsavelId: auth.responsavelId,
    },
    select: {
      id: true,
      nome: true,
      dataNascimento: true,
      turma: {
        select: { nome: true, segmento: true, turno: true },
      },
      matriculas: {
        select: {
          id: true,
          anoLetivo: true,
          status: true,
          dataMatricula: true,
          documentos: {
            select: {
              id: true,
              titulo: true,
              status: true,
              obrigatorio: true,
              motivoRejeicao: true,
              nomeArquivoOriginal: true,
              chaveArmazenamento: true,
            },
            orderBy: [{ ordemExibicao: "asc" }, { criadoEm: "asc" }],
          },
        },
        orderBy: { anoLetivo: "desc" },
      },
    },
  });

  if (!student) {
    notFound();
  }

  const communications = await prisma.destinatarioComunicado.findMany({
    where: {
      escolaId: auth.escolaId,
      responsavelId: auth.responsavelId,
      alunoId: student.id,
      comunicado: { status: "ENVIADO" },
    },
    select: {
      id: true,
      status: true,
      respostas: { select: { id: true } },
      comunicado: {
        select: {
          titulo: true,
          conteudo: true,
          tipo: true,
          enviadoEm: true,
        },
      },
    },
    orderBy: { criadoEm: "desc" },
    take: 20,
  });

  const ocorrencias = await prisma.ocorrenciaAluno.findMany({
    where: {
      escolaId: auth.escolaId,
      alunoId: student.id,
      enviarParaResponsavel: true,
    },
    orderBy: { criadoEm: "desc" },
    take: 20,
  });

  async function confirmarCienciaFamilia(formData: FormData) {
    "use server";

    const authFamilia = await requireFamily();
    const ocorrenciaId = String(formData.get("ocorrenciaId") || "");
    const nomeConfirmante = String(
      formData.get("nomeConfirmante") || "",
    ).trim();
    const parentescoConfirmante = String(
      formData.get("parentescoConfirmante") || "",
    ).trim();
    const observacaoCiencia = String(
      formData.get("observacaoCiencia") || "",
    ).trim();

    if (!ocorrenciaId) {
      throw new Error("Registro inválido.");
    }

    if (!nomeConfirmante || !parentescoConfirmante) {
      redirect(`/portal-familia/filhos/${alunoId}?erro=dados#ocorrencia-${ocorrenciaId}`);
    }

    const ocorrencia = await prisma.ocorrenciaAluno.findFirst({
      where: {
        id: ocorrenciaId,
        escolaId: authFamilia.escolaId,
        aluno: { responsavelId: authFamilia.responsavelId },
      },
      select: { id: true },
    });

    if (!ocorrencia) {
      throw new Error("Registro não encontrado para este responsável.");
    }

    await confirmarCienciaOcorrencia({
      ocorrenciaId: ocorrencia.id,
      nomeConfirmante,
      parentescoConfirmante,
      observacaoCiencia: observacaoCiencia || null,
    });

    revalidatePath(`/portal-familia/filhos/${alunoId}`);
    revalidatePath(`/alunos/${alunoId}`);

    redirect(`/portal-familia/filhos/${alunoId}?sucesso=1#ocorrencia-${ocorrenciaId}`);
  }

  return (
    <main className="mx-auto w-full max-w-5xl space-y-6 p-4 sm:p-6">
      <Link href="/portal-familia" className="text-sm font-medium text-primary">
        ← Voltar
      </Link>
      <header>
        <h1 className="text-3xl font-semibold tracking-tight">{student.nome}</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          {student.turma
            ? `${student.turma.nome} · ${student.turma.segmento} · ${student.turma.turno}`
            : "Turma ainda não definida"}
        </p>
      </header>

      <section className="space-y-4">
        <h2 className="text-xl font-semibold">Matrículas e documentos</h2>
        {student.matriculas.length === 0 ? (
          <p className="rounded-2xl border bg-white p-5 text-sm text-muted-foreground">
            Nenhuma matrícula disponível.
          </p>
        ) : (
          student.matriculas.map((enrollment) => (
            <article key={enrollment.id} className="rounded-2xl border bg-white p-5">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <h3 className="font-semibold">Ano letivo {enrollment.anoLetivo}</h3>
                <span className="rounded-full bg-secondary px-3 py-1 text-xs">
                  {enrollment.status}
                </span>
              </div>
              <div className="mt-4 divide-y">
                {enrollment.documentos.length === 0 ? (
                  <p className="py-3 text-sm text-muted-foreground">
                    Nenhum documento solicitado.
                  </p>
                ) : (
                  enrollment.documentos.map((document) => (
                    <div
                      key={document.id}
                      className="flex flex-col gap-2 py-3 sm:flex-row sm:items-center sm:justify-between"
                    >
                      <div>
                        <p className="text-sm font-medium">{document.titulo}</p>
                        <p className="text-xs text-muted-foreground">
                          {document.status}
                          {document.obrigatorio ? " · obrigatório" : ""}
                        </p>
                        {document.motivoRejeicao ? (
                          <p className="mt-1 text-xs text-red-600">
                            {document.motivoRejeicao}
                          </p>
                        ) : null}
                      </div>
                      {document.chaveArmazenamento ? (
                        <a
                          href={`/api/portal-familia/documentos/${document.id}/arquivo`}
                          className="text-sm font-medium text-primary"
                        >
                          Visualizar
                        </a>
                      ) : null}
                    </div>
                  ))
                )}
              </div>
            </article>
          ))
        )}
      </section>

      <section>
        <div className="flex items-center justify-between gap-4">
          <h2 className="text-xl font-semibold">Comunicados</h2>
          {communications.length > 0 && (
            <Link
              href="/portal-familia/comunicados"
              className="text-sm font-medium text-primary"
            >
              Ver e responder
            </Link>
          )}
        </div>
        <div className="mt-4 space-y-3">
          {communications.length === 0 ? (
            <p className="rounded-2xl border bg-white p-5 text-sm text-muted-foreground">
              Nenhum comunicado vinculado a este aluno.
            </p>
          ) : (
            communications.map((recipient) => (
              <Link
                key={recipient.id}
                href={`/portal-familia/comunicados#dest-${recipient.id}`}
                className="block rounded-2xl border bg-white p-5 transition hover:border-primary/30"
              >
                <h3 className="font-semibold">{recipient.comunicado.titulo}</h3>
                <p className="mt-2 whitespace-pre-line text-sm text-muted-foreground">
                  {recipient.comunicado.conteudo}
                </p>
                <p className="mt-3 text-xs text-muted-foreground">
                  {recipient.comunicado.tipo} ·{" "}
                  {recipient.status === "RESPONDIDO" ||
                  recipient.respostas.length > 0
                    ? "Respondido"
                    : "Aguardando sua resposta"}
                </p>
              </Link>
            ))
          )}
        </div>
      </section>

      <section>
        <h2 className="text-xl font-semibold">Prontuário e avisos</h2>
        <div className="mt-4 space-y-3">
          {ocorrencias.length === 0 ? (
            <p className="rounded-2xl border bg-white p-5 text-sm text-muted-foreground">
              Nenhum registro compartilhado com a família até o momento.
            </p>
          ) : (
            ocorrencias.map((ocorrencia) => (
              <article
                key={ocorrencia.id}
                id={`ocorrencia-${ocorrencia.id}`}
                className="rounded-2xl border bg-white p-5"
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <h3 className="font-semibold">{ocorrencia.titulo}</h3>
                  <span className="rounded-full bg-secondary px-3 py-1 text-xs">
                    {getTipoOcorrenciaLabel(ocorrencia.tipo)}
                  </span>
                </div>

                <p className="mt-2 whitespace-pre-line text-sm text-muted-foreground">
                  {ocorrencia.textoFinal || ocorrencia.descricao}
                </p>

                {ocorrencia.cienciaConfirmada ? (
                  <p className="mt-3 text-xs text-muted-foreground">
                    Ciência confirmada por{" "}
                    {ocorrencia.nomeConfirmante || "responsável"}
                    {ocorrencia.dataCiencia
                      ? ` em ${new Intl.DateTimeFormat("pt-BR", {
                          dateStyle: "short",
                          timeStyle: "short",
                        }).format(ocorrencia.dataCiencia)}`
                      : ""}
                    .
                  </p>
                ) : (
                  <details className="mt-4">
                    <summary className="cursor-pointer text-sm font-medium text-primary">
                      Confirmar ciência
                    </summary>

                    {query.erro === "dados" && (
                      <p className="mt-3 rounded-xl border bg-secondary p-3 text-xs">
                        Informe seu nome e parentesco para confirmar.
                      </p>
                    )}

                    <form
                      action={confirmarCienciaFamilia}
                      className="mt-3 space-y-3"
                    >
                      <input
                        type="hidden"
                        name="ocorrenciaId"
                        value={ocorrencia.id}
                      />

                      <div className="grid gap-3 sm:grid-cols-2">
                        <input
                          name="nomeConfirmante"
                          required
                          defaultValue={auth.nome}
                          placeholder="Seu nome"
                          className="h-11 w-full rounded-xl border bg-background px-3 text-sm outline-none focus:border-primary"
                        />
                        <input
                          name="parentescoConfirmante"
                          required
                          placeholder="Parentesco (ex: mãe, pai)"
                          className="h-11 w-full rounded-xl border bg-background px-3 text-sm outline-none focus:border-primary"
                        />
                      </div>

                      <textarea
                        name="observacaoCiencia"
                        rows={2}
                        placeholder="Observação, se desejar"
                        className="w-full resize-none rounded-xl border bg-background px-3 py-2 text-sm outline-none focus:border-primary"
                      />

                      <button
                        type="submit"
                        className="rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground transition hover:opacity-90"
                      >
                        Estou ciente
                      </button>
                    </form>
                  </details>
                )}
              </article>
            ))
          )}
        </div>
      </section>
    </main>
  );
}
