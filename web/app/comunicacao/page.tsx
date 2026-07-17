import AppLayout from "@/components/layout/AppLayout";
import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import Link from "next/link";
import {
  ArrowRight,
  CheckCircle2,
  Clock,
  ExternalLink,
  Mail,
  Megaphone,
  Plus,
  Send,
} from "lucide-react";

export const dynamic = "force-dynamic";

function formatDateTime(date?: Date | null) {
  if (!date) return "Não informado";

  return new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(date);
}

function formatDate(date?: Date | null) {
  if (!date) return "Não informado";

  return new Intl.DateTimeFormat("pt-BR", {
    timeZone: "UTC",
  }).format(date);
}

function formatMoney(valorCentavos?: number | null) {
  if (!valorCentavos) return null;

  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(valorCentavos / 100);
}

function getTipoLabel(tipo: string) {
  const labels: Record<string, string> = {
    SIMPLES: "Comunicado simples",
    CIENCIA: "Comunicado com ciência",
    EVENTO: "Evento com participação",
    AUTORIZACAO: "Autorização digital",
    PAGAMENTO: "Comunicado com pagamento",
  };

  return labels[tipo] ?? tipo;
}

function getStatusLabel(status: string) {
  const labels: Record<string, string> = {
    RASCUNHO: "Rascunho",
    PREPARADO: "Preparado",
    ENVIADO: "Enviado",
    CANCELADO: "Cancelado",
    ARQUIVADO: "Arquivado",
    PENDENTE: "Pendente",
    VISUALIZADO: "Visualizado",
    RESPONDIDO: "Respondido",
  };

  return labels[status] ?? status;
}

