import "server-only";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import {
  ADMIN_SESSION_COOKIE,
  createSessionToken,
  getSessionCookieOptions,
  normalizeAdminSessionConfiguration,
  verifySessionToken,
} from "@/lib/auth-session";
import {
  hasPermission,
  type Permission,
  type UserRole,
} from "@/lib/security/permissions";
import { verifyPassword } from "@/lib/security/password";
import {
  getAuthenticatedDatabaseUser,
  revokeCurrentDatabaseSession,
} from "@/lib/user-auth";

function getAdminConfiguration() {
  return normalizeAdminSessionConfiguration(
    process.env.ADMIN_EMAIL,
    process.env.ADMIN_PASSWORD_HASH,
  );
}

export function isAdminConfigured() {
  return getAdminConfiguration() !== null;
}

export async function verifyAdminCredentials(email: string, password: string) {
  const configuration = getAdminConfiguration();

  if (!configuration) {
    return false;
  }

  if (email.trim().toLowerCase() !== configuration.email.toLowerCase()) {
    return false;
  }

  return verifyPassword(password, configuration.passwordHash);
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

async function isLegacyAdminAuthenticated() {
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

export type AuthContext =
  | {
      kind: "user";
      usuarioId: string;
      nome: string;
      email: string;
      papel: UserRole;
      escolaId: string;
      responsavelId: string | null;
    }
  | {
      kind: "legacy";
      usuarioId: null;
      nome: "Administrador";
      email: null;
      papel: "ADMINISTRADOR";
      escolaId: null;
      responsavelId: null;
    };

export async function getAuthContext(): Promise<AuthContext | null> {
  const databaseUser = await getAuthenticatedDatabaseUser();

  if (databaseUser) {
    return {
      kind: "user",
      usuarioId: databaseUser.id,
      nome: databaseUser.nome,
      email: databaseUser.email,
      papel: databaseUser.papel,
      escolaId: databaseUser.escolaId,
      responsavelId: databaseUser.responsavelId,
    };
  }

  if (await isLegacyAdminAuthenticated()) {
    return {
      kind: "legacy",
      usuarioId: null,
      nome: "Administrador",
      email: null,
      papel: "ADMINISTRADOR",
      escolaId: null,
      responsavelId: null,
    };
  }

  return null;
}

export async function isAdminAuthenticated() {
  const context = await getAuthContext();
  return Boolean(
    context && hasPermission(context.papel, "ACESSAR_PAINEL"),
  );
}

export async function requirePermission(permission: Permission) {
  const context = await getAuthContext();

  if (!context) {
    redirect("/login");
  }

  if (!hasPermission(context.papel, permission)) {
    if (context.papel === "RESPONSAVEL") {
      redirect("/portal-familia");
    }

    if (context.papel === "PROFESSOR") {
      redirect("/professor");
    }

    redirect("/dashboard");
  }

  return context;
}

export async function requireAdmin(
  permission: Permission = "ACESSAR_PAINEL",
) {
  return requirePermission(permission);
}

export async function requireFamily() {
  const context = await getAuthContext();

  if (!context) {
    redirect("/login?next=/portal-familia");
  }

  if (
    context.kind !== "user" ||
    context.papel !== "RESPONSAVEL" ||
    !context.responsavelId ||
    !hasPermission(context.papel, "ACESSAR_PORTAL_FAMILIA")
  ) {
    redirect("/dashboard");
  }

  return {
    ...context,
    responsavelId: context.responsavelId,
  };
}

export async function requireProfessor() {
  const context = await getAuthContext();

  if (!context) {
    redirect("/login?next=/professor");
  }

  if (
    context.kind !== "user" ||
    context.papel !== "PROFESSOR" ||
    !context.usuarioId ||
    !hasPermission(context.papel, "ACESSAR_PORTAL_PROFESSOR")
  ) {
    redirect("/dashboard");
  }

  return {
    ...context,
    usuarioId: context.usuarioId,
  };
}

export async function resolveAuthSchoolId(context: AuthContext) {
  if (context.escolaId) {
    return context.escolaId;
  }

  const school = await prisma.escola.findFirst({
    select: { id: true },
    orderBy: { criadoEm: "asc" },
  });

  if (school) {
    return school.id;
  }

  const createdSchool = await prisma.escola.create({
    data: { nome: "Minha escola" },
    select: { id: true },
  });

  return createdSchool.id;
}

export async function destroyAuthenticatedSession() {
  await Promise.all([
    revokeCurrentDatabaseSession(),
    destroyAdminSession(),
  ]);
}
