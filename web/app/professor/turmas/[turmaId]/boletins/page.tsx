import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { notFound } from "next/navigation";
import { requireProfessor } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export default async function ProfessorBoletinsPage({
  params,
}: {
  params: Promise<{ turmaId: string }>;
}) {
  const auth = await requireProfessor();
  const { turmaId } = await params;

  const atribuicao = await prisma.atribuicaoProfessor.findFirst({
    where: { escolaId: auth.escolaId, usuarioId: auth.usuarioId, turmaId },
    include: { turma: true },
  });

  if (!atribuicao) {
    notFound();
  }

  const alunos = await prisma.aluno.findMany({
    where: { escolaId: auth.escolaId, turmaId },
    select: { id: true, nome: true, fotoUrl: true },
    orderBy: { nome: "asc" },
  });

  return (
    <main className="mx-auto w-full max-w-md space-y-6 px-4 pt-4 sm:px-6">
      <Link
        href={`/professor/turmas/${turmaId}`}
        className="inline-flex items-center gap-1 text-[14px] font-medium text-primary"
      >
        <ChevronLeft size={18} />
        {atribuicao.turma.nome}
      </Link>

      <header>
        <h1 className="text-[19px] font-semibold tracking-tight text-foreground">
          Boletins
        </h1>
        <p className="mt-1 text-[12px] text-[#8e8e93]">
          Consulte o boletim completo de cada aluno da turma.
        </p>
      </header>

      <div className="overflow-hidden rounded-[22px] bg-white shadow-[0_1px_2px_rgba(0,0,0,0.04),0_1px_8px_rgba(0,0,0,0.04)]">
        {alunos.length === 0 ? (
          <p className="p-5 text-sm text-[#8e8e93]">
            Nenhum aluno nesta turma.
          </p>
        ) : (
          alunos.map((aluno, index) => (
            <Link
              key={aluno.id}
              href={`/professor/turmas/${turmaId}/boletins/${aluno.id}`}
              className={`flex items-center gap-3 px-4 py-3 transition active:bg-black/[0.03] ${
                index > 0 ? "border-t border-black/5" : ""
              }`}
            >
              {aluno.fotoUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={aluno.fotoUrl}
                  alt={aluno.nome}
                  className="h-9 w-9 rounded-full object-cover"
                />
              ) : (
                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary">
                  {aluno.nome.slice(0, 1).toUpperCase()}
                </div>
              )}
              <span className="min-w-0 flex-1 truncate text-[13px] text-foreground">
                {aluno.nome}
              </span>
              <ChevronRight size={18} className="shrink-0 text-[#c7c7cc]" />
            </Link>
          ))
        )}
      </div>
    </main>
  );
}
