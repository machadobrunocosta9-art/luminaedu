import { createHash, randomBytes } from "node:crypto";

export function generateSecureToken(bytes = 32) {
  if (!Number.isInteger(bytes) || bytes < 32) {
    throw new Error("O token deve possuir pelo menos 32 bytes de entropia.");
  }

  return randomBytes(bytes).toString("base64url");
}

export function hashToken(token: string) {
  return createHash("sha256").update(token, "utf8").digest("base64url");
}

export function normalizeEmail(email: string) {
  return email.trim().toLocaleLowerCase("pt-BR");
}

export function maskEmail(email: string) {
  const [localPart, domain] = normalizeEmail(email).split("@");

  if (!localPart || !domain) {
    return "***";
  }

  const visible = localPart.slice(0, Math.min(2, localPart.length));
  return `${visible}${"*".repeat(Math.max(3, localPart.length - visible.length))}@${domain}`;
}
