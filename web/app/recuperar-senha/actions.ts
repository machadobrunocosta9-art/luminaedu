"use server";

import { getApplicationBaseUrl } from "@/lib/application-url";
import { passwordRecoveryTemplate } from "@/lib/email/templates";
import { sendTransactionalEmail } from "@/lib/email/service";
import { prisma } from "@/lib/prisma";
import {
  generateSecureToken,
  hashToken,
  normalizeEmail,
} from "@/lib/security/tokens";

export type PasswordRecoveryRequestState = {
  message: string | null;
};

const GENERIC_RESPONSE =
  "Se existir uma conta ativa para este e-mail, enviaremos as instruções de recuperação.";

export async function requestPasswordRecoveryAction(
  _previousState: PasswordRecoveryRequestState,
  formData: FormData,
): Promise<PasswordRecoveryRequestState> {
  const suppliedEmail = formData.get("email");

  if (typeof suppliedEmail !== "string") {
    return { message: GENERIC_RESPONSE };
  }

  const email = normalizeEmail(suppliedEmail);

  try {
    const user = await prisma.usuario.findUnique({
      where: { email },
      select: {
        id: true,
        nome: true,
        email: true,
        escolaId: true,
        status: true,
      },
    });

    if (user?.status === "ATIVO") {
      const token = generateSecureToken();
      const tokenHash = hashToken(token);
      const expiresAt = new Date(Date.now() + 60 * 60 * 1000);

      await prisma.$transaction(async (tx) => {
        await tx.recuperacaoSenha.updateMany({
          where: {
            usuarioId: user.id,
            utilizadoEm: null,
            revogadoEm: null,
          },
          data: { revogadoEm: new Date() },
        });
        await tx.recuperacaoSenha.create({
          data: {
            tokenHash,
            expiraEm: expiresAt,
            escolaId: user.escolaId,
            usuarioId: user.id,
          },
        });
        await tx.registroAuditoria.create({
          data: {
            acao: "RECUPERACAO_SENHA_SOLICITADA",
            resultado: "SUCESSO",
            escolaId: user.escolaId,
            usuarioId: user.id,
            entidade: "Usuario",
            entidadeId: user.id,
          },
        });
      });

      const recoveryUrl = `${await getApplicationBaseUrl()}/recuperar-senha/${token}`;
      const message = passwordRecoveryTemplate({
        name: user.nome,
        recoveryUrl,
      });
      await sendTransactionalEmail({
        escolaId: user.escolaId,
        criadoPorUsuarioId: user.id,
        tipo: "RECUPERACAO_SENHA",
        destinatario: user.email,
        assunto: message.assunto,
        conteudoTexto: message.conteudoTexto,
        conteudoHtml: message.conteudoHtml,
      });
    }
  } catch {
    // A resposta permanece genérica e não revela existência de conta.
  }

  return { message: GENERIC_RESPONSE };
}
