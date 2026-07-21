"use server";

import { revalidatePath } from "next/cache";
import {
  requirePermission,
  resolveAuthSchoolId,
} from "@/lib/auth";
import { accessInvitationTemplate } from "@/lib/email/templates";
import { sendTransactionalEmail } from "@/lib/email/service";
import { prisma } from "@/lib/prisma";
import {
  generateSecureToken,
  hashToken,
} from "@/lib/security/tokens";
import { recordAudit } from "@/lib/audit";
import { getApplicationBaseUrl } from "@/lib/application-url";

export type CreateAccessInvitationState = {
  error: string | null;
  activationUrl: string | null;
  emailStatus: "sent" | "failed" | "not_configured" | null;
};

export async function createAccessInvitationAction(
  _previousState: CreateAccessInvitationState,
  formData: FormData,
): Promise<CreateAccessInvitationState> {
  const auth = await requirePermission("GERENCIAR_USUARIOS");
  const escolaId = await resolveAuthSchoolId(auth);
  const responsavelId = formData.get("responsavelId");
  const validityDaysValue = formData.get("validityDays");
  const validityDays = Number(validityDaysValue);

  if (
    typeof responsavelId !== "string" ||
    !responsavelId ||
    !Number.isInteger(validityDays) ||
    validityDays < 1 ||
    validityDays > 30
  ) {
    return {
      error: "Selecione um responsável e uma validade entre 1 e 30 dias.",
      activationUrl: null,
      emailStatus: null,
    };
  }

  const responsible = await prisma.responsavel.findFirst({
    where: { id: responsavelId, escolaId },
    select: {
      id: true,
      nome: true,
      email: true,
      usuario: { select: { id: true, status: true } },
    },
  });

  if (!responsible || !responsible.email) {
    return {
      error: "O responsável precisa possuir um e-mail cadastrado.",
      activationUrl: null,
      emailStatus: null,
    };
  }

  if (responsible.usuario?.status === "ATIVO") {
    return {
      error: "Este responsável já possui uma conta ativa.",
      activationUrl: null,
      emailStatus: null,
    };
  }

  const token = generateSecureToken();
  const expiresAt = new Date(
    Date.now() + validityDays * 24 * 60 * 60 * 1000,
  );

  const invitation = await prisma.conviteAcesso.create({
    data: {
      tokenHash: hashToken(token),
      expiraEm: expiresAt,
      escolaId,
      responsavelId: responsible.id,
      criadoPorUsuarioId: auth.usuarioId,
    },
    select: { id: true },
  });
  const activationUrl = `${await getApplicationBaseUrl()}/ativar-conta/${token}`;
  const message = accessInvitationTemplate({
    name: responsible.nome,
    activationUrl,
  });
  const emailResult = await sendTransactionalEmail({
    escolaId,
    criadoPorUsuarioId: auth.usuarioId,
    tipo: "CONVITE_ACESSO",
    destinatario: responsible.email,
    assunto: message.assunto,
    conteudoTexto: message.conteudoTexto,
    conteudoHtml: message.conteudoHtml,
  });

  await recordAudit({
    acao: "CONVITE_ACESSO_CRIADO",
    resultado: "SUCESSO",
    escolaId,
    usuarioId: auth.usuarioId,
    entidade: "ConviteAcesso",
    entidadeId: invitation.id,
    metadados: { emailStatus: emailResult.status },
  });

  revalidatePath("/convites-acesso");

  return {
    error: null,
    activationUrl,
    emailStatus: emailResult.status,
  };
}

export async function cancelAccessInvitationAction(formData: FormData) {
  const auth = await requirePermission("GERENCIAR_USUARIOS");
  const escolaId = await resolveAuthSchoolId(auth);
  const invitationId = formData.get("invitationId");

  if (typeof invitationId !== "string" || !invitationId) {
    return;
  }

  const result = await prisma.conviteAcesso.updateMany({
    where: {
      id: invitationId,
      escolaId,
      status: "PENDENTE",
      utilizadoEm: null,
      canceladoEm: null,
    },
    data: {
      status: "CANCELADO",
      canceladoEm: new Date(),
    },
  });

  await recordAudit({
    acao: "CONVITE_ACESSO_CANCELADO",
    resultado: result.count === 1 ? "SUCESSO" : "NEGADO",
    escolaId,
    usuarioId: auth.usuarioId,
    entidade: "ConviteAcesso",
    entidadeId: invitationId,
  });

  revalidatePath("/convites-acesso");
}
