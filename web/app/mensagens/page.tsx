import AppLayout from "@/components/layout/AppLayout";
import { requireAdmin, resolveAuthSchoolId } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { MessageCircle } from "lucide-react";

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

export default async function MensagensPage() {
  const auth = await requireAdmin("GERENCIAR_COMUNICACAO");
  const escolaId = await resolveAuthSchoolId(auth);

  const mensagens = await prisma.mensagemFamilia.findMany({
    where: { escolaId },
    include: {
      responsavel: { select: { nome: true } },
      aluno: { select: { nome: true } },
      itens: { orderBy: { criadoEm: "desc" }, take: 1 },
    },
    orderBy: [{ status: "asc" }, { atualizadoEm: "desc" }],
  });

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

      {mensagens.length === 0 ? (
        <div className="rounded-3xl border border-dashed border-border p-8 text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-muted text-foreground">
            <MessageCircle size={22} />
          </div>
          <p className="font-medium text-foreground">
            Nenhuma mensagem recebida ainda
          </p>
          <p className="mt-2 text-sm text-muted-foreground">
            Quando um responsável enviar uma mensagem pelo Portal da Família,
            ela aparece aqui.
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
