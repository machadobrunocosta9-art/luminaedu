import Link from "next/link";
import { ChevronLeft } from "lucide-react";
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
    <main className="mx-auto w-full max-w-md space-y-5 px-4 pt-4 sm:px-6">
      <Link
        href="/portal-familia/mensagens"
        className="inline-flex items-center gap-1 text-[14px] font-medium text-primary"
      >
        <ChevronLeft size={18} />
        Mensagens
      </Link>

      <header>
        <h1 className="text-[18px] font-semibold tracking-tight text-foreground">
          {mensagem.assunto}
        </h1>
        <div className="mt-1.5 flex flex-wrap items-center gap-2">
          <span className="rounded-full bg-[#f5f5f7] px-2.5 py-1 text-[11px] font-medium text-[#8e8e93]">
            {STATUS_LABELS[mensagem.status] ?? mensagem.status}
          </span>
          {mensagem.aluno && (
            <span className="text-[11px] text-[#8e8e93]">
              Sobre: {mensagem.aluno.nome}
            </span>
          )}
        </div>
      </header>

      <section className="space-y-2.5">
        {mensagem.itens.map((item) => {
          const daEscola = item.autor === "ESCOLA";

          return (
            <div
              key={item.id}
              className={`flex ${daEscola ? "justify-start" : "justify-end"}`}
            >
              <div
                className={`max-w-[85%] rounded-[20px] px-4 py-2.5 ${
                  daEscola
                    ? "rounded-bl-[6px] bg-[#e9e9eb] text-foreground"
                    : "rounded-br-[6px] bg-primary text-primary-foreground"
                }`}
              >
                <p className="whitespace-pre-line text-[14px] leading-snug">
                  {item.texto}
                </p>
                <p
                  className={`mt-1 text-[11px] ${
                    daEscola ? "text-[#8e8e93]" : "text-primary-foreground/70"
                  }`}
                >
                  {daEscola ? "Escola" : "Você"} · {formatDateTime(item.criadoEm)}
                </p>
              </div>
            </div>
          );
        })}
      </section>

      {mensagem.status === "ENCERRADA" ? (
        <p className="rounded-[18px] bg-white p-4 text-center text-[12px] text-[#8e8e93] shadow-[0_1px_2px_rgba(0,0,0,0.04),0_1px_8px_rgba(0,0,0,0.04)]">
          Esta conversa foi encerrada pela escola.
        </p>
      ) : (
        <form
          action={responder}
          className="space-y-3 rounded-[22px] bg-white p-4 shadow-[0_1px_2px_rgba(0,0,0,0.04),0_1px_8px_rgba(0,0,0,0.04)]"
        >
          <textarea
            name="texto"
            required
            rows={3}
            placeholder="Escreva sua resposta..."
            className="w-full resize-none rounded-xl bg-[#f5f5f7] px-4 py-3 text-[14px] outline-none placeholder:text-[#c7c7cc] focus:ring-2 focus:ring-primary/30"
          />
          <button
            type="submit"
            className="w-full rounded-xl bg-primary px-5 py-3 text-[14px] font-semibold text-primary-foreground transition active:opacity-80"
          >
            Enviar
          </button>
        </form>
      )}
    </main>
  );
}
