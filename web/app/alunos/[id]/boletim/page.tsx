import AppLayout from "@/components/layout/AppLayout";
import { requireAdmin, resolveAuthSchoolId } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getBoletimAluno } from "@/lib/boletim";
import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import BoletimTable from "@/components/boletim/BoletimTable";
import PrintButton from "@/components/ui/PrintButton";

export const dynamic = "force-dynamic";

const ANO_ATUAL = new Date().getFullYear();

export default async function BoletimAlunoPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const auth = await requireAdmin("GERENCIAR_ALUNOS");
  const escolaId = await resolveAuthSchoolId(auth);
  const { id } = await params;

  const aluno = await prisma.aluno.findFirst({
    where: { id, escolaId },
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
    escolaId,
    alunoId: id,
    anoLetivo: ANO_ATUAL,
  });

  return (
    <AppLayout>
      <div className="mb-6 flex items-center justify-between print:hidden">
        <Link
          href={`/alunos/${id}`}
          className="inline-flex items-center gap-2 text-sm font-medium text-muted-foreground transition hover:text-foreground"
        >
          <ArrowLeft size={16} />
          Voltar para o aluno
        </Link>

        <PrintButton />
      </div>

      <BoletimTable
        alunoNome={aluno.nome}
        turmaNome={aluno.turma?.nome ?? null}
        escolaNome={aluno.escola.nome}
        anoLetivo={ANO_ATUAL}
        linhas={linhas}
      />
    </AppLayout>
  );
}
