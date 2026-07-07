import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { notFound, redirect } from "next/navigation";
import {
  CalendarDays,
  CheckCircle2,
  MapPin,
  MessageCircle,
  ShieldCheck,
  UserRound,
  XCircle,
} from "lucide-react";

export const dynamic = "force-dynamic";

const tiposRespostaPermitidos = [
  "CIENTE",
  "PARTICIPA",
  "NAO_PARTICIPA",
  "AUTORIZADO",
  "NAO_AUTORIZADO",
  "RESPOSTA_TEXTO",
] as const;

type TipoRespostaPermitido = (typeof tiposRespostaPermitidos)[number];

function isTipoRespostaPermitido(
  tipo: string,
): tipo is TipoRespostaPermitido {
  return tiposRespostaPermitidos.includes(tipo as TipoRespostaPermitido);
}

function formatDate(date?: Date | null) {
  if (!date) return "Não informado";

  return new Intl.DateTimeFormat("pt-BR", {
    timeZone: "UTC",
  }).format(date);
}

function formatDateTime(date?: Date | null) {
  if (!date) return "Não informado";

  return new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(date);
}

function formatMoney(valorCentavos?: number | null) {
  if (!valorCentavos) return null;

  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(valorCentavos / 100);
}

function getTipoRespostaLabel(tipo: string) {
  const labels: Record<string, string> = {
    CIENTE: "Confirmou ciência",
    PARTICIPA: "Confirmou participação",
    NAO_PARTICIPA: "Informou que não participará",
    AUTORIZADO: "Autorizou",
    NAO_AUTORIZADO: "Não autorizou",
    RESPOSTA_TEXTO: "Enviou resposta",
  };

  return labels[tipo] ?? tipo;
}

async function registrarResposta(formData: FormData) {
  "use server";

  const token = String(formData.get("token") || "");
  const tipoResposta = String(formData.get("tipoResposta") || "");
  const nomeRespondente = String(formData.get("nomeRespondente") || "").trim();
  const parentescoRespondente = String(
    formData.get("parentescoRespondente") || "",
  ).trim();
  const observacao = String(formData.get("observacao") || "").trim();
  const motivoNegativa = String(formData.get("motivoNegativa") || "").trim();

  if (!token) {
    throw new Error("Link de resposta inválido.");
  }

  if (!isTipoRespostaPermitido(tipoResposta)) {
    throw new Error("Tipo de resposta inválido.");
  }

  if (!nomeRespondente || !parentescoRespondente) {
    redirect(`/responder/${token}?erro=dados`);
  }

  if (
    (tipoResposta === "NAO_PARTICIPA" || tipoResposta === "NAO_AUTORIZADO") &&
    !motivoNegativa
  ) {
    redirect(`/responder/${token}?erro=motivo`);
  }

  const destinatario = await prisma.destinatarioComunicado.findUnique({
    where: {
      tokenResposta: token,
    },
    include: {
      comunicado: true,
      respostas: true,
    },
  });

  if (!destinatario) {
    throw new Error("Comunicado não encontrado.");
  }

  if (destinatario.status === "RESPONDIDO" || destinatario.respostas.length > 0) {
    redirect(`/responder/${token}?sucesso=1`);
  }

  await prisma.respostaComunicado.create({
    data: {
      tipo: tipoResposta,
      cienciaConfirmada:
        tipoResposta === "CIENTE" || destinatario.comunicado.requerCiencia,
      participa:
        tipoResposta === "PARTICIPA"
          ? true
          : tipoResposta === "NAO_PARTICIPA"
            ? false
            : null,
      autorizado:
        tipoResposta === "AUTORIZADO"
          ? true
          : tipoResposta === "NAO_AUTORIZADO"
            ? false
            : null,
      motivoNegativa: motivoNegativa || null,
      observacao: observacao || null,
      nomeRespondente,
      parentescoRespondente,
      escolaId: destinatario.escolaId,
      comunicadoId: destinatario.comunicadoId,
      destinatarioId: destinatario.id,
      alunoId: destinatario.alunoId,
      responsavelId: destinatario.responsavelId,
    },
  });

  await prisma.destinatarioComunicado.update({
    where: {
      id: destinatario.id,
    },
    data: {
      status: "RESPONDIDO",
      respondidoEm: new Date(),
      visualizadoEm: destinatario.visualizadoEm ?? new Date(),
    },
  });

  revalidatePath("/comunicacao");
  revalidatePath("/dashboard");
  revalidatePath("/relatorios");

  if (destinatario.alunoId) {
    revalidatePath(`/alunos/${destinatario.alunoId}`);
  }

  redirect(`/responder/${token}?sucesso=1`);
}

