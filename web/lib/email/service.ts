import "server-only";

import { prisma } from "@/lib/prisma";
import { sendWithResend } from "@/lib/email/resend-provider";
import { sendWithSmtp } from "@/lib/email/smtp-provider";

export type TransactionalEmailType =
  | "CONVITE_ACESSO"
  | "RECUPERACAO_SENHA"
  | "CONFIRMACAO_CONTA"
  | "COMUNICADO"
  | "AVISO_DOCUMENTO"
  | "ATUALIZACAO_MATRICULA"
  | "CRM";

type TransactionalEmailInput = {
  escolaId: string;
  criadoPorUsuarioId?: string | null;
  tipo: TransactionalEmailType;
  destinatario: string;
  assunto: string;
  conteudoTexto: string;
  conteudoHtml: string;
};

export type TransactionalEmailResult = {
  status: "sent" | "failed" | "not_configured";
  emailId: string;
  errorClass?: string;
};

export async function sendTransactionalEmail(
  input: TransactionalEmailInput,
): Promise<TransactionalEmailResult> {
  // "smtp" envia por um servidor de e-mail comum (ex.: Gmail da escola);
  // "resend" usa a API do Resend.
  const provedor =
    process.env.EMAIL_PROVIDER?.trim().toLowerCase() === "smtp"
      ? "smtp"
      : "resend";

  const record = await prisma.emailTransacional.create({
    data: {
      escolaId: input.escolaId,
      criadoPorUsuarioId: input.criadoPorUsuarioId,
      tipo: input.tipo,
      status: "PENDENTE",
      destinatario: input.destinatario,
      assunto: input.assunto,
      conteudo: input.conteudoTexto,
      provedor,
    },
    select: { id: true },
  });

  const enviar = provedor === "smtp" ? sendWithSmtp : sendWithResend;

  const providerResult = await enviar({
    to: input.destinatario,
    subject: input.assunto,
    text: input.conteudoTexto,
    html: input.conteudoHtml,
  });

  if (providerResult.status === "sent") {
    await prisma.emailTransacional.update({
      where: { id: record.id },
      data: {
        status: "ENVIADO",
        mensagemExternaId: providerResult.externalId,
        tentativas: { increment: 1 },
        enviadoEm: new Date(),
        erroClasse: null,
      },
    });
    return { status: "sent", emailId: record.id };
  }

  const status =
    providerResult.status === "not_configured"
      ? "NAO_CONFIGURADO"
      : "FALHOU";

  await prisma.emailTransacional.update({
    where: { id: record.id },
    data: {
      status,
      tentativas: { increment: 1 },
      erroClasse: providerResult.errorClass,
    },
  });

  return {
    status: providerResult.status,
    emailId: record.id,
    errorClass: providerResult.errorClass,
  };
}
