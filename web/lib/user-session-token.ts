import {
  isUserRole,
  type UserRole,
} from "@/lib/security/permissions";
import { normalizeAdminSessionConfiguration } from "@/lib/auth-session";

const USER_SESSION_VERSION = 1;

export const USER_SESSION_COOKIE = "lumina_user_session";
export const USER_SESSION_DURATION_SECONDS = 60 * 60 * 8;

export type UserSessionPayload = {
  version: number;
  sessionId: string;
  sessionToken: string;
  usuarioId: string;
  escolaId: string;
  responsavelId: string | null;
  papel: UserRole;
  expiresAt: number;
};

function encodeBase64Url(value: string | ArrayBuffer) {
  const bytes =
    typeof value === "string"
      ? new TextEncoder().encode(value)
      : new Uint8Array(value);
  let binary = "";

  for (const byte of bytes) {
    binary += String.fromCharCode(byte);
  }

  return btoa(binary)
    .replaceAll("+", "-")
    .replaceAll("/", "_")
    .replace(/=+$/u, "");
}

function decodeBase64Url(value: string) {
  const normalized = value.replaceAll("-", "+").replaceAll("_", "/");
  const padding = "=".repeat((4 - (normalized.length % 4)) % 4);
  return Uint8Array.from(
    atob(normalized + padding),
    (character) => character.charCodeAt(0),
  );
}

function getSigningSecret() {
  const explicitSecret = process.env.SESSION_SIGNING_SECRET?.trim();

  if (explicitSecret && explicitSecret.length >= 32) {
    return explicitSecret;
  }

  return normalizeAdminSessionConfiguration(
    process.env.ADMIN_EMAIL,
    process.env.ADMIN_PASSWORD_HASH,
  )?.passwordHash;
}

async function getSigningKey() {
  const signingSecret = getSigningSecret();

  if (!signingSecret) {
    return null;
  }

  const keyMaterial = await crypto.subtle.digest(
    "SHA-256",
    new TextEncoder().encode(`lumina-user-session-v1:${signingSecret}`),
  );

  return crypto.subtle.importKey(
    "raw",
    keyMaterial,
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign", "verify"],
  );
}

export async function createUserSessionToken(
  payload: Omit<UserSessionPayload, "version" | "expiresAt">,
) {
  const signingKey = await getSigningKey();

  if (!signingKey) {
    throw new Error("A chave de assinatura da sessão não está configurada.");
  }

  const completePayload: UserSessionPayload = {
    ...payload,
    version: USER_SESSION_VERSION,
    expiresAt: Date.now() + USER_SESSION_DURATION_SECONDS * 1000,
  };
  const encodedPayload = encodeBase64Url(JSON.stringify(completePayload));
  const signature = await crypto.subtle.sign(
    "HMAC",
    signingKey,
    new TextEncoder().encode(encodedPayload),
  );

  return `${encodedPayload}.${encodeBase64Url(signature)}`;
}

export async function verifyUserSessionToken(
  token: string | undefined,
): Promise<UserSessionPayload | null> {
  const signingKey = await getSigningKey();

  if (!token || !signingKey) {
    return null;
  }

  const [encodedPayload, encodedSignature, extraPart] = token.split(".");

  if (!encodedPayload || !encodedSignature || extraPart) {
    return null;
  }

  try {
    const signatureValid = await crypto.subtle.verify(
      "HMAC",
      signingKey,
      decodeBase64Url(encodedSignature),
      new TextEncoder().encode(encodedPayload),
    );

    if (!signatureValid) {
      return null;
    }

    const payload = JSON.parse(
      new TextDecoder().decode(decodeBase64Url(encodedPayload)),
    ) as Partial<UserSessionPayload>;

    if (
      payload.version !== USER_SESSION_VERSION ||
      typeof payload.sessionId !== "string" ||
      typeof payload.sessionToken !== "string" ||
      typeof payload.usuarioId !== "string" ||
      typeof payload.escolaId !== "string" ||
      !isUserRole(payload.papel) ||
      (payload.responsavelId !== null &&
        typeof payload.responsavelId !== "string") ||
      typeof payload.expiresAt !== "number" ||
      payload.expiresAt <= Date.now()
    ) {
      return null;
    }

    return payload as UserSessionPayload;
  } catch {
    return null;
  }
}

export function getUserSessionCookieOptions() {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax" as const,
    path: "/",
    maxAge: USER_SESSION_DURATION_SECONDS,
  };
}
