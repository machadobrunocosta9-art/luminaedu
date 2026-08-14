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

  const studentIds = children.map((student) => student.id);

  const [pendingComunicadosGroups, pendingOcorrenciasGroups] =
    studentIds.length === 0
      ? [[], []]
      : await Promise.all([
          prisma.destinatarioComunicado.groupBy({
            by: ["alunoId"],
            where: {
              escolaId: auth.escolaId,
              responsavelId: auth.responsavelId,
              alunoId: { in: studentIds },
              status: { not: "RESPONDIDO" },
              comunicado: { status: "ENVIADO" },
            },
            _count: { _all: true },
          }),
          prisma.ocorrenciaAluno.groupBy({
            by: ["alunoId"],
            where: {
              escolaId: auth.escolaId,
              alunoId: { in: studentIds },
              enviarParaResponsavel: true,
              cienciaConfirmada: false,
            },
            _count: { _all: true },
          }),
        ]);

  const pendingComunicadosByAluno = new Map(
    pendingComunicadosGroups.map((group) => [group.alunoId, group._count._all]),
  );
  const pendingOcorrenciasByAluno = new Map(
    pendingOcorrenciasGroups.map((group) => [group.alunoId, group._count._all]),
  );

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
            const pendingComunicados =
              pendingComunicadosByAluno.get(student.id) ?? 0;
            const pendingOcorrencias =
              pendingOcorrenciasByAluno.get(student.id) ?? 0;

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
                  {pendingComunicados > 0 && (
                    <span className="rounded-full bg-primary/10 px-3 py-1 font-medium text-primary">
                      {pendingComunicados} comunicado(s) aguardando resposta
                    </span>
                  )}
                  {pendingOcorrencias > 0 && (
                    <span className="rounded-full bg-primary/10 px-3 py-1 font-medium text-primary">
                      {pendingOcorrencias} aviso(s) aguardando ciência
                    </span>
                  )}
                </div>
              </Link>
            );
          })
        )}
      </section>
    </main>
  );
}
