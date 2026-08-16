import AppLayout from "@/components/layout/AppLayout";
import { requireAdmin, resolveAuthSchoolId } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getApplicationBaseUrl } from "@/lib/application-url";
import { mensagemFamiliaTemplate } from "@/lib/email/templates";
import { sendTransactionalEmail } from "@/lib/email/service";
import { enviarPushParaUsuarios, usuariosDeResponsaveis } from "@/lib/push";
import { revalidatePath } from "next/cache";
import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export const dynamic = "force-dynamic";

function formatDateTime(date: Date) {
  return new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(date);
}

const STATUS_LABELS: Record<string, string> = {
  ABERTA: "Aguardando resposta",
  RESPONDIDA: "Respondida",
  ENCERRADA: "Encerrada",
};

export default async function MensagemDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const auth = await requireAdmin("GERENCIAR_COMUNICACAO");
  const escolaId = await resolveAuthSchoolId(auth);
  const { id } = await params;

  const mensagem = await prisma.mensagemFamilia.findFirst({
    where: { id, escolaId },
    include: {
      responsavel: true,
      aluno: { select: { nome: true } },
      escola: { select: { nome: true } },
      itens: { orderBy: { criadoEm: "asc" } },
    },
  });

  if (!mensagem) {
    notFound();
  }

  async function responder(formData: FormData) {
    "use server";

    const authAction = await requireAdmin("GERENCIAR_COMUNICACAO");
    const escolaIdAction = await resolveAuthSchoolId(authAction);
    const texto = String(formData.get("texto") || "").trim();

    if (!texto) {
      throw new Error("Escreva uma resposta.");
    }

    const thread = await prisma.mensagemFamilia.findFirst({
      where: { id, escolaId: escolaIdAction },
      include: { responsavel: true, escola: true },
    });

    if (!thread) {
      throw new Error("Mensagem não encontrada.");
    }

    await prisma.mensagemFamiliaItem.create({
      data: {
        mensagemId: thread.id,
        autor: "ESCOLA",
        autorNome: authAction.nome,
        texto,
      },
    });

    await prisma.mensagemFamilia.update({
      where: { id: thread.id },
      data: { status: "RESPONDIDA" },
    });

    if (thread.responsavel.email) {
      const baseUrl = await getApplicationBaseUrl();
      const mensagemEmail = mensagemFamiliaTemplate({
        name: thread.responsavel.nome,
        schoolName: thread.escola.nome,
        assunto: thread.assunto,
        mensagensUrl: `${baseUrl}/portal-familia/mensagens/${thread.id}`,
      });

      await sendTransactionalEmail({
        escolaId: escolaIdAction,
        criadoPorUsuarioId: authAction.usuarioId,
        tipo: "COMUNICADO",
        destinatario: thread.responsavel.email,
        assunto: mensagemEmail.assunto,
        conteudoTexto: mensagemEmail.conteudoTexto,
        conteudoHtml: mensagemEmail.conteudoHtml,
      });
    }

    const usuarioIds = await usuariosDeResponsaveis([thread.responsavelId]);

    await enviarPushParaUsuarios(usuarioIds, {
      titulo: thread.escola.nome,
      corpo: `A escola respondeu: ${thread.assunto}`,
      url: `/portal-familia/mensagens/${thread.id}`,
      tag: `mensagem-${thread.id}`,
    });

    revalidatePath("/mensagens");
    revalidatePath(`/mensagens/${thread.id}`);
    revalidatePath("/portal-familia/mensagens");

    redirect(`/mensagens/${thread.id}`);
  }

  async function encerrar(formData: FormData) {
    "use server";

    const authAction = await requireAdmin("GERENCIAR_COMUNICACAO");
    const escolaIdAction = await resolveAuthSchoolId(authAction);
    const mensagemId = String(formData.get("mensagemId") || "");

    await prisma.mensagemFamilia.updateMany({
      where: { id: mensagemId, escolaId: escolaIdAction },
      data: { status: "ENCERRADA" },
    });

    revalidatePath("/mensagens");
    revalidatePath(`/mensagens/${mensagemId}`);
    redirect(`/mensagens/${mensagemId}`);
  }

  return (
    <AppLayout>
      <Link
        href="/mensagens"
        className="mb-5 inline-flex items-center gap-2 text-sm font-medium text-muted-foreground transition hover:text-foreground"
      >
        <ArrowLeft size={16} />
        Voltar para mensagens
      </Link>

      <div className="mb-6">
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">
          {mensagem.assunto}
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          {mensagem.responsavel.nome} · {mensagem.responsavel.telefone}
          {mensagem.aluno ? ` · ${mensagem.aluno.nome}` : ""}
        </p>
        <span className="mt-2 inline-flex rounded-full bg-muted px-3 py-1 text-xs font-semibold text-foreground">
          {STATUS_LABELS[mensagem.status] ?? mensagem.status}
        </span>
      </div>

      <section className="space-y-3">
        {mensagem.itens.map((item) => (
          <div
            key={item.id}
            className={`rounded-3xl border border-border p-5 ${
              item.autor === "ESCOLA" ? "bg-primary/5" : "bg-card"
            }`}
          >
            <div className="flex items-center justify-between gap-2">
              <p className="text-sm font-semibold text-foreground">
                {item.autor === "ESCOLA" ? "Você (escola)" : item.autorNome}
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

      {mensagem.status !== "ENCERRADA" && (
        <form
          action={responder}
          className="mt-5 space-y-3 rounded-3xl border border-border bg-card p-6 shadow-sm"
        >
          <label className="block text-sm font-medium text-foreground">
            Responder ao responsável
          </label>
          <textarea
            name="texto"
            required
            rows={4}
            className="w-full resize-none rounded-2xl border border-border bg-background px-4 py-3 text-sm outline-none focus:border-primary"
          />
          <button
            type="submit"
            className="rounded-2xl bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground transition hover:opacity-90"
          >
            Enviar resposta
          </button>
        </form>
      )}

      {mensagem.status !== "ENCERRADA" && (
        <form action={encerrar} className="mt-4">
          <input type="hidden" name="mensagemId" value={mensagem.id} />
          <button
            type="submit"
            className="rounded-2xl border border-border px-5 py-3 text-sm font-semibold text-foreground transition hover:bg-muted"
          >
            Encerrar conversa
          </button>
        </form>
      )}
    </AppLayout>
  );
}
