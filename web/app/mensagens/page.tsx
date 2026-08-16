import AppLayout from "@/components/layout/AppLayout";
import { requireAdmin, resolveAuthSchoolId } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getApplicationBaseUrl } from "@/lib/application-url";
import { mensagemFamiliaTemplate } from "@/lib/email/templates";
import { sendTransactionalEmail } from "@/lib/email/service";
import { enviarPushParaUsuarios, usuariosDeResponsaveis } from "@/lib/push";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import Link from "next/link";
import { MessageCircle } from "lucide-react";
import NovaConversaForm from "@/components/mensagens/NovaConversaForm";

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

const STATUS_CLASSES: Record<string, string> = {
  ABERTA: "bg-amber-50 text-amber-700",
  RESPONDIDA: "bg-emerald-50 text-emerald-700",
  ENCERRADA: "bg-slate-100 text-slate-600",
};

async function iniciarConversa(formData: FormData) {
  "use server";

  const auth = await requireAdmin("GERENCIAR_COMUNICACAO");
  const escolaId = await resolveAuthSchoolId(auth);

  const responsavelId = String(formData.get("responsavelId") || "");
  const alunoId = String(formData.get("alunoId") || "").trim();
  const assunto = String(formData.get("assunto") || "").trim();
  const texto = String(formData.get("texto") || "").trim();

  if (!responsavelId || !assunto || !texto) {
    throw new Error("Selecione o responsável e preencha assunto e mensagem.");
  }

  const responsavel = await prisma.responsavel.findFirst({
    where: { id: responsavelId, escolaId },
    include: { escola: { select: { nome: true } } },
  });

  if (!responsavel) {
    throw new Error("Responsável não encontrado.");
  }

  let alunoIdValido: string | null = null;

  if (alunoId) {
    const aluno = await prisma.aluno.findFirst({
      where: { id: alunoId, escolaId, responsavelId },
      select: { id: true },
    });

    alunoIdValido = aluno?.id ?? null;
  }

  const mensagem = await prisma.mensagemFamilia.create({
    data: {
      assunto,
      // A escola iniciou: a bola esta com a familia.
      status: "RESPONDIDA",
      escolaId,
      responsavelId,
      alunoId: alunoIdValido,
      itens: {
        create: {
          autor: "ESCOLA",
          autorNome: auth.nome,
          texto,
        },
      },
    },
  });

  if (responsavel.email) {
    const baseUrl = await getApplicationBaseUrl();
    const email = mensagemFamiliaTemplate({
      name: responsavel.nome,
      schoolName: responsavel.escola.nome,
      assunto,
      mensagensUrl: `${baseUrl}/portal-familia/mensagens/${mensagem.id}`,
    });

    await sendTransactionalEmail({
      escolaId,
      criadoPorUsuarioId: auth.usuarioId,
      tipo: "COMUNICADO",
      destinatario: responsavel.email,
      assunto: email.assunto,
      conteudoTexto: email.conteudoTexto,
      conteudoHtml: email.conteudoHtml,
    });
  }

  const usuarioIds = await usuariosDeResponsaveis([responsavelId]);

  await enviarPushParaUsuarios(usuarioIds, {
    titulo: responsavel.escola.nome,
    corpo: `Nova mensagem da escola: ${assunto}`,
    url: `/portal-familia/mensagens/${mensagem.id}`,
    tag: `mensagem-${mensagem.id}`,
  });

  revalidatePath("/mensagens");
  revalidatePath("/portal-familia/mensagens");

  redirect(`/mensagens/${mensagem.id}`);
}

export default async function MensagensPage() {
  const auth = await requireAdmin("GERENCIAR_COMUNICACAO");
  const escolaId = await resolveAuthSchoolId(auth);

  const [mensagens, responsaveis] = await Promise.all([
    prisma.mensagemFamilia.findMany({
      where: { escolaId },
      include: {
        responsavel: { select: { nome: true } },
        aluno: { select: { nome: true } },
        itens: { orderBy: { criadoEm: "desc" }, take: 1 },
      },
      orderBy: [{ status: "asc" }, { atualizadoEm: "desc" }],
    }),
    prisma.responsavel.findMany({
      where: { escolaId },
      select: {
        id: true,
        nome: true,
        alunos: { select: { id: true, nome: true }, orderBy: { nome: "asc" } },
      },
      orderBy: { nome: "asc" },
    }),
  ]);

  const abertas = mensagens.filter((mensagem) => mensagem.status === "ABERTA");

  return (
    <AppLayout>
      <div className="mb-8">
        <p className="text-sm font-medium text-muted-foreground">
          Comunicação
        </p>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight text-foreground">
          Mensagens das famílias
        </h1>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
          {abertas.length} conversa(s) aguardando sua resposta.
        </p>
      </div>

      <NovaConversaForm
        responsaveis={responsaveis}
        action={iniciarConversa}
      />

      {mensagens.length === 0 ? (
        <div className="rounded-3xl border border-dashed border-border p-8 text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-muted text-foreground">
            <MessageCircle size={22} />
          </div>
          <p className="font-medium text-foreground">
            Nenhuma conversa ainda
          </p>
          <p className="mt-2 text-sm text-muted-foreground">
            Inicie uma conversa acima ou aguarde um responsável escrever pelo
            Portal da Família.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {mensagens.map((mensagem) => (
            <Link
              key={mensagem.id}
              href={`/mensagens/${mensagem.id}`}
              className="block rounded-3xl border border-border bg-card p-5 shadow-sm transition hover:border-primary/30"
            >
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="font-semibold text-foreground">
                      {mensagem.assunto}
                    </h3>
                    <span
                      className={`rounded-full px-3 py-1 text-xs font-semibold ${
                        STATUS_CLASSES[mensagem.status] ?? ""
                      }`}
                    >
                      {STATUS_LABELS[mensagem.status] ?? mensagem.status}
                    </span>
                  </div>

                  <p className="mt-1 text-sm text-muted-foreground">
                    {mensagem.responsavel.nome}
                    {mensagem.aluno ? ` · ${mensagem.aluno.nome}` : ""}
                  </p>

                  {mensagem.itens[0] && (
                    <p className="mt-2 line-clamp-2 text-sm text-muted-foreground">
                      {mensagem.itens[0].texto}
                    </p>
                  )}
                </div>

                <p className="shrink-0 text-xs text-muted-foreground">
                  {formatDateTime(mensagem.atualizadoEm)}
                </p>
              </div>
            </Link>
          ))}
        </div>
      )}
    </AppLayout>
  );
}
