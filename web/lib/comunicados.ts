import "server-only";

import { prisma } from "@/lib/prisma";
import { getApplicationBaseUrl } from "@/lib/application-url";
import { comunicadoTemplate } from "@/lib/email/templates";
import { sendTransactionalEmail } from "@/lib/email/service";
import { enviarPushParaUsuarios, usuariosDeResponsaveis } from "@/lib/push";

export const TIPOS_RESPOSTA_PERMITIDOS = [
  "CIENTE",
  "PARTICIPA",
  "NAO_PARTICIPA",
  "AUTORIZADO",
  "NAO_AUTORIZADO",
  "RESPOSTA_TEXTO",
] as const;

export type TipoRespostaPermitido = (typeof TIPOS_RESPOSTA_PERMITIDOS)[number];

export function isTipoRespostaPermitido(
  tipo: string,
): tipo is TipoRespostaPermitido {
  return TIPOS_RESPOSTA_PERMITIDOS.includes(tipo as TipoRespostaPermitido);
}

export type RegistrarRespostaComunicadoInput = {
  destinatarioId: string;
  tipoResposta: TipoRespostaPermitido;
  nomeRespondente: string;
  parentescoRespondente: string;
  observacao?: string | null;
  motivoNegativa?: string | null;
};

export async function registrarRespostaComunicado(
  input: RegistrarRespostaComunicadoInput,
) {
  const destinatario = await prisma.destinatarioComunicado.findUnique({
    where: { id: input.destinatarioId },
    include: {
      comunicado: true,
      respostas: true,
    },
  });

  if (!destinatario) {
    throw new Error("Comunicado não encontrado.");
  }

  if (
    destinatario.status === "RESPONDIDO" ||
    destinatario.respostas.length > 0
  ) {
    return { alreadyAnswered: true as const };
  }

  await prisma.respostaComunicado.create({
    data: {
      tipo: input.tipoResposta,
      cienciaConfirmada:
        input.tipoResposta === "CIENTE" || destinatario.comunicado.requerCiencia,
      participa:
        input.tipoResposta === "PARTICIPA"
          ? true
          : input.tipoResposta === "NAO_PARTICIPA"
            ? false
            : null,
      autorizado:
        input.tipoResposta === "AUTORIZADO"
          ? true
          : input.tipoResposta === "NAO_AUTORIZADO"
            ? false
            : null,
      motivoNegativa: input.motivoNegativa || null,
      observacao: input.observacao || null,
      nomeRespondente: input.nomeRespondente,
      parentescoRespondente: input.parentescoRespondente,
      escolaId: destinatario.escolaId,
      comunicadoId: destinatario.comunicadoId,
      destinatarioId: destinatario.id,
      alunoId: destinatario.alunoId,
      responsavelId: destinatario.responsavelId,
    },
  });

  await prisma.destinatarioComunicado.update({
    where: { id: destinatario.id },
    data: {
      status: "RESPONDIDO",
      respondidoEm: new Date(),
      visualizadoEm: destinatario.visualizadoEm ?? new Date(),
    },
  });

  return { alreadyAnswered: false as const };
}

export async function enviarEmailsComunicado(input: {
  comunicadoId: string;
  criadoPorUsuarioId?: string | null;
}) {
  const comunicado = await prisma.comunicado.findUnique({
    where: { id: input.comunicadoId },
    include: { escola: true },
  });

  if (!comunicado) {
    return;
  }

  const destinatarios = await prisma.destinatarioComunicado.findMany({
    where: { comunicadoId: input.comunicadoId },
  });

  if (destinatarios.length === 0) {
    return;
  }

  const baseUrl = await getApplicationBaseUrl();

  for (const destinatario of destinatarios) {
    if (!destinatario.email || !destinatario.tokenResposta) continue;

    const mensagem = comunicadoTemplate({
      name: destinatario.nomeResponsavel || "responsável",
      schoolName: comunicado.escola.nome,
      title: comunicado.titulo,
      responderUrl: `${baseUrl}/responder/${destinatario.tokenResposta}`,
    });

    await sendTransactionalEmail({
      escolaId: comunicado.escolaId,
      criadoPorUsuarioId: input.criadoPorUsuarioId,
      tipo: "COMUNICADO",
      destinatario: destinatario.email,
      assunto: mensagem.assunto,
      conteudoTexto: mensagem.conteudoTexto,
      conteudoHtml: mensagem.conteudoHtml,
    });
  }

  // Alem do e-mail, avisa no celular de quem instalou o portal.
  const responsavelIds = Array.from(
    new Set(
      destinatarios
        .map((destinatario) => destinatario.responsavelId)
        .filter((id): id is string => Boolean(id)),
    ),
  );

  const usuarioIds = await usuariosDeResponsaveis(responsavelIds);

  await enviarPushParaUsuarios(usuarioIds, {
    titulo: comunicado.escola.nome,
    corpo: `Novo comunicado: ${comunicado.titulo}`,
    url: "/portal-familia/comunicados",
    tag: `comunicado-${comunicado.id}`,
  });
}
