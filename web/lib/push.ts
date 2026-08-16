import "server-only";

import webpush from "web-push";
import { prisma } from "@/lib/prisma";

let configurado: boolean | null = null;

function garantirConfiguracao() {
  if (configurado !== null) {
    return configurado;
  }

  const publicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY?.trim();
  const privateKey = process.env.VAPID_PRIVATE_KEY?.trim();
  const contato = process.env.EMAIL_FROM?.trim() || "mailto:contato@lumina.app";

  if (!publicKey || !privateKey) {
    configurado = false;
    return configurado;
  }

  const assunto = contato.includes("@")
    ? `mailto:${contato.replace(/^.*<|>.*$/g, "").trim()}`
    : contato;

  webpush.setVapidDetails(
    assunto.startsWith("mailto:") ? assunto : `mailto:${assunto}`,
    publicKey,
    privateKey,
  );

  configurado = true;
  return configurado;
}

export type NotificacaoPush = {
  titulo: string;
  corpo: string;
  url?: string;
  tag?: string;
};

/**
 * Envia uma notificacao para todos os dispositivos inscritos dos usuarios
 * informados. Inscricoes invalidas (dispositivo desinstalou o app ou
 * revogou a permissao) sao removidas automaticamente.
 */
export async function enviarPushParaUsuarios(
  usuarioIds: string[],
  notificacao: NotificacaoPush,
) {
  if (usuarioIds.length === 0 || !garantirConfiguracao()) {
    return { enviadas: 0 };
  }

  const inscricoes = await prisma.inscricaoPush.findMany({
    where: { usuarioId: { in: usuarioIds } },
  });

  if (inscricoes.length === 0) {
    return { enviadas: 0 };
  }

  const payload = JSON.stringify(notificacao);
  const endpointsInvalidos: string[] = [];
  let enviadas = 0;

  await Promise.all(
    inscricoes.map(async (inscricao) => {
      try {
        await webpush.sendNotification(
          {
            endpoint: inscricao.endpoint,
            keys: { p256dh: inscricao.p256dh, auth: inscricao.auth },
          },
          payload,
        );
        enviadas += 1;
      } catch (error) {
        const status = (error as { statusCode?: number }).statusCode;

        if (status === 404 || status === 410) {
          endpointsInvalidos.push(inscricao.endpoint);
        }
      }
    }),
  );

  if (endpointsInvalidos.length > 0) {
    await prisma.inscricaoPush.deleteMany({
      where: { endpoint: { in: endpointsInvalidos } },
    });
  }

  return { enviadas };
}

/**
 * Descobre as contas de responsaveis ligadas a uma lista de responsavelId
 * para poder notificar as familias.
 */
export async function usuariosDeResponsaveis(responsavelIds: string[]) {
  if (responsavelIds.length === 0) return [];

  const usuarios = await prisma.usuario.findMany({
    where: {
      responsavelId: { in: responsavelIds },
      papel: "RESPONSAVEL",
      status: "ATIVO",
    },
    select: { id: true },
  });

  return usuarios.map((usuario) => usuario.id);
}
