import "server-only";

import { scrypt, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import {
  ADMIN_SESSION_COOKIE,
  createSessionToken,
  getSessionCookieOptions,
  normalizeAdminSessionConfiguration,
  verifySessionToken,
} from "@/lib/auth-session";

type PasswordHashParts = {
  cost: number;
  blockSize: number;
  parallelization: number;
  salt: Buffer;
  expectedHash: Buffer;
};

function derivePasswordHash(
  password: string,
  parts: PasswordHashParts,
): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    scrypt(
      password,
      parts.salt,
      64,
      {
        N: parts.cost,
        r: parts.blockSize,
        p: parts.parallelization,
        maxmem: 64 * 1024 * 1024,
      },
      (error, derivedKey) => {
        if (error) reject(error);
        else resolve(derivedKey);
      },
    );
  });
}

function getAdminConfiguration() {
  return normalizeAdminSessionConfiguration(
    process.env.ADMIN_EMAIL,
    process.env.ADMIN_PASSWORD_HASH,
  );
}

function parsePasswordHash(value: string): PasswordHashParts | null {
  const [algorithm, cost, blockSize, parallelization, salt, expectedHash] =
    value.split("$");

  if (
    algorithm !== "scrypt" ||
    !cost ||
    !blockSize ||
    !parallelization ||
    !salt ||
    !expectedHash
  ) {
    return null;
  }

  const parsed = {
    cost: Number(cost),
    blockSize: Number(blockSize),
    parallelization: Number(parallelization),
    salt: Buffer.from(salt, "base64url"),
    expectedHash: Buffer.from(expectedHash, "base64url"),
  };

  if (
    parsed.cost !== 16_384 ||
    parsed.blockSize !== 8 ||
    parsed.parallelization !== 1 ||
    parsed.salt.length < 16 ||
    parsed.expectedHash.length !== 64
  ) {
    return null;
  }

  return parsed;
}

export function isAdminConfigured() {
  return getAdminConfiguration() !== null;
}

export async function verifyAdminCredentials(email: string, password: string) {
  const configuration = getAdminConfiguration();

  if (!configuration) {
    return false;
  }

  const parsedHash = parsePasswordHash(configuration.passwordHash);

  if (!parsedHash || email.trim().toLowerCase() !== configuration.email.toLowerCase()) {
    return false;
  }

  try {
    const suppliedHash = await derivePasswordHash(password, parsedHash);

    return timingSafeEqual(suppliedHash, parsedHash.expectedHash);
  } catch {
    return false;
  }
}

export async function createAdminSession() {
  const configuration = getAdminConfiguration();

  if (!configuration) {
    throw new Error("A autenticação administrativa não está configurada.");
  }

  const token = await createSessionToken(
    configuration.email,
    configuration.passwordHash,
  );
  const cookieStore = await cookies();

  cookieStore.set(ADMIN_SESSION_COOKIE, token, getSessionCookieOptions());
}

export async function destroyAdminSession() {
  const cookieStore = await cookies();

  cookieStore.set(ADMIN_SESSION_COOKIE, "", {
    ...getSessionCookieOptions(),
    maxAge: 0,
  });
}

export async function isAdminAuthenticated() {
  const configuration = getAdminConfiguration();

  if (!configuration) {
    return false;
  }

  const cookieStore = await cookies();
  const token = cookieStore.get(ADMIN_SESSION_COOKIE)?.value;

  return verifySessionToken(
    token,
    configuration.email,
    configuration.passwordHash,
  );
}

export async function requireAdmin() {
  if (!(await isAdminAuthenticated())) {
    redirect("/login");
  }
}
