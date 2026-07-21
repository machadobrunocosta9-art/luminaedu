import "server-only";

import { createHash } from "node:crypto";
import { cookies, headers } from "next/headers";
import { prisma } from "@/lib/prisma";
import { verifyPassword } from "@/lib/security/password";
import {
  generateSecureToken,
  hashToken,
  normalizeEmail,
} from "@/lib/security/tokens";
import {
  canAuthenticateUserStatus,
  type UserRole,
} from "@/lib/security/permissions";
import {
  createUserSessionToken,
  getUserSessionCookieOptions,
  USER_SESSION_COOKIE,
  USER_SESSION_DURATION_SECONDS,
  verifyUserSessionToken,
} from "@/lib/user-session-token";

const LOGIN_WINDOW_MS = 15 * 60 * 1000;
const MAX_LOGIN_FAILURES = 8;

export type DatabaseUser = {
  id: string;
  nome: string;
  email: string;
  papel: UserRole;
  escolaId: string;
  responsavelId: string | null;
};

export type DatabaseAuthenticationResult =
  | { status: "authenticated"; user: DatabaseUser }
  | {
      status:
        | "not_found"
        | "invalid"
        | "blocked"
        | "rate_limited"
        | "unavailable";
    };

function privacyHash(value: string) {
  const secret =
    process.env.SESSION_SIGNING_SECRET ??
    process.env.ADMIN_PASSWORD_HASH ??
    "lumina-local-privacy-hash";

  return createHash("sha256")
    .update(`${secret}:${value}`, "utf8")
    .digest("base64url");
}

async function getRequestIpHash() {
  const requestHeaders = await headers();
  const forwarded = requestHeaders.get("x-forwarded-for")?.split(",")[0]?.trim();
  const ip = forwarded || requestHeaders.get("x-real-ip");

  return ip ? privacyHash(ip) : null;
}

function isMissingFoundationTable(error: unknown) {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    (error.code === "P2021" || error.code === "P2022")
  );
}

async function recordLoginAttempt(input: {
  identifierHash: string;
  ipHash: string | null;
  sucesso: boolean;
  bloqueada: boolean;
  escolaId?: string;
}) {
  try {
    await prisma.tentativaLogin.create({
      data: {
        identificadorHash: input.identifierHash,
        ipHash: input.ipHash,
        sucesso: input.sucesso,
        bloqueada: input.bloqueada,
        escola: input.escolaId
          ? { connect: { id: input.escolaId } }
          : undefined,
      },
    });
  } catch {
    // A falha de telemetria não altera a resposta pública do login.
  }
}

export async function authenticateDatabaseUser(
  suppliedEmail: string,
  password: string,
): Promise<DatabaseAuthenticationResult> {
  const email = normalizeEmail(suppliedEmail);
  const identifierHash = privacyHash(email);
  const ipHash = await getRequestIpHash();
  const windowStart = new Date(Date.now() - LOGIN_WINDOW_MS);

  try {
    const [user, recentFailures] = await Promise.all([
      prisma.usuario.findUnique({
        where: { email },
        select: {
          id: true,
          nome: true,
          email: true,
          senhaHash: true,
          papel: true,
          status: true,
          escolaId: true,
          responsavelId: true,
        },
      }),
      prisma.tentativaLogin.count({
        where: {
          identificadorHash: identifierHash,
          sucesso: false,
          criadaEm: { gte: windowStart },
        },
      }),
    ]);

    if (recentFailures >= MAX_LOGIN_FAILURES) {
      await recordLoginAttempt({
        identifierHash,
        ipHash,
        sucesso: false,
        bloqueada: true,
        escolaId: user?.escolaId,
      });
      return { status: "rate_limited" };
    }

    if (!user) {
      await recordLoginAttempt({
        identifierHash,
        ipHash,
        sucesso: false,
        bloqueada: false,
      });
      return { status: "not_found" };
    }

    if (user.status === "BLOQUEADO") {
      await recordLoginAttempt({
        identifierHash,
        ipHash,
        sucesso: false,
        bloqueada: true,
        escolaId: user.escolaId,
      });
      return { status: "blocked" };
    }

    if (
      !canAuthenticateUserStatus(user.status) ||
      !(await verifyPassword(password, user.senhaHash))
    ) {
      await recordLoginAttempt({
        identifierHash,
        ipHash,
        sucesso: false,
        bloqueada: false,
        escolaId: user.escolaId,
      });
      return { status: "invalid" };
    }

    await recordLoginAttempt({
      identifierHash,
      ipHash,
      sucesso: true,
      bloqueada: false,
      escolaId: user.escolaId,
    });

    return {
      status: "authenticated",
      user: {
        id: user.id,
        nome: user.nome,
        email: user.email,
        papel: user.papel,
        escolaId: user.escolaId,
        responsavelId: user.responsavelId,
      },
    };
  } catch (error) {
    if (!isMissingFoundationTable(error)) {
      // A resposta continua genérica e nenhum dado sensível é registrado.
    }

    return { status: "unavailable" };
  }
}

