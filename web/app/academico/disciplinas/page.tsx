import AppLayout from "@/components/layout/AppLayout";
import { requireAdmin, resolveAuthSchoolId } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import Link from "next/link";
import { ArrowLeft, BookOpen, Trash2 } from "lucide-react";

export const dynamic = "force-dynamic";

async function criarDisciplina(formData: FormData) {
  "use server";

  const auth = await requireAdmin("GERENCIAR_ALUNOS");
  const escolaId = await resolveAuthSchoolId(auth);
  const nome = String(formData.get("nome") || "").trim();

  if (!nome) {
    throw new Error("Informe o nome da disciplina.");
  }

  await prisma.disciplina.create({
    data: { nome, escolaId },
  });

  revalidatePath("/academico/disciplinas");
}

async function removerDisciplina(formData: FormData) {
  "use server";

  const auth = await requireAdmin("GERENCIAR_ALUNOS");
  const escolaId = await resolveAuthSchoolId(auth);
  const disciplinaId = String(formData.get("disciplinaId") || "");

  await prisma.disciplina.deleteMany({
    where: { id: disciplinaId, escolaId },
  });

  revalidatePath("/academico/disciplinas");
}

export default async function DisciplinasPage() {
  const auth = await requireAdmin("GERENCIAR_ALUNOS");
  const escolaId = await resolveAuthSchoolId(auth);

  const disciplinas = await prisma.disciplina.findMany({
    where: { escolaId },
    orderBy: { nome: "asc" },
  });

  return (
    <AppLayout>
      <Link
        href="/academico"
        className="mb-5 inline-flex items-center gap-2 text-sm font-medium text-muted-foreground transition hover:text-foreground"
      >
        <ArrowLeft size={16} />
        Voltar para acadêmico
      </Link>

      <div className="mb-6">
        <h1 className="text-3xl font-semibold tracking-tight text-foreground">
          Disciplinas
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Cadastre as disciplinas usadas no lançamento de notas e boletim.
        </p>
      </div>

      <form
        action={criarDisciplina}
        className="mb-6 flex flex-wrap items-end gap-3 rounded-3xl border border-border bg-card p-6 shadow-sm"
      >
        <div className="min-w-[240px] flex-1">
          <label className="mb-2 block text-sm font-medium text-foreground">
            Nova disciplina
          </label>
          <input
            name="nome"
            required
            placeholder="Ex: Matemática"
            className="h-12 w-full rounded-2xl border border-border bg-background px-4 text-sm outline-none focus:border-primary"
          />
        </div>
        <button
          type="submit"
          className="h-12 rounded-2xl bg-primary px-6 text-sm font-semibold text-primary-foreground transition hover:opacity-90"
        >
          Adicionar
        </button>
      </form>

      {disciplinas.length === 0 ? (
        <div className="rounded-3xl border border-dashed border-border p-8 text-center text-sm text-muted-foreground">
          Nenhuma disciplina cadastrada ainda.
        </div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {disciplinas.map((disciplina) => (
            <div
              key={disciplina.id}
              className="flex items-center justify-between gap-3 rounded-2xl border border-border bg-card p-4"
            >
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10 text-primary">
                  <BookOpen size={16} />
                </div>
                <span className="font-medium text-foreground">
                  {disciplina.nome}
                </span>
              </div>
              <form action={removerDisciplina}>
                <input type="hidden" name="disciplinaId" value={disciplina.id} />
                <button
                  type="submit"
                  className="flex h-8 w-8 items-center justify-center rounded-lg text-red-600 transition hover:bg-red-50"
                >
                  <Trash2 size={15} />
                </button>
              </form>
            </div>
          ))}
        </div>
      )}
    </AppLayout>
  );
}
