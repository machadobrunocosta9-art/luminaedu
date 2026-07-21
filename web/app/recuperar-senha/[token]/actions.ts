"use server";

import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import {
  hashPassword,
  validateNewPassword,
} from "@/lib/security/password";
import { hashToken } from "@/lib/security/tokens";

export type PasswordResetState = {
  error: string | null;
};

class PasswordResetConsumptionError extends Error {}

export async function resetPasswordAction(
  _previousState: PasswordResetState,
  formData: FormData,
): Promise<PasswordResetState> {
  const token = formData.get("token");
  const password = formData.get("password");
  const passwordConfirmation = formData.get("passwordConfirmation");

  if (
    typeof token !== "string" ||
    typeof password !== "string" ||
    typeof passwordConfirmation !== "string"
  ) {
    return { error: "Não foi possível redefinir a senha." };
  }

  const validationError = validateNewPassword(password);

  if (validationError) {
    return { error: validationError };
  }

  if (password !== passwordConfirmation) {
    return { error: "As senhas não coincidem." };
  }

  const tokenHash = hashToken(token);
  const senhaHash = await hashPassword(password);

  try {
    await prisma.$transaction(async (tx) => {
      const recovery = await tx.recuperacaoSenha.findUnique({
        where: { tokenHash },
        select: {
          id: true,
          usuarioId: true,
          escolaId: true,
          expiraEm: true,
          utilizadoEm: true,
          revogadoEm: true,
          usuario: { select: { status: true } },
        },
      });

      if (
        !recovery ||
        recovery.usuario.status !== "ATIVO" ||
        recovery.utilizadoEm ||
        recovery.revogadoEm ||
        recovery.expiraEm <= new Date()
      ) {
        throw new PasswordResetConsumptionError();
      }

      const consumed = await tx.recuperacaoSenha.updateMany({
        where: {
          id: recovery.id,
          tokenHash,
          utilizadoEm: null,
          revogadoEm: null,
          expiraEm: { gt: new Date() },
        },
        data: { utilizadoEm: new Date() },
      });

      if (consumed.count !== 1) {
        throw new PasswordResetConsumptionError();
      }

      await tx.usuario.update({
        where: { id: recovery.usuarioId },
        data: { senhaHash },
      });
      await tx.sessaoUsuario.updateMany({
        where: {
          usuarioId: recovery.usuarioId,
          revogadaEm: null,
        },
        data: { revogadaEm: new Date() },
      });
      await tx.recuperacaoSenha.updateMany({
        where: {
          usuarioId: recovery.usuarioId,
          id: { not: recovery.id },
          utilizadoEm: null,
          revogadoEm: null,
        },
        data: { revogadoEm: new Date() },
      });
      await tx.registroAuditoria.create({
        data: {
          acao: "SENHA_REDEFINIDA",
          resultado: "SUCESSO",
          escolaId: recovery.escolaId,
          usuarioId: recovery.usuarioId,
          entidade: "Usuario",
          entidadeId: recovery.usuarioId,
        },
      });
    });
  } catch (error) {
    if (error instanceof PasswordResetConsumptionError) {
      return { error: "Este link é inválido ou não está mais disponível." };
    }

    return { error: "Não foi possível redefinir a senha." };
  }

  redirect("/login");
}