export async function createDatabaseUserSession(user: DatabaseUser) {
  const sessionToken = generateSecureToken();
  const expiresAt = new Date(
    Date.now() + USER_SESSION_DURATION_SECONDS * 1000,
  );
  const session = await prisma.sessaoUsuario.create({
    data: {
      tokenHash: hashToken(sessionToken),
      expiraEm: expiresAt,
      usuarioId: user.id,
    },
    select: { id: true },
  });
  const signedToken = await createUserSessionToken({
    sessionId: session.id,
    sessionToken,
    usuarioId: user.id,
    escolaId: user.escolaId,
    responsavelId: user.responsavelId,
    papel: user.papel,
  });
  const cookieStore = await cookies();

  cookieStore.set(
    USER_SESSION_COOKIE,
    signedToken,
    getUserSessionCookieOptions(),
  );

  await prisma.usuario.update({
    where: { id: user.id },
    data: { ultimoAcessoEm: new Date() },
  });
}

export async function getAuthenticatedDatabaseUser() {
  const cookieStore = await cookies();
  const payload = await verifyUserSessionToken(
    cookieStore.get(USER_SESSION_COOKIE)?.value,
  );

  if (!payload) {
    return null;
  }

  try {
    const session = await prisma.sessaoUsuario.findFirst({
      where: {
        id: payload.sessionId,
        usuarioId: payload.usuarioId,
        tokenHash: hashToken(payload.sessionToken),
        revogadaEm: null,
        expiraEm: { gt: new Date() },
      },
      select: {
        id: true,
        ultimoUsoEm: true,
        usuario: {
          select: {
            id: true,
            nome: true,
            email: true,
            papel: true,
            status: true,
            escolaId: true,
            responsavelId: true,
          },
        },
      },
    });

    if (
      !session ||
      session.usuario.status !== "ATIVO" ||
      session.usuario.papel !== payload.papel ||
      session.usuario.escolaId !== payload.escolaId ||
      session.usuario.responsavelId !== payload.responsavelId
    ) {
      return null;
    }

    if (
      !session.ultimoUsoEm ||
      Date.now() - session.ultimoUsoEm.getTime() > 5 * 60 * 1000
    ) {
      await prisma.sessaoUsuario.update({
        where: { id: session.id },
        data: { ultimoUsoEm: new Date() },
      });
    }

    return session.usuario as DatabaseUser;
  } catch {
    return null;
  }
}

export async function revokeCurrentDatabaseSession() {
  const cookieStore = await cookies();
  const payload = await verifyUserSessionToken(
    cookieStore.get(USER_SESSION_COOKIE)?.value,
  );

  if (payload) {
    try {
      await prisma.sessaoUsuario.updateMany({
        where: {
          id: payload.sessionId,
          usuarioId: payload.usuarioId,
          tokenHash: hashToken(payload.sessionToken),
          revogadaEm: null,
        },
        data: { revogadaEm: new Date() },
      });
    } catch {
      // O cookie ainda será removido mesmo se o banco estiver indisponível.
    }
  }

  cookieStore.set(USER_SESSION_COOKIE, "", {
    ...getUserSessionCookieOptions(),
    maxAge: 0,
  });
}
