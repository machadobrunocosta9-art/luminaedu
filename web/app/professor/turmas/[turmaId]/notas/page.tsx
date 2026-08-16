import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { notFound, redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { requireProfessor } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

const ANO_ATUAL = new Date().getFullYear();

export default async function ProfessorNotasPage({
  params,
  searchParams,
}: {
  params: Promise<{ turmaId: string }>;
  searchParams?: Promise<{
    disciplinaId?: string;
    bimestre?: string;
    salvo?: string;
  }>;
}) {
  const auth = await requireProfessor();
  const { turmaId } = await params;
  const query = searchParams ? await searchParams : {};

  const atribuicoes = await prisma.atribuicaoProfessor.findMany({
    where: { escolaId: auth.escolaId, usuarioId: auth.usuarioId, turmaId },
    include: { turma: true, disciplina: true },
  });

  if (atribuicoes.length === 0) {
    notFound();
  }

  const turma = atribuicoes[0].turma;
  const disciplinaId = query.disciplinaId || atribuicoes[0].disciplina.id;
  const bimestre = Number(query.bimestre) || 1;

  const disciplinaValida = atribuicoes.some(
    (atribuicao) => atribuicao.disciplina.id === disciplinaId,
  );

  if (!disciplinaValida) {
    notFound();
  }

  const [alunos, notas] = await Promise.all([
    prisma.aluno.findMany({
      where: { escolaId: auth.escolaId, turmaId },
      select: { id: true, nome: true },
      orderBy: { nome: "asc" },
    }),
    prisma.nota.findMany({
      where: {
        escolaId: auth.escolaId,
        turmaId,
        disciplinaId,
        bimestre,
        anoLetivo: ANO_ATUAL,
      },
    }),
  ]);

  const notasPorAluno = new Map(notas.map((nota) => [nota.alunoId, nota.valor]));

  async function salvarNotas(formData: FormData) {
    "use server";

    const authAction = await requireProfessor();
    const disciplinaIdForm = String(formData.get("disciplinaId") || "");
    const bimestreForm = Number(formData.get("bimestre") || 1);

    const atribuicaoValida = await prisma.atribuicaoProfessor.findFirst({
      where: {
        escolaId: authAction.escolaId,
        usuarioId: authAction.usuarioId,
        turmaId,
        disciplinaId: disciplinaIdForm,
      },
    });

    if (!atribuicaoValida) {
      throw new Error("Você não tem permissão para lançar notas aqui.");
    }

    const alunosDaTurma = await prisma.aluno.findMany({
      where: { escolaId: authAction.escolaId, turmaId },
      select: { id: true },
    });

    for (const aluno of alunosDaTurma) {
      const valorTexto = String(formData.get(`nota-${aluno.id}`) || "").trim();

      if (!valorTexto) continue;

      const valor = Number(valorTexto.replace(",", "."));

      if (Number.isNaN(valor) || valor < 0 || valor > 100) continue;

      await prisma.nota.upsert({
        where: {
          alunoId_disciplinaId_bimestre_anoLetivo: {
            alunoId: aluno.id,
            disciplinaId: disciplinaIdForm,
            bimestre: bimestreForm,
            anoLetivo: ANO_ATUAL,
          },
        },
        update: {
          valor,
          lancadoPorUsuarioId: authAction.usuarioId,
        },
        create: {
          valor,
          bimestre: bimestreForm,
          anoLetivo: ANO_ATUAL,
          escolaId: authAction.escolaId,
          alunoId: aluno.id,
          disciplinaId: disciplinaIdForm,
          turmaId,
          lancadoPorUsuarioId: authAction.usuarioId,
        },
      });
    }

    revalidatePath(`/professor/turmas/${turmaId}/notas`);
    revalidatePath(`/alunos`);

    redirect(
      `/professor/turmas/${turmaId}/notas?disciplinaId=${disciplinaIdForm}&bimestre=${bimestreForm}&salvo=1`,
    );
  }

  return (
    <main className="mx-auto w-full max-w-md space-y-6 px-4 pt-4 sm:px-6">
      <Link
        href={`/professor/turmas/${turmaId}`}
        className="inline-flex items-center gap-1 text-[15px] font-medium text-primary"
      >
        <ChevronLeft size={18} />
        {turma.nome}
      </Link>

      <header>
        <h1 className="text-[24px] font-semibold tracking-tight text-foreground">
          Lançar notas
        </h1>
        <p className="mt-1 text-[13px] text-[#8e8e93]">
          Notas de 0 a 100. Ano letivo {ANO_ATUAL}.
        </p>
      </header>

      <section className="space-y-3">
        <div>
          <p className="mb-2 text-[12px] font-semibold uppercase tracking-wide text-[#8e8e93]">
            Disciplina
          </p>
          <div className="flex flex-wrap gap-2">
            {atribuicoes.map((atribuicao) => {
              const ativa = atribuicao.disciplina.id === disciplinaId;

              return (
                <Link
                  key={atribuicao.disciplina.id}
                  href={`/professor/turmas/${turmaId}/notas?disciplinaId=${atribuicao.disciplina.id}&bimestre=${bimestre}`}
                  className={`rounded-full px-4 py-2 text-[13px] font-semibold transition ${
                    ativa
                      ? "bg-primary text-primary-foreground"
                      : "bg-white text-foreground shadow-[0_1px_2px_rgba(0,0,0,0.04)]"
                  }`}
                >
                  {atribuicao.disciplina.nome}
                </Link>
              );
            })}
          </div>
        </div>

        <div>
          <p className="mb-2 text-[12px] font-semibold uppercase tracking-wide text-[#8e8e93]">
            Bimestre
          </p>
          <div className="flex flex-wrap gap-2">
            {[1, 2, 3, 4].map((numero) => {
              const ativo = numero === bimestre;

              return (
                <Link
                  key={numero}
                  href={`/professor/turmas/${turmaId}/notas?disciplinaId=${disciplinaId}&bimestre=${numero}`}
                  className={`rounded-full px-4 py-2 text-[13px] font-semibold transition ${
                    ativo
                      ? "bg-primary text-primary-foreground"
                      : "bg-white text-foreground shadow-[0_1px_2px_rgba(0,0,0,0.04)]"
                  }`}
                >
                  {numero}º
                </Link>
              );
            })}
          </div>
        </div>
      </section>

      {query.salvo === "1" && (
        <div className="rounded-2xl bg-emerald-50 p-3 text-center text-[13px] font-medium text-emerald-700">
          Notas salvas.
        </div>
      )}

      <form action={salvarNotas} className="space-y-3">
        <input type="hidden" name="disciplinaId" value={disciplinaId} />
        <input type="hidden" name="bimestre" value={bimestre} />

        <div className="overflow-hidden rounded-[22px] bg-white shadow-[0_1px_2px_rgba(0,0,0,0.04),0_1px_8px_rgba(0,0,0,0.04)]">
          {alunos.length === 0 ? (
            <p className="p-5 text-sm text-[#8e8e93]">
              Nenhum aluno nesta turma.
            </p>
          ) : (
            alunos.map((aluno, index) => (
              <div
                key={`${disciplinaId}-${bimestre}-${aluno.id}`}
                className={`flex items-center justify-between gap-3 px-4 py-3 ${
                  index > 0 ? "border-t border-black/5" : ""
                }`}
              >
                <span className="min-w-0 flex-1 truncate text-[14px] text-foreground">
                  {aluno.nome}
                </span>
                <input
                  type="text"
                  inputMode="decimal"
                  name={`nota-${aluno.id}`}
                  defaultValue={notasPorAluno.get(aluno.id)?.toString() ?? ""}
                  placeholder="—"
                  className="h-10 w-16 rounded-lg bg-[#f5f5f7] px-2 text-center text-[14px] outline-none focus:ring-2 focus:ring-primary/30"
                />
              </div>
            ))
          )}
        </div>

        <button
          type="submit"
          className="w-full rounded-xl bg-primary px-5 py-3.5 text-[15px] font-semibold text-primary-foreground transition active:opacity-80"
        >
          Salvar notas
        </button>
      </form>
    </main>
  );
}
