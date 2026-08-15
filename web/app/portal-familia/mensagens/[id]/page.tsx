import Link from "next/link";
import { notFound, redirect } from "next/navigation";
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

export default async function FamilyMensagemDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const auth = await requireFamily();
  const { id } = await params;

  const mensagem = await prisma.mensagemFamilia.findFirst({
    where: { id, escolaId: auth.escolaId, responsavelId: auth.responsavelId },
    include: {
      aluno: { select: { nome: true } },
      itens: { orderBy: { criadoEm: "asc" } },
    },
  });

  if (!mensagem) {
    notFound();
  }

  async function responder(formData: FormData) {
    "use server";

    const authAction = await requireFamily();
    const texto = String(formData.get("texto") || "").trim();

    if (!texto) {
      throw new Error("Escreva uma mensagem.");
    }

    const thread = await prisma.mensagemFamilia.findFirst({
      where: {
        id,
        escolaId: authAction.escolaId,
        responsavelId: authAction.responsavelId,
      },
      select: { id: true, status: true },
    });

    if (!thread || thread.status === "ENCERRADA") {
      throw new Error("Esta conversa não está mais disponível.");
    }

    await prisma.mensagemFamiliaItem.create({
      data: {
        mensagemId: thread.id,
        autor: "RESPONSAVEL",
        autorNome: authAction.nome,
        texto,
      },
    });

    await prisma.mensagemFamilia.update({
      where: { id: thread.id },
      data: { status: "ABERTA", atualizadoEm: new Date() },
    });

    redirect(`/portal-familia/mensagens/${thread.id}`);
  }

  return (
    <main className="mx-auto w-full max-w-2xl space-y-6 p-4 sm:p-6">
      <Link href="/portal-familia/mensagens" className="text-sm font-medium text-primary">
        ← Voltar
      </Link>

      <header>
        <h1 className="text-2xl font-semibold tracking-tight">{mensagem.assunto}</h1>
        <div className="mt-2 flex flex-wrap items-center gap-2">
          <span className="rounded-full bg-secondary px-3 py-1 text-xs">
            {STATUS_LABELS[mensagem.status] ?? mensagem.status}
          </span>
          {mensagem.aluno && (
            <span className="text-xs text-muted-foreground">
              Sobre: {mensagem.aluno.nome}
            </span>
          )}
        </div>
      </header>

      <section className="space-y-3">
        {mensagem.itens.map((item) => (
          <div
            key={item.id}
            className={`rounded-2xl border p-4 ${
              item.autor === "ESCOLA" ? "bg-primary/5" : "bg-white"
            }`}
          >
            <div className="flex items-center justify-between gap-2">
              <p className="text-sm font-semibold">
                {item.autor === "ESCOLA" ? "Escola" : item.autorNome}
              </p>
              <p className="text-xs text-muted-foreground">
                {formatDateTime(item.criadoEm)}
              </p>
            </div>
            <p className="mt-2 whitespace-pre-line text-sm text-muted-foreground">
              {item.texto}
            </p>
          </div>
        ))}
      </section>

      {mensagem.status === "ENCERRADA" ? (
        <p className="rounded-2xl border bg-muted/50 p-4 text-sm text-muted-foreground">
          Esta conversa foi encerrada pela escola.
        </p>
      ) : (
        <form action={responder} className="space-y-3 rounded-2xl border bg-white p-5">
          <label className="block text-sm font-medium">Responder</label>
          <textarea
            name="texto"
            required
            rows={3}
            className="w-full resize-none rounded-xl border bg-background px-4 py-3 text-sm outline-none focus:border-primary"
          />
          <button
            type="submit"
            className="rounded-xl bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground transition hover:opacity-90"
          >
            Enviar
          </button>
        </form>
      )}
    </main>
  );
}
