import "server-only";

import nodemailer, { type Transporter } from "nodemailer";
import type { EmailProviderResult } from "@/lib/email/resend-provider";

type SmtpMessage = {
  to: string;
  subject: string;
  text: string;
  html: string;
};

export type CredenciaisSmtp = {
  remetente: string;
  usuario: string;
  senha: string;
  host: string;
  porta: number;
};

function criarTransporter(credenciais: CredenciaisSmtp): Transporter {
  return nodemailer.createTransport({
    host: credenciais.host,
    port: credenciais.porta,
    secure: credenciais.porta === 465,
    auth: { user: credenciais.usuario, pass: credenciais.senha },
  });
}

/** Credenciais vindas das variaveis de ambiente (modo antigo). */
function credenciaisDoAmbiente(): CredenciaisSmtp | null {
  const usuario = process.env.EMAIL_SMTP_USER?.trim();
  const senha = process.env.EMAIL_SMTP_PASSWORD?.trim();
  const remetente = process.env.EMAIL_FROM?.trim();

  if (
    process.env.EMAIL_DELIVERY_ENABLED !== "true" ||
    !usuario ||
    !senha ||
    !remetente
  ) {
    return null;
  }

  return {
    remetente,
    usuario,
    senha,
    host: process.env.EMAIL_SMTP_HOST?.trim() || "smtp.gmail.com",
    porta: Number(process.env.EMAIL_SMTP_PORT?.trim() || "465"),
  };
}

export async function sendWithSmtp(
  message: SmtpMessage,
  credenciaisInformadas?: CredenciaisSmtp | null,
): Promise<EmailProviderResult> {
  const credenciais = credenciaisInformadas ?? credenciaisDoAmbiente();

  if (!credenciais) {
    return {
      status: "not_configured",
      errorClass: "EmailProviderNotConfigured",
    };
  }

  const transporter = criarTransporter(credenciais);

  try {
    const resultado = await transporter.sendMail({
      from: credenciais.remetente,
      to: message.to,
      subject: message.subject,
      text: message.text,
      html: message.html,
      replyTo: process.env.EMAIL_REPLY_TO?.trim() || undefined,
    });

    return {
      status: "sent",
      externalId: resultado.messageId ?? null,
    };
  } catch (error) {
    const mensagem =
      error instanceof Error ? error.message.slice(0, 180) : "Erro desconhecido";

    return {
      status: "failed",
      errorClass: `SMTP: ${mensagem}`,
    };
  }
}
