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
    <main className="mx-auto w-full max-w-md space-y-6 px-4 pt-6 sm:px-6">
      <header>
        <h1 className="text-[22px] font-semibold tracking-tight text-foreground">
          Fale com a escola
        </h1>
        <p className="mt-1 text-[14px] text-[#8e8e93]">
          Envie uma mensagem e acompanhe a resposta por aqui.
        </p>
      </header>

      <details className="group overflow-hidden rounded-[22px] bg-white shadow-[0_1px_2px_rgba(0,0,0,0.04),0_1px_8px_rgba(0,0,0,0.04)]">
        <summary className="flex cursor-pointer list-none items-center justify-between px-5 py-4 text-[14px] font-semibold text-primary">
          Nova mensagem
          <span className="text-lg transition group-open:rotate-45">+</span>
        </summary>

        <form action={criarMensagem} className="space-y-4 px-5 pb-5">
          {filhos.length > 0 && (
            <div>
              <label className="mb-2 block text-[12px] font-medium text-[#8e8e93]">
                Sobre qual filho(a)? (opcional)
              </label>
              <select
                name="alunoId"
                defaultValue=""
                className="h-12 w-full rounded-xl bg-[#f5f5f7] px-4 text-[14px] outline-none focus:ring-2 focus:ring-primary/30"
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
            <label className="mb-2 block text-[12px] font-medium text-[#8e8e93]">
              Assunto
            </label>
            <input
              name="assunto"
              required
              placeholder="Ex: Dúvida sobre horário de saída"
              className="h-12 w-full rounded-xl bg-[#f5f5f7] px-4 text-[14px] outline-none placeholder:text-[#c7c7cc] focus:ring-2 focus:ring-primary/30"
            />
          </div>

          <div>
            <label className="mb-2 block text-[12px] font-medium text-[#8e8e93]">
              Mensagem
            </label>
            <textarea
              name="texto"
              required
              rows={4}
              className="w-full resize-none rounded-xl bg-[#f5f5f7] px-4 py-3 text-[14px] outline-none focus:ring-2 focus:ring-primary/30"
            />
          </div>

          <button
            type="submit"
            className="w-full rounded-xl bg-primary px-5 py-3.5 text-[14px] font-semibold text-primary-foreground transition active:opacity-80"
          >
            Enviar mensagem
          </button>
        </form>
      </details>

      <section className="space-y-3">
        {mensagens.length === 0 ? (
          <p className="rounded-[22px] bg-white p-6 text-center text-sm text-[#8e8e93] shadow-[0_1px_2px_rgba(0,0,0,0.04),0_1px_8px_rgba(0,0,0,0.04)]">
            Nenhuma mensagem enviada ainda.
          </p>
        ) : (
          mensagens.map((mensagem) => (
            <Link
              key={mensagem.id}
              href={`/portal-familia/mensagens/${mensagem.id}`}
              className="block rounded-[22px] bg-white p-4 shadow-[0_1px_2px_rgba(0,0,0,0.04),0_1px_8px_rgba(0,0,0,0.04)] transition active:scale-[0.98] active:bg-black/[0.02]"
            >
              <div className="flex flex-wrap items-center justify-between gap-2">
                <h3 className="text-[14px] font-semibold text-foreground">
                  {mensagem.assunto}
                </h3>
                <span className="rounded-full bg-[#f5f5f7] px-2.5 py-1 text-[11px] font-medium text-[#8e8e93]">
                  {STATUS_LABELS[mensagem.status] ?? mensagem.status}
                </span>
              </div>

              {mensagem.aluno && (
                <p className="mt-1 text-[11px] text-[#8e8e93]">
                  Sobre: {mensagem.aluno.nome}
                </p>
              )}

              {mensagem.itens[0] && (
                <p className="mt-2 line-clamp-2 text-[12px] text-[#8e8e93]">
                  {mensagem.itens[0].texto}
                </p>
              )}

              <p className="mt-3 text-[11px] text-[#c7c7cc]">
                Atualizado em {formatDateTime(mensagem.atualizadoEm)}
              </p>
            </Link>
          ))
        )}
      </section>
    </main>
  );
}
