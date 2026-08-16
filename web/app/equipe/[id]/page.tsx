import AppLayout from "@/components/layout/AppLayout";
import { requireAdmin, resolveAuthSchoolId } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Trash2 } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function EquipeAtribuicoesPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const auth = await requireAdmin("ADMINISTRAR_SISTEMA");
  const escolaId = await resolveAuthSchoolId(auth);
  const { id } = await params;

  const pessoa = await prisma.usuario.findFirst({
    where: { id, escolaId, papel: "PROFESSOR" },
    include: {
      atribuicoes: {
        include: { turma: true, disciplina: true },
        orderBy: { criadoEm: "asc" },
      },
    },
  });

  if (!pessoa) {
    notFound();
  }

  const [turmas, disciplinas] = await Promise.all([
    prisma.turma.findMany({ where: { escolaId }, orderBy: { nome: "asc" } }),
    prisma.disciplina.findMany({
      where: { escolaId },
      orderBy: { nome: "asc" },
    }),
  ]);

  async function adicionarAtribuicao(formData: FormData) {
    "use server";

    const authAction = await requireAdmin("ADMINISTRAR_SISTEMA");
    const escolaIdAction = await resolveAuthSchoolId(authAction);
    const turmaId = String(formData.get("turmaId") || "");
    const disciplinaId = String(formData.get("disciplinaId") || "");

    if (!turmaId || !disciplinaId) {
      throw new Error("Selecione a turma e a disciplina.");
    }

    const [turma, disciplina] = await Promise.all([
      prisma.turma.findFirst({
        where: { id: turmaId, escolaId: escolaIdAction },
        select: { id: true },
      }),
      prisma.disciplina.findFirst({
        where: { id: disciplinaId, escolaId: escolaIdAction },
        select: { id: true },
      }),
    ]);

    if (!turma || !disciplina) {
      throw new Error("Turma ou disciplina inválida.");
    }

    await prisma.atribuicaoProfessor.upsert({
      where: {
        usuarioId_turmaId_disciplinaId: {
          usuarioId: id,
          turmaId,
          disciplinaId,
        },
      },
      update: {},
      create: {
        usuarioId: id,
        turmaId,
        disciplinaId,
        escolaId: escolaIdAction,
      },
    });

    revalidatePath(`/equipe/${id}`);
    revalidatePath("/equipe");
    redirect(`/equipe/${id}`);
  }

  async function removerAtribuicao(formData: FormData) {
    "use server";

    const authAction = await requireAdmin("ADMINISTRAR_SISTEMA");
    const escolaIdAction = await resolveAuthSchoolId(authAction);
    const atribuicaoId = String(formData.get("atribuicaoId") || "");

    await prisma.atribuicaoProfessor.deleteMany({
      where: { id: atribuicaoId, escolaId: escolaIdAction },
    });

    revalidatePath(`/equipe/${id}`);
    revalidatePath("/equipe");
    redirect(`/equipe/${id}`);
  }

  return (
    <AppLayout>
      <Link
        href="/equipe"
        className="mb-5 inline-flex items-center gap-2 text-sm font-medium text-muted-foreground transition hover:text-foreground"
      >
        <ArrowLeft size={16} />
        Voltar para equipe
      </Link>

      <div className="mb-6">
        <h1 className="text-3xl font-semibold tracking-tight text-foreground">
          {pessoa.nome}
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Turmas e disciplinas que esta pessoa pode lançar nota, atividades e
          bilhetes.
        </p>
      </div>

      <div className="mb-6 space-y-3">
        {pessoa.atribuicoes.length === 0 ? (
          <p className="rounded-2xl border border-dashed border-border p-5 text-sm text-muted-foreground">
            Nenhuma turma atribuída ainda.
          </p>
        ) : (
          pessoa.atribuicoes.map((atribuicao) => (
            <div
              key={atribuicao.id}
              className="flex items-center justify-between rounded-2xl border border-border bg-card p-4"
            >
              <span className="text-sm font-medium text-foreground">
                {atribuicao.turma.nome} · {atribuicao.disciplina.nome}
              </span>
              <form action={removerAtribuicao}>
                <input
                  type="hidden"
                  name="atribuicaoId"
                  value={atribuicao.id}
                />
                <button
                  type="submit"
                  className="flex h-8 w-8 items-center justify-center rounded-lg text-red-600 transition hover:bg-red-50"
                >
                  <Trash2 size={15} />
                </button>
              </form>
            </div>
          ))
        )}
      </div>

      {turmas.length === 0 || disciplinas.length === 0 ? (
        <p className="rounded-2xl border border-dashed border-border p-5 text-sm text-muted-foreground">
          {turmas.length === 0 && "Cadastre uma turma primeiro. "}
          {disciplinas.length === 0 && (
            <>
              Cadastre disciplinas em{" "}
              <Link
                href="/academico/disciplinas"
                className="font-semibold text-primary"
              >
                Acadêmico → Disciplinas
              </Link>
              .
            </>
          )}
        </p>
      ) : (
        <form
          action={adicionarAtribuicao}
          className="flex flex-wrap items-end gap-3 rounded-3xl border border-border bg-card p-6 shadow-sm"
        >
          <div className="min-w-[200px] flex-1">
            <label className="mb-2 block text-sm font-medium text-foreground">
              Turma
            </label>
            <select
              name="turmaId"
              required
              className="h-12 w-full rounded-2xl border border-border bg-background px-4 text-sm outline-none focus:border-primary"
            >
              {turmas.map((turma) => (
                <option key={turma.id} value={turma.id}>
                  {turma.nome}
                </option>
              ))}
            </select>
          </div>

          <div className="min-w-[200px] flex-1">
            <label className="mb-2 block text-sm font-medium text-foreground">
              Disciplina
            </label>
            <select
              name="disciplinaId"
              required
              className="h-12 w-full rounded-2xl border border-border bg-background px-4 text-sm outline-none focus:border-primary"
            >
              {disciplinas.map((disciplina) => (
                <option key={disciplina.id} value={disciplina.id}>
                  {disciplina.nome}
                </option>
              ))}
            </select>
          </div>

          <button
            type="submit"
            className="h-12 rounded-2xl bg-primary px-6 text-sm font-semibold text-primary-foreground transition hover:opacity-90"
          >
            Atribuir
          </button>
        </form>
      )}
    </AppLayout>
  );
}
