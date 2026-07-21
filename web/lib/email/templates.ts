type TemplateResult = {
  assunto: string;
  conteudoTexto: string;
  conteudoHtml: string;
};

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function actionTemplate(input: {
  greetingName: string;
  title: string;
  message: string;
  actionLabel: string;
  actionUrl: string;
}): TemplateResult {
  const safeName = escapeHtml(input.greetingName);
  const safeTitle = escapeHtml(input.title);
  const safeMessage = escapeHtml(input.message);
  const safeLabel = escapeHtml(input.actionLabel);
  const safeUrl = escapeHtml(input.actionUrl);

  return {
    assunto: input.title,
    conteudoTexto: [
      `Olá, ${input.greetingName}.`,
      "",
      input.message,
      "",
      `${input.actionLabel}: ${input.actionUrl}`,
      "",
      "Se você não esperava esta mensagem, ignore-a.",
    ].join("\n"),
    conteudoHtml: `
      <div style="font-family:Arial,sans-serif;color:#2a1f4f;line-height:1.6">
        <p>Olá, ${safeName}.</p>
        <h1 style="font-size:22px">${safeTitle}</h1>
        <p>${safeMessage}</p>
        <p><a href="${safeUrl}" style="display:inline-block;padding:12px 18px;border-radius:10px;background:#5b3fd6;color:#fff;text-decoration:none">${safeLabel}</a></p>
        <p style="font-size:12px;color:#6b7280">Se você não esperava esta mensagem, ignore-a.</p>
      </div>
    `.trim(),
  };
}

export function accessInvitationTemplate(input: {
  name: string;
  activationUrl: string;
}) {
  return actionTemplate({
    greetingName: input.name,
    title: "Ative seu acesso à Lumina",
    message:
      "A escola preparou seu acesso ao Portal da Família. O link é individual, temporário e pode ser usado uma única vez.",
    actionLabel: "Ativar minha conta",
    actionUrl: input.activationUrl,
  });
}

export function passwordRecoveryTemplate(input: {
  name: string;
  recoveryUrl: string;
}) {
  return actionTemplate({
    greetingName: input.name,
    title: "Redefinição de senha da Lumina",
    message:
      "Recebemos uma solicitação para redefinir sua senha. O link é temporário e de uso único.",
    actionLabel: "Definir nova senha",
    actionUrl: input.recoveryUrl,
  });
}

export function accountConfirmationTemplate(input: {
  name: string;
  portalUrl: string;
}) {
  return actionTemplate({
    greetingName: input.name,
    title: "Sua conta Lumina está ativa",
    message: "Seu acesso ao Portal da Família foi ativado com segurança.",
    actionLabel: "Acessar Portal da Família",
    actionUrl: input.portalUrl,
  });
}
