import Link from "next/link";
import { notFound } from "next/navigation";
import { requireFamily } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export default async function FamilyStudentPage({
  params,
}: {
  params: Promise<{ alunoId: string }>;
}) {
  const auth = await requireFamily();
  const { alunoId } = await params;
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
    },
    select: {
      id: true,
      status: true,
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
        <h2 className="text-xl font-semibold">Comunicados</h2>
        <div className="mt-4 space-y-3">
          {communications.length === 0 ? (
            <p className="rounded-2xl border bg-white p-5 text-sm text-muted-foreground">
              Nenhum comunicado vinculado a este aluno.
            </p>
          ) : (
            communications.map((recipient) => (
              <article key={recipient.id} className="rounded-2xl border bg-white p-5">
                <h3 className="font-semibold">{recipient.comunicado.titulo}</h3>
                <p className="mt-2 whitespace-pre-line text-sm text-muted-foreground">
                  {recipient.comunicado.conteudo}
                </p>
                <p className="mt-3 text-xs text-muted-foreground">
                  {recipient.comunicado.tipo} · {recipient.status}
                </p>
              </article>
            ))
          )}
        </div>
      </section>
    </main>
  );
}
