import Link from "next/link";
import { requireFamily } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export default async function FamilyPortalPage() {
  const auth = await requireFamily();
  const children = await prisma.aluno.findMany({
    where: {
      escolaId: auth.escolaId,
      responsavelId: auth.responsavelId,
    },
    select: {
      id: true,
      nome: true,
      turma: { select: { nome: true } },
      matriculas: {
        select: {
          anoLetivo: true,
          status: true,
          documentos: {
            select: { status: true, obrigatorio: true },
          },
        },
        orderBy: { anoLetivo: "desc" },
        take: 1,
      },
    },
    orderBy: { nome: "asc" },
  });

  return (
    <main className="mx-auto w-full max-w-6xl p-4 sm:p-6">
      <p className="text-sm font-medium text-primary">Visão da família</p>
      <h1 className="mt-1 text-3xl font-semibold tracking-tight">
        Seus filhos
      </h1>
      <p className="mt-2 text-muted-foreground">
        Matrículas, documentos, pendências e comunicados vinculados à sua conta.
      </p>

      <section className="mt-6 grid gap-4 md:grid-cols-2">
        {children.length === 0 ? (
          <div className="rounded-2xl border bg-white p-5 text-sm text-muted-foreground">
            Nenhum aluno está vinculado a esta conta. Entre em contato com a escola.
          </div>
        ) : (
          children.map((student) => {
            const enrollment = student.matriculas[0];
            const pendingDocuments =
              enrollment?.documentos.filter(
                (document) =>
                  document.obrigatorio &&
                  !["APROVADO", "CANCELADO"].includes(document.status),
              ).length ?? 0;

            return (
              <Link
                key={student.id}
                href={`/portal-familia/filhos/${student.id}`}
                className="rounded-2xl border bg-white p-5 shadow-sm transition hover:border-primary/30 hover:shadow-md"
              >
                <h2 className="text-xl font-semibold">{student.nome}</h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  {student.turma?.nome ?? "Turma ainda não definida"}
                </p>
                <div className="mt-4 flex flex-wrap gap-2 text-xs">
                  <span className="rounded-full bg-secondary px-3 py-1">
                    Matrícula: {enrollment?.status ?? "não iniciada"}
                  </span>
                  <span className="rounded-full bg-muted px-3 py-1">
                    {pendingDocuments} pendência(s) documental(is)
                  </span>
                </div>
              </Link>
            );
          })
        )}
      </section>
    </main>
  );
}
