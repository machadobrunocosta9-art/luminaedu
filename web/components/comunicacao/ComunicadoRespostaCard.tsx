import {
  CalendarDays,
  CheckCircle2,
  MapPin,
  MessageCircle,
  ShieldCheck,
  UserRound,
  XCircle,
} from "lucide-react";

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

export type ComunicadoRespostaCardComunicado = {
  tipo: string;
  titulo: string;
  conteudo: string;
  dataEvento?: Date | null;
  horaEvento?: string | null;
  localEvento?: string | null;
  valorCentavos?: number | null;
  requerCiencia: boolean;
  requerParticipacao: boolean;
  requerAutorizacao: boolean;
  permiteRespostaTexto: boolean;
};

export type ComunicadoRespostaCardResposta = {
  tipo: string;
  nomeRespondente?: string | null;
  dataResposta: Date;
  motivoNegativa?: string | null;
  observacao?: string | null;
};

export default function ComunicadoRespostaCard({
  comunicado,
  alunoNome,
  turmaNome,
  jaRespondido,
  respostaExistente,
  action,
  hiddenFieldName,
  hiddenFieldValue,
  erro,
}: {
  comunicado: ComunicadoRespostaCardComunicado;
  alunoNome?: string | null;
  turmaNome?: string | null;
  jaRespondido: boolean;
  respostaExistente?: ComunicadoRespostaCardResposta | null;
  action: (formData: FormData) => void | Promise<void>;
  hiddenFieldName: string;
  hiddenFieldValue: string;
  erro?: "dados" | "motivo" | null;
}) {
  const valorFormatado = formatMoney(comunicado.valorCentavos);

  const mostrarBotaoCiencia =
    !comunicado.requerParticipacao &&
    !comunicado.requerAutorizacao &&
    (comunicado.requerCiencia ||
      (!comunicado.permiteRespostaTexto &&
        !comunicado.requerParticipacao &&
        !comunicado.requerAutorizacao));

  const mostrarBotaoRespostaTexto =
    comunicado.permiteRespostaTexto &&
    !comunicado.requerParticipacao &&
    !comunicado.requerAutorizacao;

  return (
    <>
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

        {(alunoNome || turmaNome) && (
          <div className="mt-5 rounded-2xl bg-muted p-4">
            <div className="mb-2 flex items-center gap-2 text-sm font-semibold text-foreground">
              <UserRound size={18} />
              Aluno
            </div>

            <p className="text-sm text-muted-foreground">
              {alunoNome || "Aluno não informado"}
            </p>

            {turmaNome && (
              <p className="mt-1 text-xs text-muted-foreground">
                Turma: {turmaNome}
              </p>
            )}
          </div>
        )}
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

            {erro === "dados" && (
              <div className="mb-4 rounded-2xl border border-border bg-muted p-4 text-sm font-semibold text-foreground">
                Informe seu nome e parentesco com o aluno para continuar.
              </div>
            )}

            {erro === "motivo" && (
              <div className="mb-4 rounded-2xl border border-border bg-muted p-4 text-sm font-semibold text-foreground">
                Para negar participação ou autorização, informe o motivo.
              </div>
            )}

            <form action={action} className="space-y-4">
              <input
                type="hidden"
                name={hiddenFieldName}
                value={hiddenFieldValue}
              />

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

              {(comunicado.requerParticipacao ||
                comunicado.requerAutorizacao) && (
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
              )}

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

                {mostrarBotaoRespostaTexto && (
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
    </>
  );
}