export default async function ComunicacaoPage() {
  const escola = await prisma.escola.findFirst({
    orderBy: {
      criadoEm: "asc",
    },
  });

  if (!escola) {
    throw new Error("Nenhuma escola encontrada.");
  }

  const escolaEncontrada = escola;

  const comunicados = await prisma.comunicado.findMany({
    where: {
      escolaId: escolaEncontrada.id,
    },
    orderBy: {
      criadoEm: "desc",
    },
    include: {
      turma: true,
      aluno: true,
      destinatarios: {
        orderBy: {
          criadoEm: "asc",
        },
        include: {
          aluno: true,
          responsavel: true,
          respostas: true,
        },
      },
      respostas: true,
    },
  });

  async function marcarComoEnviado(formData: FormData) {
    "use server";

    await requireAdmin();

    const comunicadoId = String(formData.get("comunicadoId") || "");

    if (!comunicadoId) {
      throw new Error("Comunicado não encontrado.");
    }

    await prisma.comunicado.update({
      where: {
        id: comunicadoId,
      },
      data: {
        status: "ENVIADO",
        enviadoEm: new Date(),
        destinatarios: {
          updateMany: {
            where: {
              status: "PENDENTE",
            },
            data: {
              status: "ENVIADO",
              enviadoEm: new Date(),
            },
          },
        },
      },
    });

    revalidatePath("/comunicacao");
    revalidatePath("/dashboard");
    revalidatePath("/pulse");
    revalidatePath("/relatorios");
  }

  const totalComunicados = comunicados.length;

  const comunicadosPreparados = comunicados.filter(
    (comunicado) => comunicado.status === "PREPARADO",
  ).length;

  const comunicadosEnviados = comunicados.filter(
    (comunicado) => comunicado.status === "ENVIADO",
  ).length;

  const totalDestinatarios = comunicados.reduce(
    (total, comunicado) => total + comunicado.destinatarios.length,
    0,
  );

  const totalRespostas = comunicados.reduce(
    (total, comunicado) => total + comunicado.respostas.length,
    0,
  );

  return (
    <AppLayout>
      <div className="mb-8 flex items-start justify-between gap-6">
        <div>
          <p className="text-sm font-medium text-muted-foreground">
            Comunicação Inteligente
          </p>

          <h1 className="mt-2 text-3xl font-semibold tracking-tight text-foreground">
            Comunicação
          </h1>

          <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
            Crie comunicados, eventos, autorizações digitais e acompanhe as
            respostas dos responsáveis em um só lugar.
          </p>
        </div>

        <Link
          href="/comunicacao/novo"
          className="inline-flex items-center gap-2 rounded-2xl bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground transition hover:opacity-90"
        >
          <Plus size={18} />
          Novo comunicado
        </Link>
      </div>

      <div className="mb-8 grid gap-4 md:grid-cols-4">
        <div className="rounded-3xl border border-border bg-card p-5 shadow-sm">
          <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-2xl bg-muted text-foreground">
            <Megaphone size={20} />
          </div>

          <p className="text-sm text-muted-foreground">Comunicados</p>
          <p className="mt-1 text-3xl font-semibold text-foreground">
            {totalComunicados}
          </p>
        </div>

        <div className="rounded-3xl border border-border bg-card p-5 shadow-sm">
          <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-2xl bg-muted text-foreground">
            <Clock size={20} />
          </div>

          <p className="text-sm text-muted-foreground">Preparados</p>
          <p className="mt-1 text-3xl font-semibold text-foreground">
            {comunicadosPreparados}
          </p>
        </div>

        <div className="rounded-3xl border border-border bg-card p-5 shadow-sm">
          <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-2xl bg-muted text-foreground">
            <Send size={20} />
          </div>

          <p className="text-sm text-muted-foreground">Enviados</p>
          <p className="mt-1 text-3xl font-semibold text-foreground">
            {comunicadosEnviados}
          </p>
        </div>

        <div className="rounded-3xl border border-border bg-card p-5 shadow-sm">
          <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-2xl bg-muted text-foreground">
            <CheckCircle2 size={20} />
          </div>

          <p className="text-sm text-muted-foreground">Respostas</p>
          <p className="mt-1 text-3xl font-semibold text-foreground">
            {totalRespostas}/{totalDestinatarios}
          </p>
        </div>
      </div>

      <section className="rounded-3xl border border-border bg-card p-6 shadow-sm">
        <div className="mb-5 flex items-center justify-between gap-4">
          <div>
            <h2 className="font-semibold text-foreground">
              Comunicados criados
            </h2>

            <p className="mt-1 text-sm text-muted-foreground">
              Acompanhe comunicados, eventos, autorizações e respostas dos
              responsáveis.
            </p>
          </div>
        </div>

        {comunicados.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-border p-8 text-center">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-muted text-foreground">
              <Mail size={22} />
            </div>

            <p className="font-medium text-foreground">
              Nenhum comunicado criado ainda
            </p>

            <p className="mt-2 text-sm text-muted-foreground">
              Crie o primeiro comunicado inteligente para enviar às famílias.
            </p>

            <Link
              href="/comunicacao/novo"
              className="mt-5 inline-flex items-center gap-2 rounded-2xl bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground transition hover:opacity-90"
            >
              <Plus size={18} />
              Criar comunicado
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {comunicados.map((comunicado) => {
              const destinatarios = comunicado.destinatarios.length;

              const respondidos = comunicado.destinatarios.filter(
                (destinatario) =>
                  destinatario.status === "RESPONDIDO" ||
                  destinatario.respostas.length > 0,
              ).length;

              const pendentes = destinatarios - respondidos;
              const valorFormatado = formatMoney(comunicado.valorCentavos);

              return (
                <div
                  key={comunicado.id}
                  className="rounded-2xl border border-border bg-background p-5"
                >
                  <div className="flex flex-wrap items-start justify-between gap-5">
                    <div className="min-w-0">
                      <div className="mb-3 flex flex-wrap items-center gap-2">
                        <span className="rounded-full bg-muted px-3 py-1 text-xs font-semibold text-foreground">
                          {getTipoLabel(comunicado.tipo)}
                        </span>

                        <span className="rounded-full bg-muted px-3 py-1 text-xs font-semibold text-muted-foreground">
                          {getStatusLabel(comunicado.status)}
                        </span>

                        {comunicado.requerParticipacao && (
                          <span className="rounded-full bg-muted px-3 py-1 text-xs font-semibold text-muted-foreground">
                            Participação
                          </span>
                        )}

                        {comunicado.requerAutorizacao && (
                          <span className="rounded-full bg-muted px-3 py-1 text-xs font-semibold text-muted-foreground">
                            Autorização
                          </span>
                        )}

                        {comunicado.requerCiencia && (
                          <span className="rounded-full bg-muted px-3 py-1 text-xs font-semibold text-muted-foreground">
                            Ciência digital
                          </span>
                        )}
                      </div>

                      <h3 className="text-lg font-semibold text-foreground">
                        {comunicado.titulo}
                      </h3>

                      <p className="mt-2 line-clamp-3 text-sm leading-6 text-muted-foreground">
                        {comunicado.conteudo}
                      </p>
                    </div>

                    <div className="shrink-0 rounded-2xl bg-muted px-4 py-3 text-right">
                      <p className="text-xs font-medium uppercase tracking-[0.16em] text-muted-foreground">
                        Criado em
                      </p>

                      <p className="mt-1 text-sm font-medium text-foreground">
                        {formatDateTime(comunicado.criadoEm)}
                      </p>
                    </div>
                  </div>

                  {(comunicado.dataEvento ||
                    comunicado.horaEvento ||
                    comunicado.localEvento ||
                    valorFormatado) && (
                    <div className="mt-4 grid gap-3 md:grid-cols-4">
                      <div className="rounded-2xl bg-muted p-3">
                        <p className="text-xs text-muted-foreground">Data</p>
                        <p className="mt-1 text-sm font-semibold text-foreground">
                          {formatDate(comunicado.dataEvento)}
                        </p>
                      </div>

                      <div className="rounded-2xl bg-muted p-3">
                        <p className="text-xs text-muted-foreground">Hora</p>
                        <p className="mt-1 text-sm font-semibold text-foreground">
                          {comunicado.horaEvento || "Não informado"}
                        </p>
                      </div>

                      <div className="rounded-2xl bg-muted p-3">
                        <p className="text-xs text-muted-foreground">Local</p>
                        <p className="mt-1 text-sm font-semibold text-foreground">
                          {comunicado.localEvento || "Não informado"}
                        </p>
                      </div>

                      <div className="rounded-2xl bg-muted p-3">
                        <p className="text-xs text-muted-foreground">Valor</p>
                        <p className="mt-1 text-sm font-semibold text-foreground">
                          {valorFormatado || "Sem valor"}
                        </p>
                      </div>
                    </div>
                  )}

                  <div className="mt-4 grid gap-3 md:grid-cols-4">
                    <div className="rounded-2xl bg-muted p-3">
                      <p className="text-xs text-muted-foreground">
                        Público-alvo
                      </p>

                      <p className="mt-1 text-sm font-semibold text-foreground">
                        {comunicado.publicoAlvo === "TURMA"
                          ? comunicado.turma?.nome || "Turma"
                          : comunicado.publicoAlvo === "ALUNO"
                            ? comunicado.aluno?.nome || "Aluno"
                            : "Toda a escola"}
                      </p>
                    </div>

                    <div className="rounded-2xl bg-muted p-3">
                      <p className="text-xs text-muted-foreground">
                        Destinatários
                      </p>

                      <p className="mt-1 text-sm font-semibold text-foreground">
                        {destinatarios}
                      </p>
                    </div>

                    <div className="rounded-2xl bg-muted p-3">
                      <p className="text-xs text-muted-foreground">
                        Respondidos
                      </p>

                      <p className="mt-1 text-sm font-semibold text-foreground">
                        {respondidos}
                      </p>
                    </div>

                    <div className="rounded-2xl bg-muted p-3">
                      <p className="text-xs text-muted-foreground">
                        Pendentes
                      </p>

                      <p className="mt-1 text-sm font-semibold text-foreground">
                        {pendentes}
                      </p>
                    </div>
                  </div>

                  {comunicado.destinatarios.length > 0 && (
                    <details className="mt-4">
                      <summary className="cursor-pointer text-sm font-semibold text-foreground">
                        Ver destinatários e links de resposta
                      </summary>

                      <div className="mt-3 space-y-2">
                        {comunicado.destinatarios.slice(0, 12).map((item) => (
                          <div
                            key={item.id}
                            className="flex flex-wrap items-center justify-between gap-3 rounded-2xl bg-muted p-3"
                          >
                            <div>
                              <p className="font-medium text-foreground">
                                {item.aluno?.nome ?? "Aluno não informado"}
                              </p>

                              <p className="mt-1 text-sm text-muted-foreground">
                                Responsável:{" "}
                                {item.nomeResponsavel || "Não informado"}
                              </p>

                              <p className="mt-1 text-xs text-muted-foreground">
                                Status: {getStatusLabel(item.status)}
                              </p>
                            </div>

                            <div className="flex flex-wrap items-center gap-2">
                              {item.tokenResposta && (
                                <Link
                                  href={`/responder/${item.tokenResposta}`}
                                  target="_blank"
                                  className="inline-flex items-center gap-2 rounded-2xl bg-background px-4 py-2 text-xs font-semibold text-foreground transition hover:bg-card"
                                >
                                  <ExternalLink size={15} />
                                  Abrir resposta
                                </Link>
                              )}

                              <span className="rounded-full bg-background px-3 py-1 text-xs font-semibold text-muted-foreground">
                                {item.respostas.length > 0
                                  ? "Respondido"
                                  : "Aguardando"}
                              </span>
                            </div>
                          </div>
                        ))}

                        {comunicado.destinatarios.length > 12 && (
                          <p className="px-3 pt-2 text-xs text-muted-foreground">
                            + {comunicado.destinatarios.length - 12}{" "}
                            destinatário(s)
                          </p>
                        )}
                      </div>
                    </details>
                  )}

                  <div className="mt-5 flex flex-wrap justify-end gap-3">
                    {comunicado.status === "PREPARADO" && (
                      <form action={marcarComoEnviado}>
                        <input
                          type="hidden"
                          name="comunicadoId"
                          value={comunicado.id}
                        />

                        <button
                          type="submit"
                          className="inline-flex items-center gap-2 rounded-2xl bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground transition hover:opacity-90"
                        >
                          <Send size={18} />
                          Marcar como enviado
                        </button>
                      </form>
                    )}

                    <Link
                      href="/comunicacao/novo"
                      className="inline-flex items-center gap-2 rounded-2xl border border-border px-5 py-3 text-sm font-semibold text-foreground transition hover:bg-muted"
                    >
                      Novo comunicado
                      <ArrowRight size={18} />
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>
    </AppLayout>
  );
}
