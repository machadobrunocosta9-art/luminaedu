import { requireFamily } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getBoletimAluno } from "@/lib/boletim";
import { notFound } from "next/navigation";
import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import BoletimTable from "@/components/boletim/BoletimTable";
import PrintButton from "@/components/ui/PrintButton";

export const dynamic = "force-dynamic";

const ANO_ATUAL = new Date().getFullYear();

export default async function FamilyBoletimPage({
  params,
}: {
  params: Promise<{ alunoId: string }>;
}) {
  const auth = await requireFamily();
  const { alunoId } = await params;

  const aluno = await prisma.aluno.findFirst({
    where: {
      id: alunoId,
      escolaId: auth.escolaId,
      responsavelId: auth.responsavelId,
    },
    select: {
      nome: true,
      turma: { select: { nome: true } },
      escola: { select: { nome: true } },
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
          href={`/portal-familia/filhos/${alunoId}`}
          className="inline-flex items-center gap-1 text-[15px] font-medium text-primary"
        >
          <ChevronLeft size={18} />
          {aluno.nome}
        </Link>

        <PrintButton
          label="Imprimir"
          className="inline-flex items-center gap-2 rounded-xl bg-white px-4 py-2 text-[13px] font-semibold text-foreground shadow-[0_1px_2px_rgba(0,0,0,0.04),0_1px_8px_rgba(0,0,0,0.04)]"
        />
      </div>

      <BoletimTable
        alunoNome={aluno.nome}
        turmaNome={aluno.turma?.nome ?? null}
        escolaNome={aluno.escola.nome}
        anoLetivo={ANO_ATUAL}
        linhas={linhas}
      />
    </main>
  );
}
