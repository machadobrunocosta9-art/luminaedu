const SESSION_VERSION = 1;

export const ADMIN_SESSION_COOKIE = "lumina_admin_session";
export const ADMIN_SESSION_DURATION_SECONDS = 60 * 60 * 8;

type SessionPayload = {
  version: number;
  email: string;
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
  return atob(normalized + padding);
}

async function getSigningKey(passwordHash: string) {
  const keyMaterial = await crypto.subtle.digest(
    "SHA-256",
    new TextEncoder().encode(`lumina-admin-session-v1:${passwordHash}`),
  );

  return crypto.subtle.importKey(
    "raw",
    keyMaterial,
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign", "verify"],
  );
}

export async function createSessionToken(
  email: string,
  passwordHash: string,
) {
  const payload: SessionPayload = {
    version: SESSION_VERSION,
    email,
    expiresAt: Date.now() + ADMIN_SESSION_DURATION_SECONDS * 1000,
  };
  const encodedPayload = encodeBase64Url(JSON.stringify(payload));
  const signature = await crypto.subtle.sign(
    "HMAC",
    await getSigningKey(passwordHash),
    new TextEncoder().encode(encodedPayload),
  );

  return `${encodedPayload}.${encodeBase64Url(signature)}`;
}

export async function verifySessionToken(
  token: string | undefined,
  expectedEmail: string | undefined,
  passwordHash: string | undefined,
) {
  if (!token || !expectedEmail || !passwordHash) {
    return false;
  }

  const [encodedPayload, encodedSignature, extraPart] = token.split(".");

  if (!encodedPayload || !encodedSignature || extraPart) {
    return false;
  }

  try {
    const signature = Uint8Array.from(
      decodeBase64Url(encodedSignature),
      (character) => character.charCodeAt(0),
    );
    const validSignature = await crypto.subtle.verify(
      "HMAC",
      await getSigningKey(passwordHash),
      signature,
      new TextEncoder().encode(encodedPayload),
    );

    if (!validSignature) {
      return false;
    }

    const payload = JSON.parse(
      decodeBase64Url(encodedPayload),
    ) as Partial<SessionPayload>;

    return (
      payload.version === SESSION_VERSION &&
      payload.email === expectedEmail &&
      typeof payload.expiresAt === "number" &&
      payload.expiresAt > Date.now()
    );
  } catch {
    return false;
  }
}

export function getSessionCookieOptions() {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax" as const,
    path: "/",
    maxAge: ADMIN_SESSION_DURATION_SECONDS,
  };
}
