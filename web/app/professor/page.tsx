import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { requireProfessor } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

function getSaudacao() {
  const hora = new Date().getHours();
  if (hora < 12) return "Bom dia";
  if (hora < 18) return "Boa tarde";
  return "Boa noite";
}

export default async function ProfessorHomePage() {
  const auth = await requireProfessor();
  const primeiroNome = auth.nome.split(" ")[0];

  const atribuicoes = await prisma.atribuicaoProfessor.findMany({
    where: { escolaId: auth.escolaId, usuarioId: auth.usuarioId },
    include: {
      turma: {
        include: { _count: { select: { alunos: true } } },
      },
      disciplina: true,
    },
    orderBy: { turma: { nome: "asc" } },
  });

  const turmasMap = new Map<
    string,
    {
      id: string;
      nome: string;
      segmento: string;
      totalAlunos: number;
      disciplinas: string[];
    }
  >();

  for (const atribuicao of atribuicoes) {
    const existente = turmasMap.get(atribuicao.turma.id);

    if (existente) {
      existente.disciplinas.push(atribuicao.disciplina.nome);
    } else {
      turmasMap.set(atribuicao.turma.id, {
        id: atribuicao.turma.id,
        nome: atribuicao.turma.nome,
        segmento: atribuicao.turma.segmento,
        totalAlunos: atribuicao.turma._count.alunos,
        disciplinas: [atribuicao.disciplina.nome],
      });
    }
  }

  const turmas = Array.from(turmasMap.values());

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
        {turmas.length === 0 ? (
          <div className="rounded-[22px] bg-white p-6 text-center text-sm text-[#8e8e93] shadow-[0_1px_2px_rgba(0,0,0,0.04),0_1px_8px_rgba(0,0,0,0.04)]">
            Nenhuma turma atribuída ainda. Fale com a secretaria da escola.
          </div>
        ) : (
          turmas.map((turma) => (
            <Link
              key={turma.id}
              href={`/professor/turmas/${turma.id}`}
              className="flex items-center gap-3.5 rounded-[22px] bg-white p-4 shadow-[0_1px_2px_rgba(0,0,0,0.04),0_1px_8px_rgba(0,0,0,0.04)] transition active:scale-[0.98] active:bg-black/[0.02]"
            >
              <div className="min-w-0 flex-1">
                <h2 className="truncate text-[17px] font-semibold text-foreground">
                  {turma.nome}
                </h2>
                <p className="mt-0.5 text-[13px] text-[#8e8e93]">
                  {turma.segmento} · {turma.totalAlunos} aluno(s)
                </p>
                <p className="mt-1.5 text-[12px] text-primary">
                  {turma.disciplinas.join(", ")}
                </p>
              </div>

              <ChevronRight size={18} className="shrink-0 text-[#c7c7cc]" />
            </Link>
          ))
        )}
      </section>
    </main>
  );
}
