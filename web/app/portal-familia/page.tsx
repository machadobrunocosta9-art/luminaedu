import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { requireFamily } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

function getSaudacao() {
  const hora = new Date().getHours();
  if (hora < 12) return "Bom dia";
  if (hora < 18) return "Boa tarde";
  return "Boa noite";
}

export default async function FamilyPortalPage() {
  const auth = await requireFamily();
  const primeiroNome = auth.nome.split(" ")[0];

  const children = await prisma.aluno.findMany({
    where: {
      escolaId: auth.escolaId,
      responsavelId: auth.responsavelId,
    },
    select: {
      id: true,
      nome: true,
      fotoUrl: true,
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
    <main className="mx-auto w-full max-w-md space-y-6 px-4 pt-6 sm:px-6">
      <header>
        <p className="text-[13px] font-medium uppercase tracking-wide text-[#8e8e93]">
          {getSaudacao()}
        </p>
        <h1 className="mt-0.5 text-[28px] font-semibold tracking-tight text-foreground">
          {primeiroNome}
        </h1>
      </header>

      <section className="space-y-3">
        {children.length === 0 ? (
          <div className="rounded-[22px] bg-white p-6 text-center text-sm text-[#8e8e93] shadow-[0_1px_2px_rgba(0,0,0,0.04),0_1px_8px_rgba(0,0,0,0.04)]">
            Nenhum aluno está vinculado a esta conta. Entre em contato com a
            escola.
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
            const totalPendencias =
              pendingDocuments + pendingComunicados + pendingOcorrencias;

            const iniciais = student.nome
              .split(" ")
              .slice(0, 2)
              .map((parte) => parte[0])
              .join("")
              .toUpperCase();

            return (
              <Link
                key={student.id}
                href={`/portal-familia/filhos/${student.id}`}
                className="flex items-center gap-3.5 rounded-[22px] bg-white p-4 shadow-[0_1px_2px_rgba(0,0,0,0.04),0_1px_8px_rgba(0,0,0,0.04)] transition active:scale-[0.98] active:bg-black/[0.02]"
              >
                {student.fotoUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={student.fotoUrl}
                    alt={student.nome}
                    className="h-14 w-14 shrink-0 rounded-full object-cover"
                  />
                ) : (
                  <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-primary/10 text-base font-semibold text-primary">
                    {iniciais}
                  </div>
                )}

                <div className="min-w-0 flex-1">
                  <h2 className="truncate text-[17px] font-semibold text-foreground">
                    {student.nome}
                  </h2>
                  <p className="mt-0.5 text-[13px] text-[#8e8e93]">
                    {student.turma?.nome ?? "Turma ainda não definida"}
                  </p>

                  {totalPendencias > 0 ? (
                    <span className="mt-1.5 inline-flex items-center gap-1 text-[12px] font-medium text-primary">
                      <span className="h-1.5 w-1.5 rounded-full bg-primary" />
                      {totalPendencias} pendência(s)
                    </span>
                  ) : (
                    <span className="mt-1.5 inline-flex items-center gap-1 text-[12px] font-medium text-emerald-600">
                      <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                      Tudo em dia
                    </span>
                  )}
                </div>

                <ChevronRight size={18} className="shrink-0 text-[#c7c7cc]" />
              </Link>
            );
          })
        )}
      </section>
    </main>
  );
}
