import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { notFound } from "next/navigation";
import { requireProfessor } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getBoletimAluno } from "@/lib/boletim";
import BoletimTable from "@/components/boletim/BoletimTable";
import PrintButton from "@/components/ui/PrintButton";

export const dynamic = "force-dynamic";

const ANO_ATUAL = new Date().getFullYear();

export default async function ProfessorBoletimPage({
  params,
}: {
  params: Promise<{ turmaId: string; alunoId: string }>;
}) {
  const auth = await requireProfessor();
  const { turmaId, alunoId } = await params;

  const atribuicao = await prisma.atribuicaoProfessor.findFirst({
    where: { escolaId: auth.escolaId, usuarioId: auth.usuarioId, turmaId },
    select: { id: true },
  });

  if (!atribuicao) {
    notFound();
  }

  const aluno = await prisma.aluno.findFirst({
    where: { id: alunoId, escolaId: auth.escolaId, turmaId },
    select: {
      nome: true,
      turma: { select: { nome: true } },
      escola: { select: { nome: true, logoUrl: true } },
    },
  });

  if (!aluno) {
    notFound();
  }

  const linhas = await getBoletimAluno({
    escolaId: auth.escolaId,
    alunoId,
    anoLetivo: ANO_ATUAL,
  });

  return (
    <main className="mx-auto w-full max-w-md space-y-5 px-4 pt-4 sm:px-6 print:max-w-full">
      <div className="flex items-center justify-between print:hidden">
        <Link
          href={`/professor/turmas/${turmaId}/boletins`}
          className="inline-flex items-center gap-1 text-[14px] font-medium text-primary"
        >
          <ChevronLeft size={18} />
          Boletins
        </Link>

        <PrintButton
          label="Imprimir"
          className="inline-flex items-center gap-2 rounded-xl bg-white px-4 py-2 text-[12px] font-semibold text-foreground shadow-[0_1px_2px_rgba(0,0,0,0.04),0_1px_8px_rgba(0,0,0,0.04)]"
        />
      </div>

      <BoletimTable
        alunoNome={aluno.nome}
        turmaNome={aluno.turma?.nome ?? null}
        escolaNome={aluno.escola.nome}
        escolaLogoUrl={aluno.escola.logoUrl}
        anoLetivo={ANO_ATUAL}
        linhas={linhas}
      />
    </main>
  );
}
