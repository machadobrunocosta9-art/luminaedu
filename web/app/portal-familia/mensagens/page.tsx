import Link from "next/link";
import { redirect } from "next/navigation";
import { requireFamily } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

function formatDateTime(date: Date) {
  return new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(date);
}

const STATUS_LABELS: Record<string, string> = {
  ABERTA: "Aguardando resposta da escola",
  RESPONDIDA: "Respondida",
  ENCERRADA: "Encerrada",
};

async function criarMensagem(formData: FormData) {
  "use server";

  const auth = await requireFamily();

  const assunto = String(formData.get("assunto") || "").trim();
  const texto = String(formData.get("texto") || "").trim();
  const alunoId = String(formData.get("alunoId") || "").trim();

  if (!assunto || !texto) {
    throw new Error("Preencha o assunto e a mensagem.");
  }

  let alunoIdValido: string | null = null;

  if (alunoId) {
    const aluno = await prisma.aluno.findFirst({
      where: {
        id: alunoId,
        escolaId: auth.escolaId,
        responsavelId: auth.responsavelId,
      },
      select: { id: true },
    });

    alunoIdValido = aluno?.id ?? null;
  }

  const mensagem = await prisma.mensagemFamilia.create({
    data: {
      assunto,
      escolaId: auth.escolaId,
      responsavelId: auth.responsavelId,
      alunoId: alunoIdValido,
      itens: {
        create: {
          autor: "RESPONSAVEL",
          autorNome: auth.nome,
          texto,
        },
      },
    },
  });

  redirect(`/portal-familia/mensagens/${mensagem.id}`);
}

export default async function FamilyMensagensPage() {
  const auth = await requireFamily();

  const [mensagens, filhos] = await Promise.all([
    prisma.mensagemFamilia.findMany({
      where: {
        escolaId: auth.escolaId,
        responsavelId: auth.responsavelId,
      },
      include: {
        aluno: { select: { nome: true } },
        itens: { orderBy: { criadoEm: "desc" }, take: 1 },
      },
      orderBy: { atualizadoEm: "desc" },
    }),
    prisma.aluno.findMany({
      where: { escolaId: auth.escolaId, responsavelId: auth.responsavelId },
      select: { id: true, nome: true },
      orderBy: { nome: "asc" },
    }),
  ]);

  return (
    <main className="mx-auto w-full max-w-3xl space-y-6 p-4 sm:p-6">
      <Link href="/portal-familia" className="text-sm font-medium text-primary">
        ← Voltar
      </Link>

      <header>
        <p className="text-sm font-medium text-primary">Portal da família</p>
        <h1 className="mt-1 text-3xl font-semibold tracking-tight">
          Fale com a escola
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Envie uma mensagem para a escola e acompanhe a resposta por aqui.
        </p>
      </header>

      <details className="rounded-2xl border bg-white p-5">
        <summary className="cursor-pointer text-sm font-semibold text-primary">
          + Nova mensagem
        </summary>

        <form action={criarMensagem} className="mt-4 space-y-4">
          {filhos.length > 0 && (
            <div>
              <label className="mb-2 block text-sm font-medium">
                Sobre qual filho(a)? (opcional)
              </label>
              <select
                name="alunoId"
                defaultValue=""
                className="h-12 w-full rounded-xl border bg-background px-4 text-sm outline-none focus:border-primary"
              >
                <option value="">Assunto geral</option>
                {filhos.map((filho) => (
                  <option key={filho.id} value={filho.id}>
                    {filho.nome}
                  </option>
                ))}
              </select>
            </div>
          )}

          <div>
            <label className="mb-2 block text-sm font-medium">Assunto</label>
            <input
              name="assunto"
              required
              placeholder="Ex: Dúvida sobre horário de saída"
              className="h-12 w-full rounded-xl border bg-background px-4 text-sm outline-none focus:border-primary"
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium">Mensagem</label>
            <textarea
              name="texto"
              required
              rows={4}
              className="w-full resize-none rounded-xl border bg-background px-4 py-3 text-sm outline-none focus:border-primary"
            />
          </div>

          <button
            type="submit"
            className="rounded-xl bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground transition hover:opacity-90"
          >
            Enviar mensagem
          </button>
        </form>
      </details>

      <section className="space-y-3">
        {mensagens.length === 0 ? (
          <p className="rounded-2xl border bg-white p-5 text-sm text-muted-foreground">
            Nenhuma mensagem enviada ainda.
          </p>
        ) : (
          mensagens.map((mensagem) => (
            <Link
              key={mensagem.id}
              href={`/portal-familia/mensagens/${mensagem.id}`}
              className="block rounded-2xl border bg-white p-5 transition hover:border-primary/30"
            >
              <div className="flex flex-wrap items-center justify-between gap-2">
                <h3 className="font-semibold">{mensagem.assunto}</h3>
                <span className="rounded-full bg-secondary px-3 py-1 text-xs">
                  {STATUS_LABELS[mensagem.status] ?? mensagem.status}
                </span>
              </div>

              {mensagem.aluno && (
                <p className="mt-1 text-xs text-muted-foreground">
                  Sobre: {mensagem.aluno.nome}
                </p>
              )}

              {mensagem.itens[0] && (
                <p className="mt-2 line-clamp-2 text-sm text-muted-foreground">
                  {mensagem.itens[0].texto}
                </p>
              )}

              <p className="mt-3 text-xs text-muted-foreground">
                Atualizado em {formatDateTime(mensagem.atualizadoEm)}
              </p>
            </Link>
          ))
        )}
      </section>
    </main>
  );
}
