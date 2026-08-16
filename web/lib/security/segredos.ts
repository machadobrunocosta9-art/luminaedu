import "server-only";

import {
  createCipheriv,
  createDecipheriv,
  createHash,
  randomBytes,
} from "node:crypto";

/**
 * Criptografa segredos que precisam ser guardados no banco (por exemplo,
 * a senha de app do e-mail da escola). A chave e derivada do segredo de
 * sessao da aplicacao, entao os valores so podem ser lidos por este
 * servidor.
 */
function getChave() {
  const base =
    process.env.SESSION_SIGNING_SECRET ??
    process.env.ADMIN_PASSWORD_HASH ??
    null;

  if (!base) {
    return null;
  }

  return createHash("sha256").update(`segredo-app:${base}`).digest();
}

export function podeGuardarSegredo() {
  return getChave() !== null;
}

export function criptografarSegredo(valor: string) {
  const chave = getChave();

  if (!chave) {
    throw new Error(
      "A aplicação não está configurada para guardar segredos com segurança.",
    );
  }

  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", chave, iv);
  const conteudo = Buffer.concat([
    cipher.update(valor, "utf8"),
    cipher.final(),
  ]);
  const tag = cipher.getAuthTag();

  return [
    iv.toString("base64url"),
    tag.toString("base64url"),
    conteudo.toString("base64url"),
  ].join(".");
}

export function descriptografarSegredo(valorGuardado: string) {
  const chave = getChave();

  if (!chave) {
    return null;
  }

  const partes = valorGuardado.split(".");

  if (partes.length !== 3) {
    return null;
  }

  try {
    const [ivBase, tagBase, conteudoBase] = partes;
    const decipher = createDecipheriv(
      "aes-256-gcm",
      chave,
      Buffer.from(ivBase, "base64url"),
    );

    decipher.setAuthTag(Buffer.from(tagBase, "base64url"));

    return Buffer.concat([
      decipher.update(Buffer.from(conteudoBase, "base64url")),
      decipher.final(),
    ]).toString("utf8");
  } catch {
    return null;
  }
}