type ResponderPageProps = {
  params: Promise<{
    token: string;
  }>;
  searchParams?: Promise<{
    sucesso?: string;
    erro?: string;
  }>;
};

export default async function ResponderComunicadoPage({
  params,
  searchParams,
}: ResponderPageProps) {
  const { token } = await params;
  const query = searchParams ? await searchParams : {};

  const destinatario = await prisma.destinatarioComunicado.findUnique({
    where: {
      tokenResposta: token,
    },
    include: {
      aluno: true,
      responsavel: true,
      respostas: {
        orderBy: {
          dataResposta: "desc",
        },
      },
      comunicado: {
        include: {
          escola: true,
          turma: true,
          aluno: true,
        },
      },
    },
  });

  if (!destinatario) {
    notFound();
  }

  if (
    destinatario.status !== "RESPONDIDO" &&
    !destinatario.visualizadoEm &&
    (destinatario.status === "PENDENTE" || destinatario.status === "ENVIADO")
  ) {
    await prisma.destinatarioComunicado.update({
      where: {
        id: destinatario.id,
      },
      data: {
        status: "VISUALIZADO",
        visualizadoEm: new Date(),
      },
    });
  }

  const comunicado = destinatario.comunicado;
  const respostaExistente = destinatario.respostas[0];
  const jaRespondido =
    destinatario.status === "RESPONDIDO" || Boolean(respostaExistente);

  const valorFormatado = formatMoney(comunicado.valorCentavos);

  const mostrarBotaoCiencia =
    comunicado.requerCiencia ||
    (!comunicado.requerParticipacao &&
      !comunicado.requerAutorizacao &&
      !comunicado.permiteRespostaTexto);

  return (
    <main className="min-h-screen bg-muted px-4 py-8 text-foreground">
      <div className="mx-auto max-w-3xl">
        <div className="mb-6 text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-3xl bg-primary text-primary-foreground">
            <MessageCircle size={26} />
          </div>

          <p className="text-sm font-medium text-muted-foreground">
            {comunicado.escola.nome}
          </p>

          <h1 className="mt-2 text-3xl font-semibold tracking-tight">
            Comunicação da escola
          </h1>

          <p className="mt-2 text-sm text-muted-foreground">
            Responda este comunicado de forma simples e segura.
          </p>
        </div>

        <section className="rounded-3xl border border-border bg-card p-6 shadow-sm">
          <div className="mb-5 flex flex-wrap items-center gap-2">
            <span className="rounded-full bg-muted px-3 py-1 text-xs font-semibold text-foreground">
              {comunicado.tipo}
            </span>

            {comunicado.requerCiencia && (
              <span className="rounded-full bg-muted px-3 py-1 text-xs font-semibold text-muted-foreground">
                Ciência digital
              </span>
            )}

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
          </div>

          <h2 className="text-2xl font-semibold text-foreground">
            {comunicado.titulo}
          </h2>

          <div className="mt-4 whitespace-pre-wrap rounded-2xl bg-background p-4 text-sm leading-7 text-muted-foreground">
            {comunicado.conteudo}
          </div>

          {(comunicado.dataEvento ||
            comunicado.horaEvento ||
            comunicado.localEvento ||
            valorFormatado) && (
            <div className="mt-5 grid gap-3 md:grid-cols-2">
              <div className="rounded-2xl bg-muted p-4">
                <div className="mb-2 flex items-center gap-2 text-sm font-semibold text-foreground">
                  <CalendarDays size={18} />
                  Data e horário
                </div>

                <p className="text-sm text-muted-foreground">
                  {formatDate(comunicado.dataEvento)}
                  {comunicado.horaEvento ? ` às ${comunicado.horaEvento}` : ""}
                </p>
              </div>

              <div className="rounded-2xl bg-muted p-4">
                <div className="mb-2 flex items-center gap-2 text-sm font-semibold text-foreground">
                  <MapPin size={18} />
                  Local
                </div>

                <p className="text-sm text-muted-foreground">
                  {comunicado.localEvento || "Não informado"}
                </p>
              </div>

              {valorFormatado && (
                <div className="rounded-2xl bg-muted p-4 md:col-span-2">
                  <p className="text-sm font-semibold text-foreground">
                    Valor informado
                  </p>

                  <p className="mt-1 text-sm text-muted-foreground">
                    {valorFormatado}
                  </p>
                </div>
              )}
            </div>
          )}

          <div className="mt-5 rounded-2xl bg-muted p-4">
            <div className="mb-2 flex items-center gap-2 text-sm font-semibold text-foreground">
              <UserRound size={18} />
              Aluno
            </div>

            <p className="text-sm text-muted-foreground">
              {destinatario.aluno?.nome ||
                comunicado.aluno?.nome ||
                "Aluno não informado"}
            </p>

            {comunicado.turma?.nome && (
              <p className="mt-1 text-xs text-muted-foreground">
                Turma: {comunicado.turma.nome}
              </p>
            )}
          </div>
        </section>

        <section className="mt-5 rounded-3xl border border-border bg-card p-6 shadow-sm">
          {jaRespondido ? (
            <div className="text-center">
              <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-3xl bg-muted text-foreground">
                <CheckCircle2 size={28} />
              </div>

              <h2 className="text-xl font-semibold text-foreground">
                Resposta registrada
              </h2>

              <p className="mt-2 text-sm text-muted-foreground">
                Obrigado. A escola já recebeu sua confirmação.
              </p>

              {respostaExistente && (
                <div className="mt-5 rounded-2xl bg-muted p-4 text-left">
                  <p className="text-sm font-semibold text-foreground">
                    {getTipoRespostaLabel(respostaExistente.tipo)}
                  </p>

                  <p className="mt-1 text-sm text-muted-foreground">
                    Respondido por{" "}
                    {respostaExistente.nomeRespondente || "responsável"} em{" "}
                    {formatDateTime(respostaExistente.dataResposta)}.
                  </p>

                  {respostaExistente.motivoNegativa && (
                    <p className="mt-3 text-sm text-muted-foreground">
                      Motivo: {respostaExistente.motivoNegativa}
                    </p>
                  )}

                  {respostaExistente.observacao && (
                    <p className="mt-3 text-sm text-muted-foreground">
                      Observação: {respostaExistente.observacao}
                    </p>
                  )}
                </div>
              )}
            </div>
          ) : (
            <>
              <div className="mb-5">
                <h2 className="text-xl font-semibold text-foreground">
                  Registrar resposta
                </h2>

                <p className="mt-2 text-sm leading-6 text-muted-foreground">
                  Preencha seus dados e selecione uma das opções abaixo.
                </p>
              </div>

              {query.erro === "dados" && (
                <div className="mb-4 rounded-2xl border border-border bg-muted p-4 text-sm font-semibold text-foreground">
                  Informe seu nome e parentesco com o aluno para continuar.
                </div>
              )}

              {query.erro === "motivo" && (
                <div className="mb-4 rounded-2xl border border-border bg-muted p-4 text-sm font-semibold text-foreground">
                  Para negar participação ou autorização, informe o motivo.
                </div>
              )}

              <form action={registrarResposta} className="space-y-4">
                <input type="hidden" name="token" value={token} />

                <div className="grid gap-4 md:grid-cols-2">
                  <label className="block">
                    <span className="text-sm font-medium text-foreground">
                      Seu nome
                    </span>

                    <input
                      name="nomeRespondente"
                      required
                      className="mt-2 w-full rounded-2xl border border-border bg-background px-4 py-3 text-sm outline-none transition focus:border-primary"
                      placeholder="Ex: Maria Silva"
                    />
                  </label>

                  <label className="block">
                    <span className="text-sm font-medium text-foreground">
                      Parentesco
                    </span>

                    <input
                      name="parentescoRespondente"
                      required
                      className="mt-2 w-full rounded-2xl border border-border bg-background px-4 py-3 text-sm outline-none transition focus:border-primary"
                      placeholder="Ex: mãe, pai, avó, responsável"
                    />
                  </label>
                </div>

                <label className="block">
                  <span className="text-sm font-medium text-foreground">
                    Observação, se desejar
                  </span>

                  <textarea
                    name="observacao"
                    rows={3}
                    className="mt-2 w-full rounded-2xl border border-border bg-background px-4 py-3 text-sm outline-none transition focus:border-primary"
                    placeholder="Escreva uma observação para a escola, se necessário."
                  />
                </label>

                <label className="block">
                  <span className="text-sm font-medium text-foreground">
                    Motivo da negativa
                  </span>

                  <textarea
                    name="motivoNegativa"
                    rows={3}
                    className="mt-2 w-full rounded-2xl border border-border bg-background px-4 py-3 text-sm outline-none transition focus:border-primary"
                    placeholder="Preencha este campo se escolher não participar ou não autorizar."
                  />
                </label>

                <div className="flex flex-wrap gap-3 pt-2">
                  {mostrarBotaoCiencia && (
                    <button
                      type="submit"
                      name="tipoResposta"
                      value="CIENTE"
                      className="inline-flex items-center gap-2 rounded-2xl bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground transition hover:opacity-90"
                    >
                      <ShieldCheck size={18} />
                      Estou ciente
                    </button>
                  )}

                  {comunicado.requerParticipacao && (
                    <>
                      <button
                        type="submit"
                        name="tipoResposta"
                        value="PARTICIPA"
                        className="inline-flex items-center gap-2 rounded-2xl bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground transition hover:opacity-90"
                      >
                        <CheckCircle2 size={18} />
                        Vai participar
                      </button>

                      <button
                        type="submit"
                        name="tipoResposta"
                        value="NAO_PARTICIPA"
                        className="inline-flex items-center gap-2 rounded-2xl border border-border px-5 py-3 text-sm font-semibold text-foreground transition hover:bg-muted"
                      >
                        <XCircle size={18} />
                        Não vai participar
                      </button>
                    </>
                  )}

                  {comunicado.requerAutorizacao && (
                    <>
                      <button
                        type="submit"
                        name="tipoResposta"
                        value="AUTORIZADO"
                        className="inline-flex items-center gap-2 rounded-2xl bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground transition hover:opacity-90"
                      >
                        <CheckCircle2 size={18} />
                        Autorizo
                      </button>

                      <button
                        type="submit"
                        name="tipoResposta"
                        value="NAO_AUTORIZADO"
                        className="inline-flex items-center gap-2 rounded-2xl border border-border px-5 py-3 text-sm font-semibold text-foreground transition hover:bg-muted"
                      >
                        <XCircle size={18} />
                        Não autorizo
                      </button>
                    </>
                  )}

                  {comunicado.permiteRespostaTexto && (
                    <button
                      type="submit"
                      name="tipoResposta"
                      value="RESPOSTA_TEXTO"
                      className="inline-flex items-center gap-2 rounded-2xl bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground transition hover:opacity-90"
                    >
                      <MessageCircle size={18} />
                      Enviar resposta
                    </button>
                  )}
                </div>
              </form>
            </>
          )}
        </section>

        <p className="mt-6 text-center text-xs text-muted-foreground">
          Lumina OS — Comunicação Inteligente
        </p>
      </div>
    </main>
  );
}