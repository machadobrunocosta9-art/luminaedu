import { randomBytes, scrypt, timingSafeEqual } from "node:crypto";

const SCRYPT_COST = 16_384;
const SCRYPT_BLOCK_SIZE = 8;
const SCRYPT_PARALLELIZATION = 1;
const SCRYPT_KEY_LENGTH = 64;
const SCRYPT_MAX_MEMORY = 64 * 1024 * 1024;

type PasswordHashParts = {
  cost: number;
  blockSize: number;
  parallelization: number;
  salt: Buffer;
  expectedHash: Buffer;
};

function derivePasswordHash(
  password: string,
  parts: Omit<PasswordHashParts, "expectedHash">,
): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    scrypt(
      password,
      parts.salt,
      SCRYPT_KEY_LENGTH,
      {
        N: parts.cost,
        r: parts.blockSize,
        p: parts.parallelization,
        maxmem: SCRYPT_MAX_MEMORY,
      },
      (error, derivedKey) => {
        if (error) reject(error);
        else resolve(derivedKey);
      },
    );
  });
}

function parsePasswordHash(value: string): PasswordHashParts | null {
  const [algorithm, cost, blockSize, parallelization, salt, expectedHash, extra] =
    value.split("$");

  if (
    algorithm !== "scrypt" ||
    !cost ||
    !blockSize ||
    !parallelization ||
    !salt ||
    !expectedHash ||
    extra
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
    parsed.cost !== SCRYPT_COST ||
    parsed.blockSize !== SCRYPT_BLOCK_SIZE ||
    parsed.parallelization !== SCRYPT_PARALLELIZATION ||
    parsed.salt.length < 16 ||
    parsed.expectedHash.length !== SCRYPT_KEY_LENGTH
  ) {
    return null;
  }

  return parsed;
}

export function validateNewPassword(password: string) {
  if (password.length < 12 || password.length > 128) {
    return "A senha deve ter entre 12 e 128 caracteres.";
  }

  return null;
}

export async function hashPassword(password: string) {
  const validationError = validateNewPassword(password);

  if (validationError) {
    throw new Error(validationError);
  }

  const salt = randomBytes(24);
  const derivedHash = await derivePasswordHash(password, {
    cost: SCRYPT_COST,
    blockSize: SCRYPT_BLOCK_SIZE,
    parallelization: SCRYPT_PARALLELIZATION,
    salt,
  });

  return [
    "scrypt",
    SCRYPT_COST,
    SCRYPT_BLOCK_SIZE,
    SCRYPT_PARALLELIZATION,
    salt.toString("base64url"),
    derivedHash.toString("base64url"),
  ].join("$");
}

export async function verifyPassword(password: string, encodedHash: string) {
  const parsedHash = parsePasswordHash(encodedHash);

  if (!parsedHash) {
    return false;
  }

  try {
    const suppliedHash = await derivePasswordHash(password, parsedHash);
    return timingSafeEqual(suppliedHash, parsedHash.expectedHash);
  } catch {
    return false;
  }
}
