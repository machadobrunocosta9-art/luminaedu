import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { notFound, redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { requireProfessor } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

const TIPO_LABELS: Record<string, string> = {
  TRABALHO: "Trabalho",
  ATIVIDADE: "Atividade",
  AVISO: "Aviso",
};

export default async function ProfessorAtividadesPage({
  params,
}: {
  params: Promise<{ turmaId: string }>;
}) {
  const auth = await requireProfessor();
  const { turmaId } = await params;

  const atribuicoes = await prisma.atribuicaoProfessor.findMany({
    where: { escolaId: auth.escolaId, usuarioId: auth.usuarioId, turmaId },
    include: { turma: true, disciplina: true },
  });

  if (atribuicoes.length === 0) {
    notFound();
  }

  const turma = atribuicoes[0].turma;

  const atividades = await prisma.atividade.findMany({
    where: { escolaId: auth.escolaId, turmaId },
    include: { disciplina: true },
    orderBy: { criadoEm: "desc" },
  });

  async function criarAtividade(formData: FormData) {
    "use server";

    const authAction = await requireProfessor();

    const atribuicaoValida = await prisma.atribuicaoProfessor.findFirst({
      where: { escolaId: authAction.escolaId, usuarioId: authAction.usuarioId, turmaId },
      select: { id: true },
    });

    if (!atribuicaoValida) {
      throw new Error("Você não tem permissão para postar nesta turma.");
    }

    const tipo = String(formData.get("tipo") || "ATIVIDADE");
    const titulo = String(formData.get("titulo") || "").trim();
    const descricao = String(formData.get("descricao") || "").trim();
    const disciplinaId = String(formData.get("disciplinaId") || "").trim();
    const dataEntregaTexto = String(formData.get("dataEntrega") || "").trim();

    if (!titulo) {
      throw new Error("Informe um título.");
    }

    await prisma.atividade.create({
      data: {
        tipo: tipo as "TRABALHO" | "ATIVIDADE" | "AVISO",
        titulo,
        descricao: descricao || null,
        dataEntrega: dataEntregaTexto
          ? new Date(`${dataEntregaTexto}T00:00:00`)
          : null,
        escolaId: authAction.escolaId,
        turmaId,
        disciplinaId: disciplinaId || null,
        criadoPorUsuarioId: authAction.usuarioId,
      },
    });

    revalidatePath(`/professor/turmas/${turmaId}/atividades`);
    revalidatePath(`/portal-familia/filhos`);

    redirect(`/professor/turmas/${turmaId}/atividades`);
  }

  return (
    <main className="mx-auto w-full max-w-md space-y-6 px-4 pt-4 sm:px-6">
      <Link
        href={`/professor/turmas/${turmaId}`}
        className="inline-flex items-center gap-1 text-[14px] font-medium text-primary"
      >
        <ChevronLeft size={18} />
        {turma.nome}
      </Link>

      <header>
        <h1 className="text-[19px] font-semibold tracking-tight text-foreground">
          Atividades
        </h1>
      </header>

      <details className="group overflow-hidden rounded-[22px] bg-white shadow-[0_1px_2px_rgba(0,0,0,0.04),0_1px_8px_rgba(0,0,0,0.04)]">
        <summary className="flex cursor-pointer list-none items-center justify-between px-5 py-4 text-[14px] font-semibold text-primary">
          Nova atividade
          <span className="text-lg transition group-open:rotate-45">+</span>
        </summary>

        <form action={criarAtividade} className="space-y-4 px-5 pb-5">
          <div>
            <label className="mb-2 block text-[12px] font-medium text-[#8e8e93]">
              Tipo
            </label>
            <select
              name="tipo"
              defaultValue="ATIVIDADE"
              className="h-12 w-full rounded-xl bg-[#f5f5f7] px-4 text-[14px] outline-none"
            >
              <option value="ATIVIDADE">Atividade</option>
              <option value="TRABALHO">Trabalho</option>
              <option value="AVISO">Aviso</option>
            </select>
          </div>

          <div>
            <label className="mb-2 block text-[12px] font-medium text-[#8e8e93]">
              Disciplina (opcional)
            </label>
            <select
              name="disciplinaId"
              defaultValue=""
              className="h-12 w-full rounded-xl bg-[#f5f5f7] px-4 text-[14px] outline-none"
            >
              <option value="">Geral da turma</option>
              {atribuicoes.map((atribuicao) => (
                <option key={atribuicao.disciplina.id} value={atribuicao.disciplina.id}>
                  {atribuicao.disciplina.nome}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="mb-2 block text-[12px] font-medium text-[#8e8e93]">
              Título
            </label>
            <input
              name="titulo"
              required
              className="h-12 w-full rounded-xl bg-[#f5f5f7] px-4 text-[14px] outline-none"
            />
          </div>

          <div>
            <label className="mb-2 block text-[12px] font-medium text-[#8e8e93]">
              Descrição
            </label>
            <textarea
              name="descricao"
              rows={3}
              className="w-full resize-none rounded-xl bg-[#f5f5f7] px-4 py-3 text-[14px] outline-none"
            />
          </div>

          <div>
            <label className="mb-2 block text-[12px] font-medium text-[#8e8e93]">
              Data de entrega (opcional)
            </label>
            <input
              type="date"
              name="dataEntrega"
              className="h-12 w-full rounded-xl bg-[#f5f5f7] px-4 text-[14px] outline-none"
            />
          </div>

          <button
            type="submit"
            className="w-full rounded-xl bg-primary px-5 py-3.5 text-[14px] font-semibold text-primary-foreground transition active:opacity-80"
          >
            Publicar
          </button>
        </form>
      </details>

      <section className="space-y-3">
        {atividades.length === 0 ? (
          <p className="rounded-[22px] bg-white p-6 text-center text-sm text-[#8e8e93] shadow-[0_1px_2px_rgba(0,0,0,0.04),0_1px_8px_rgba(0,0,0,0.04)]">
            Nenhuma atividade publicada ainda.
          </p>
        ) : (
          atividades.map((atividade) => (
            <div
              key={atividade.id}
              className="rounded-[22px] bg-white p-4 shadow-[0_1px_2px_rgba(0,0,0,0.04),0_1px_8px_rgba(0,0,0,0.04)]"
            >
              <div className="flex flex-wrap items-center justify-between gap-2">
                <h3 className="text-[14px] font-semibold text-foreground">
                  {atividade.titulo}
                </h3>
                <span className="rounded-full bg-[#f5f5f7] px-2.5 py-1 text-[11px] font-medium text-[#8e8e93]">
                  {TIPO_LABELS[atividade.tipo] ?? atividade.tipo}
                </span>
              </div>
              {atividade.disciplina && (
                <p className="mt-1 text-[11px] text-primary">
                  {atividade.disciplina.nome}
                </p>
              )}
              {atividade.descricao && (
                <p className="mt-2 whitespace-pre-line text-[12px] text-[#8e8e93]">
                  {atividade.descricao}
                </p>
              )}
              {atividade.dataEntrega && (
                <p className="mt-2 text-[11px] text-[#8e8e93]">
                  Entrega:{" "}
                  {new Intl.DateTimeFormat("pt-BR", { timeZone: "UTC" }).format(
                    atividade.dataEntrega,
                  )}
                </p>
              )}
            </div>
          ))
        )}
      </section>
    </main>
  );
}
