import "server-only";

import nodemailer, { type Transporter } from "nodemailer";
import type { EmailProviderResult } from "@/lib/email/resend-provider";

type SmtpMessage = {
  to: string;
  subject: string;
  text: string;
  html: string;
};

let transporterCache: Transporter | null = null;

function getTransporter() {
  if (transporterCache) {
    return transporterCache;
  }

  const user = process.env.EMAIL_SMTP_USER?.trim();
  const pass = process.env.EMAIL_SMTP_PASSWORD?.trim();

  if (!user || !pass) {
    return null;
  }

  // Padrao Gmail; da para apontar para outro servidor mudando host/porta.
  const host = process.env.EMAIL_SMTP_HOST?.trim() || "smtp.gmail.com";
  const port = Number(process.env.EMAIL_SMTP_PORT?.trim() || "465");

  transporterCache = nodemailer.createTransport({
    host,
    port,
    secure: port === 465,
    auth: { user, pass },
  });

  return transporterCache;
}

export async function sendWithSmtp(
  message: SmtpMessage,
): Promise<EmailProviderResult> {
  const transporter = getTransporter();
  const from = process.env.EMAIL_FROM?.trim();

  if (
    process.env.EMAIL_DELIVERY_ENABLED !== "true" ||
    !transporter ||
    !from
  ) {
    return {
      status: "not_configured",
      errorClass: "EmailProviderNotConfigured",
    };
  }

  try {
    const resultado = await transporter.sendMail({
      from,
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
