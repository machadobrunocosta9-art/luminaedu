export const USER_ROLES = [
  "ADMINISTRADOR",
  "SECRETARIA",
  "COORDENACAO",
  "FINANCEIRO",
  "RESPONSAVEL",
] as const;

export type UserRole = (typeof USER_ROLES)[number];

export const PERMISSIONS = [
  "ACESSAR_PAINEL",
  "ADMINISTRAR_SISTEMA",
  "GERENCIAR_USUARIOS",
  "GERENCIAR_ALUNOS",
  "GERENCIAR_MATRICULAS",
  "GERENCIAR_DOCUMENTOS",
  "GERENCIAR_FINANCEIRO",
  "GERENCIAR_COMUNICACAO",
  "ACESSAR_PORTAL_FAMILIA",
  "ACESSAR_DOCUMENTOS_FAMILIA",
] as const;

export type Permission = (typeof PERMISSIONS)[number];

const ROLE_PERMISSIONS: Record<UserRole, ReadonlySet<Permission>> = {
  ADMINISTRADOR: new Set(PERMISSIONS),
  SECRETARIA: new Set([
    "ACESSAR_PAINEL",
    "GERENCIAR_ALUNOS",
    "GERENCIAR_MATRICULAS",
    "GERENCIAR_DOCUMENTOS",
    "GERENCIAR_COMUNICACAO",
  ]),
  COORDENACAO: new Set([
    "ACESSAR_PAINEL",
    "GERENCIAR_ALUNOS",
    "GERENCIAR_DOCUMENTOS",
    "GERENCIAR_COMUNICACAO",
  ]),
  FINANCEIRO: new Set(["ACESSAR_PAINEL", "GERENCIAR_FINANCEIRO"]),
  RESPONSAVEL: new Set([
    "ACESSAR_PORTAL_FAMILIA",
    "ACESSAR_DOCUMENTOS_FAMILIA",
  ]),
};

export function isUserRole(value: unknown): value is UserRole {
  return typeof value === "string" && USER_ROLES.includes(value as UserRole);
}

export function hasPermission(role: UserRole, permission: Permission) {
  return ROLE_PERMISSIONS[role].has(permission);
}

export function permissionForAdminPath(pathname: string): Permission {
  const path = pathname.startsWith("/api/")
    ? pathname.slice("/api".length)
    : pathname;

  if (path.startsWith("/configuracoes") || path.startsWith("/convites-acesso")) {
    return "ADMINISTRAR_SISTEMA";
  }

  if (path.startsWith("/financeiro")) {
    return "GERENCIAR_FINANCEIRO";
  }

  if (path.startsWith("/documentos")) {
    return "GERENCIAR_DOCUMENTOS";
  }

  if (path.startsWith("/matriculas")) {
    return "GERENCIAR_MATRICULAS";
  }

  if (
    path.startsWith("/academico") ||
    path.startsWith("/alunos") ||
    path.startsWith("/turmas")
  ) {
    return "GERENCIAR_ALUNOS";
  }

  if (
    path.startsWith("/comunicacao") ||
    path.startsWith("/ocorrencias")
  ) {
    return "GERENCIAR_COMUNICACAO";
  }

  return "ACESSAR_PAINEL";
}

export function canAccessFamilyStudent(
  session: { escolaId: string; responsavelId: string },
  student: { escolaId: string; responsavelId: string },
) {
  return (
    session.escolaId === student.escolaId &&
    session.responsavelId === student.responsavelId
  );
}

export function canAuthenticateUserStatus(
  status: "PENDENTE" | "ATIVO" | "BLOQUEADO",
) {
  return status === "ATIVO";
}
