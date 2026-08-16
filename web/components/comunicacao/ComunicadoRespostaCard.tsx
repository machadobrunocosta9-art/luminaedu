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

  const TIPO_LABELS: Record<string, string> = {
    SIMPLES: "Comunicado",
    CIENCIA: "Ciência",
    EVENTO: "Evento",
    AUTORIZACAO: "Autorização",
    PAGAMENTO: "Pagamento",
  };

  return (
    <>
      <section className="overflow-hidden rounded-[22px] bg-white shadow-[0_1px_2px_rgba(0,0,0,0.04),0_1px_8px_rgba(0,0,0,0.04)]">
        <div className="p-5">
          <div className="mb-3 flex flex-wrap items-center gap-2">
            <span className="rounded-full bg-primary/10 px-2.5 py-1 text-[11px] font-semibold text-primary">
              {TIPO_LABELS[comunicado.tipo] ?? comunicado.tipo}
            </span>

            {comunicado.requerCiencia && (
              <span className="rounded-full bg-[#f5f5f7] px-2.5 py-1 text-[11px] font-medium text-[#8e8e93]">
                Ciência digital
              </span>
            )}

            {comunicado.requerParticipacao && (
              <span className="rounded-full bg-[#f5f5f7] px-2.5 py-1 text-[11px] font-medium text-[#8e8e93]">
                Participação
              </span>
            )}

            {comunicado.requerAutorizacao && (
              <span className="rounded-full bg-[#f5f5f7] px-2.5 py-1 text-[11px] font-medium text-[#8e8e93]">
                Autorização
              </span>
            )}
          </div>

          <h2 className="text-[19px] font-semibold leading-tight text-foreground">
            {comunicado.titulo}
          </h2>

          <div className="mt-3 whitespace-pre-wrap text-[14px] leading-6 text-[#6b7280]">
            {comunicado.conteudo}
          </div>
        </div>

        {(comunicado.dataEvento ||
          comunicado.horaEvento ||
          comunicado.localEvento ||
          valorFormatado) && (
          <div className="grid gap-px bg-black/5 sm:grid-cols-2">
            <div className="bg-white p-4">
              <div className="mb-1.5 flex items-center gap-2 text-[12px] font-semibold uppercase tracking-wide text-[#8e8e93]">
                <CalendarDays size={15} />
                Data e horário
              </div>

              <p className="text-[14px] text-foreground">
                {formatDate(comunicado.dataEvento)}
                {comunicado.horaEvento ? ` às ${comunicado.horaEvento}` : ""}
              </p>
            </div>

            <div className="bg-white p-4">
              <div className="mb-1.5 flex items-center gap-2 text-[12px] font-semibold uppercase tracking-wide text-[#8e8e93]">
                <MapPin size={15} />
                Local
              </div>

              <p className="text-[14px] text-foreground">
                {comunicado.localEvento || "Não informado"}
              </p>
            </div>

            {valorFormatado && (
              <div className="bg-white p-4 sm:col-span-2">
                <p className="text-[12px] font-semibold uppercase tracking-wide text-[#8e8e93]">
                  Valor informado
                </p>

                <p className="mt-1 text-[14px] font-medium text-foreground">
                  {valorFormatado}
                </p>
              </div>
            )}
          </div>
        )}

        {(alunoNome || turmaNome) && (
          <div className="flex items-center gap-2.5 border-t border-black/5 px-5 py-3.5">
            <UserRound size={15} className="shrink-0 text-[#8e8e93]" />
            <p className="text-[13px] text-[#8e8e93]">
              {alunoNome || "Aluno não informado"}
              {turmaNome ? ` · ${turmaNome}` : ""}
            </p>
          </div>
        )}
      </section>

      <section className="mt-3 rounded-[22px] bg-white p-5 shadow-[0_1px_2px_rgba(0,0,0,0.04),0_1px_8px_rgba(0,0,0,0.04)]">
        {jaRespondido ? (
          <div className="text-center">
            <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-emerald-50 text-emerald-600">
              <CheckCircle2 size={24} />
            </div>

            <h2 className="text-[17px] font-semibold text-foreground">
              Resposta registrada
            </h2>

            <p className="mt-1 text-[13px] text-[#8e8e93]">
              Obrigado. A escola já recebeu sua confirmação.
            </p>

            {respostaExistente && (
              <div className="mt-4 rounded-2xl bg-[#f5f5f7] p-4 text-left">
                <p className="text-[14px] font-semibold text-foreground">
                  {getTipoRespostaLabel(respostaExistente.tipo)}
                </p>

                <p className="mt-1 text-[13px] text-[#8e8e93]">
                  Respondido por{" "}
                  {respostaExistente.nomeRespondente || "responsável"} em{" "}
                  {formatDateTime(respostaExistente.dataResposta)}.
                </p>

                {respostaExistente.motivoNegativa && (
                  <p className="mt-2 text-[13px] text-[#8e8e93]">
                    Motivo: {respostaExistente.motivoNegativa}
                  </p>
                )}

                {respostaExistente.observacao && (
                  <p className="mt-2 text-[13px] text-[#8e8e93]">
                    Observação: {respostaExistente.observacao}
                  </p>
                )}
              </div>
            )}
          </div>
        ) : (
          <>
            <div className="mb-4">
              <h2 className="text-[17px] font-semibold text-foreground">
                Registrar resposta
              </h2>

              <p className="mt-1 text-[13px] text-[#8e8e93]">
                Preencha seus dados e escolha uma das opções.
              </p>
            </div>

            {erro === "dados" && (
              <div className="mb-4 rounded-2xl bg-red-50 p-3 text-[13px] font-medium text-red-600">
                Informe seu nome e parentesco com o aluno para continuar.
              </div>
            )}

            {erro === "motivo" && (
              <div className="mb-4 rounded-2xl bg-red-50 p-3 text-[13px] font-medium text-red-600">
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
                  <span className="text-[13px] font-medium text-[#8e8e93]">
                    Seu nome
                  </span>

                  <input
                    name="nomeRespondente"
                    required
                    className="mt-2 w-full rounded-xl bg-[#f5f5f7] px-4 py-3 text-[15px] outline-none transition focus:ring-2 focus:ring-primary/30"
                    placeholder="Ex: Maria Silva"
                  />
                </label>

                <label className="block">
                  <span className="text-[13px] font-medium text-[#8e8e93]">
                    Parentesco
                  </span>

                  <input
                    name="parentescoRespondente"
                    required
                    className="mt-2 w-full rounded-xl bg-[#f5f5f7] px-4 py-3 text-[15px] outline-none transition focus:ring-2 focus:ring-primary/30"
                    placeholder="Ex: mãe, pai, avó, responsável"
                  />
                </label>
              </div>

              <label className="block">
                <span className="text-[13px] font-medium text-[#8e8e93]">
                  Observação, se desejar
                </span>

                <textarea
                  name="observacao"
                  rows={3}
                  className="mt-2 w-full rounded-xl bg-[#f5f5f7] px-4 py-3 text-[15px] outline-none transition focus:ring-2 focus:ring-primary/30"
                  placeholder="Escreva uma observação para a escola, se necessário."
                />
              </label>

              {(comunicado.requerParticipacao ||
                comunicado.requerAutorizacao) && (
                <label className="block">
                  <span className="text-[13px] font-medium text-[#8e8e93]">
                    Motivo da negativa
                  </span>

                  <textarea
                    name="motivoNegativa"
                    rows={3}
                    className="mt-2 w-full rounded-xl bg-[#f5f5f7] px-4 py-3 text-[15px] outline-none transition focus:ring-2 focus:ring-primary/30"
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
                    className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl bg-primary px-5 py-3.5 text-[15px] font-semibold text-primary-foreground transition active:opacity-80"
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
                      className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl bg-primary px-5 py-3.5 text-[15px] font-semibold text-primary-foreground transition active:opacity-80"
                    >
                      <CheckCircle2 size={18} />
                      Vai participar
                    </button>

                    <button
                      type="submit"
                      name="tipoResposta"
                      value="NAO_PARTICIPA"
                      className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl bg-[#f5f5f7] px-5 py-3.5 text-[15px] font-semibold text-foreground transition active:opacity-80"
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
                      className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl bg-primary px-5 py-3.5 text-[15px] font-semibold text-primary-foreground transition active:opacity-80"
                    >
                      <CheckCircle2 size={18} />
                      Autorizo
                    </button>

                    <button
                      type="submit"
                      name="tipoResposta"
                      value="NAO_AUTORIZADO"
                      className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl bg-[#f5f5f7] px-5 py-3.5 text-[15px] font-semibold text-foreground transition active:opacity-80"
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
                    className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl bg-primary px-5 py-3.5 text-[15px] font-semibold text-primary-foreground transition active:opacity-80"
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
