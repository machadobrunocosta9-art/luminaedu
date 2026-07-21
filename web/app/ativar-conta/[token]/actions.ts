"use server";

import { redirect } from "next/navigation";
import { recordAudit } from "@/lib/audit";
import { createDatabaseUserSession } from "@/lib/user-auth";
import { accountConfirmationTemplate } from "@/lib/email/templates";
import { sendTransactionalEmail } from "@/lib/email/service";
import { prisma } from "@/lib/prisma";
import {
  hashPassword,
  validateNewPassword,
} from "@/lib/security/password";
import { hashToken, normalizeEmail } from "@/lib/security/tokens";
import type { UserRole } from "@/lib/security/permissions";

export type ActivationState = {
  error: string | null;
};

class InvitationConsumptionError extends Error {}

export async function activateAccountAction(
  _previousState: ActivationState,
  formData: FormData,
): Promise<ActivationState> {
  const token = formData.get("token");
  const password = formData.get("password");
  const passwordConfirmation = formData.get("passwordConfirmation");

  if (
    typeof token !== "string" ||
    typeof password !== "string" ||
    typeof passwordConfirmation !== "string"
  ) {
    return { error: "Não foi possível ativar a conta." };
  }

  const passwordError = validateNewPassword(password);

  if (passwordError) {
    return { error: passwordError };
  }

  if (password !== passwordConfirmation) {
    return { error: "As senhas não coincidem." };
  }

  const tokenHash = hashToken(token);
  const invitation = await prisma.conviteAcesso.findUnique({
    where: { tokenHash },
    select: {
      id: true,
      status: true,
      expiraEm: true,
      utilizadoEm: true,
      canceladoEm: true,
      escolaId: true,
      responsavelId: true,
      responsavel: {
        select: { nome: true, email: true, escolaId: true },
      },
    },
  });

  if (
    !invitation ||
    invitation.status !== "PENDENTE" ||
    invitation.utilizadoEm ||
    invitation.canceladoEm ||
    invitation.expiraEm <= new Date() ||
    invitation.responsavel.escolaId !== invitation.escolaId ||
    !invitation.responsavel.email
  ) {
    return { error: "Este convite é inválido ou não está mais disponível." };
  }

  const email = normalizeEmail(invitation.responsavel.email);
  const senhaHash = await hashPassword(password);

  let user: {
    id: string;
    nome: string;
    email: string;
    papel: UserRole;
    escolaId: string;
    responsavelId: string | null;
  };

  try {
    user = await prisma.$transaction(async (tx) => {
      const consumed = await tx.conviteAcesso.updateMany({
        where: {
          id: invitation.id,
          tokenHash,
          escolaId: invitation.escolaId,
          responsavelId: invitation.responsavelId,
          status: "PENDENTE",
          utilizadoEm: null,
          canceladoEm: null,
          expiraEm: { gt: new Date() },
        },
        data: {
          status: "UTILIZADO",
          utilizadoEm: new Date(),
        },
      });

      if (consumed.count !== 1) {
        throw new InvitationConsumptionError();
      }

      const existing = await tx.usuario.findFirst({
        where: {
          OR: [
            { email },
            { responsavelId: invitation.responsavelId },
          ],
        },
        select: {
          id: true,
          papel: true,
          escolaId: true,
          responsavelId: true,
        },
      });

      if (
        existing &&
        (existing.papel !== "RESPONSAVEL" ||
          existing.escolaId !== invitation.escolaId ||
          existing.responsavelId !== invitation.responsavelId)
      ) {
        throw new InvitationConsumptionError();
      }

      const activatedUser = existing
        ? await tx.usuario.update({
            where: { id: existing.id },
            data: {
              nome: invitation.responsavel.nome,
              email,
              senhaHash,
              status: "ATIVO",
            },
          })
        : await tx.usuario.create({
            data: {
              nome: invitation.responsavel.nome,
              email,
              senhaHash,
              papel: "RESPONSAVEL",
              status: "ATIVO",
              escolaId: invitation.escolaId,
              responsavelId: invitation.responsavelId,
            },
          });

      await tx.conviteAcesso.update({
        where: { id: invitation.id },
        data: { usuarioAtivadoId: activatedUser.id },
      });

      await tx.registroAuditoria.create({
        data: {
          acao: "CONTA_RESPONSAVEL_ATIVADA",
          resultado: "SUCESSO",
          escolaId: invitation.escolaId,
          usuarioId: activatedUser.id,
          entidade: "Usuario",
          entidadeId: activatedUser.id,
        },
      });

      return activatedUser;
    });

  } catch (error) {
    if (error instanceof InvitationConsumptionError) {
      return { error: "Este convite é inválido ou já foi utilizado." };
    }

    await recordAudit({
      acao: "ATIVACAO_CONTA",
      resultado: "FALHA",
      escolaId: invitation.escolaId,
      entidade: "ConviteAcesso",
      entidadeId: invitation.id,
    });
    return { error: "Não foi possível ativar a conta." };
  }

  await createDatabaseUserSession({
    id: user.id,
    nome: user.nome,
    email: user.email,
    papel: user.papel,
    escolaId: user.escolaId,
    responsavelId: user.responsavelId,
  });

  const baseUrl = process.env.APP_URL?.replace(/\/+$/u, "");

  if (baseUrl) {
    const confirmation = accountConfirmationTemplate({
      name: user.nome,
      portalUrl: `${baseUrl}/portal-familia`,
    });
    await sendTransactionalEmail({
      escolaId: user.escolaId,
      criadoPorUsuarioId: user.id,
      tipo: "CONFIRMACAO_CONTA",
      destinatario: user.email,
      assunto: confirmation.assunto,
      conteudoTexto: confirmation.conteudoTexto,
      conteudoHtml: confirmation.conteudoHtml,
    });
  }

  redirect("/portal-familia");
}
