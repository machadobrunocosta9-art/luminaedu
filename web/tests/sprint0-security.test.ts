import assert from "node:assert/strict";
import test from "node:test";
import {
  createSessionToken,
  verifySessionToken,
} from "../lib/auth-session.ts";
import {
  getAccessInvitationAvailability,
} from "../lib/access-invitations.ts";
import {
  canAccessFamilyStudent,
  canAuthenticateUserStatus,
  hasPermission,
} from "../lib/security/permissions.ts";
import {
  hashPassword,
  verifyPassword,
} from "../lib/security/password.ts";
import {
  generateSecureToken,
  hashToken,
  normalizeEmail,
} from "../lib/security/tokens.ts";

test("administrador legado mantém sessão assinada válida", async () => {
  const hash = await hashPassword("uma-senha-segura-de-teste");
  const token = await createSessionToken("ADMIN@EXAMPLE.COM", hash);

  assert.equal(
    await verifySessionToken(token, "admin@example.com", hash),
    true,
  );
  assert.equal(
    await verifySessionToken(token, "outro@example.com", hash),
    false,
  );
});

test("hash scrypt autentica a senha correta e rejeita a incorreta", async () => {
  const encoded = await hashPassword("senha-responsavel-segura");

  assert.match(encoded, /^scrypt\$/u);
  assert.equal(await verifyPassword("senha-responsavel-segura", encoded), true);
  assert.equal(await verifyPassword("senha-incorreta", encoded), false);
  assert.equal(encoded.includes("senha-responsavel-segura"), false);
});

test("e-mail é normalizado antes de persistência e autenticação", () => {
  assert.equal(normalizeEmail("  Pessoa@Exemplo.COM  "), "pessoa@exemplo.com");
});

test("token aleatório é diferente do hash persistido", () => {
  const token = generateSecureToken();
  const persisted = hashToken(token);

  assert.notEqual(token, persisted);
  assert.equal(hashToken(token), persisted);
});

test("convite válido, expirado, cancelado e utilizado são distinguidos", () => {
  const future = new Date(Date.now() + 60_000);
  const past = new Date(Date.now() - 60_000);

  assert.equal(
    getAccessInvitationAvailability({
      status: "PENDENTE",
      expiresAt: future,
      usedAt: null,
      canceledAt: null,
    }),
    "valid",
  );
  assert.equal(
    getAccessInvitationAvailability({
      status: "PENDENTE",
      expiresAt: past,
      usedAt: null,
      canceledAt: null,
    }),
    "expired",
  );
  assert.equal(
    getAccessInvitationAvailability({
      status: "CANCELADO",
      expiresAt: future,
      usedAt: null,
      canceledAt: new Date(),
    }),
    "canceled",
  );
  assert.equal(
    getAccessInvitationAvailability({
      status: "UTILIZADO",
      expiresAt: future,
      usedAt: new Date(),
      canceledAt: null,
    }),
    "used",
  );
});

test("usuário bloqueado ou pendente não pode autenticar", () => {
  assert.equal(canAuthenticateUserStatus("ATIVO"), true);
  assert.equal(canAuthenticateUserStatus("BLOQUEADO"), false);
  assert.equal(canAuthenticateUserStatus("PENDENTE"), false);
});

test("responsável não possui permissão administrativa", () => {
  assert.equal(hasPermission("RESPONSAVEL", "ACESSAR_PAINEL"), false);
  assert.equal(
    hasPermission("RESPONSAVEL", "ACESSAR_PORTAL_FAMILIA"),
    true,
  );
  assert.equal(hasPermission("ADMINISTRADOR", "ADMINISTRAR_SISTEMA"), true);
});

test("isolamento familiar exige simultaneamente escola e responsável", () => {
  const session = { escolaId: "escola-a", responsavelId: "responsavel-a" };

  assert.equal(
    canAccessFamilyStudent(session, {
      escolaId: "escola-a",
      responsavelId: "responsavel-a",
    }),
    true,
  );
  assert.equal(
    canAccessFamilyStudent(session, {
      escolaId: "escola-a",
      responsavelId: "responsavel-b",
    }),
    false,
  );
  assert.equal(
    canAccessFamilyStudent(session, {
      escolaId: "escola-b",
      responsavelId: "responsavel-a",
    }),
    false,
  );
});
