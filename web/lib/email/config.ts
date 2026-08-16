import "server-only";

import { prisma } from "@/lib/prisma";
import { descriptografarSegredo } from "@/lib/security/segredos";
import type { CredenciaisSmtp } from "@/lib/email/smtp-provider";

/**
 * Le a configuracao de e-mail salva pela escola em Configuracoes.
 * Quando existe e esta ativa, ela tem prioridade sobre as variaveis de
 * ambiente, para que a escola consiga configurar sozinha.
 */
export async function getCredenciaisSmtpDaEscola(
  escolaId: string,
): Promise<CredenciaisSmtp | null> {
  const configuracao = await prisma.configuracaoEmail.findUnique({
    where: { escolaId },
  });

  if (!configuracao || !configuracao.ativo) {
    return null;
  }

  const senha = descriptografarSegredo(configuracao.senha);

  if (!senha) {
    return null;
  }

  return {
    remetente: configuracao.remetente,
    usuario: configuracao.usuario,
    senha,
    host: configuracao.host,
    porta: configuracao.porta,
  };
}
