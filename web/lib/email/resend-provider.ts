type ResendMessage = {
  to: string;
  subject: string;
  text: string;
  html: string;
};

export type EmailProviderResult =
  | { status: "sent"; externalId: string | null }
  | { status: "failed"; errorClass: string }
  | { status: "not_configured"; errorClass: string };

export async function sendWithResend(
  message: ResendMessage,
): Promise<EmailProviderResult> {
  const apiKey = process.env.RESEND_API_KEY?.trim();
  const from = process.env.EMAIL_FROM?.trim();
  const provider = process.env.EMAIL_PROVIDER?.trim().toLowerCase();

  if (
    process.env.EMAIL_DELIVERY_ENABLED !== "true" ||
    provider !== "resend" ||
    !apiKey ||
    !from
  ) {
    return {
      status: "not_configured",
      errorClass: "EmailProviderNotConfigured",
    };
  }

  try {
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from,
        to: [message.to],
        subject: message.subject,
        text: message.text,
        html: message.html,
        reply_to: process.env.EMAIL_REPLY_TO?.trim() || undefined,
      }),
    });

    if (!response.ok) {
      return {
        status: "failed",
        errorClass: `EmailProviderHttp${response.status}`,
      };
    }

    const result = (await response.json()) as { id?: unknown };
    return {
      status: "sent",
      externalId: typeof result.id === "string" ? result.id : null,
    };
  } catch (error) {
    return {
      status: "failed",
      errorClass:
        error instanceof Error ? error.name : "EmailProviderUnknownError",
    };
  }
}
