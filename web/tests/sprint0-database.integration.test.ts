import assert from "node:assert/strict";
import test from "node:test";
import { randomUUID } from "node:crypto";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../lib/generated/prisma/client.ts";
import {
  createSessionToken,
  normalizeAdminSessionConfiguration,
  verifySessionToken,
} from "../lib/auth-session.ts";
import { getAccessInvitationAvailability } from "../lib/access-invitations.ts";
import {
  canAccessFamilyStudent,
  canAuthenticateUserStatus,
  hasPermission,
} from "../lib/security/permissions.ts";
import { hashPassword, verifyPassword } from "../lib/security/password.ts";
import {
  generateSecureToken,
  hashToken,
  normalizeEmail,
} from "../lib/security/tokens.ts";

const connectionString = process.env.DATABASE_URL;
if (!connectionString) throw new Error("DATABASE_URL de teste ausente.");

const prisma = new PrismaClient({ adapter: new PrismaPg({ connectionString }) });
const marker = `SPRINT0_IT_${randomUUID().replaceAll("-", "")}`;

test("fluxos integrados da Sprint 0", async (context) => {
  const created = { escolaId: "" };

  try {
    const senhaHash = await hashPassword("senha-integracao-segura-2026");
    const escola = await prisma.escola.create({
      data: { nome: `${marker} Escola` },
    });
    created.escolaId = escola.id;

    const [responsavelA, responsavelB] = await Promise.all([
      prisma.responsavel.create({
        data: {
          nome: `${marker} Responsável A`,
          email: `${marker.toLowerCase()}-a@example.test`,
          telefone: "TESTE_SPRINT0",
          escolaId: escola.id,
        },
      }),
      prisma.responsavel.create({
        data: {
          nome: `${marker} Responsável B`,
          email: `${marker.toLowerCase()}-b@example.test`,
          telefone: "TESTE_SPRINT0",
          escolaId: escola.id,
        },
      }),
    ]);
    const [alunoA, alunoB] = await Promise.all([
      prisma.aluno.create({
        data: {
          nome: `${marker} Aluno A`,
          dataNascimento: new Date("2015-01-01T00:00:00.000Z"),
          escolaId: escola.id,
          responsavelId: responsavelA.id,
        },
      }),
      prisma.aluno.create({
        data: {
          nome: `${marker} Aluno B`,
          dataNascimento: new Date("2016-01-01T00:00:00.000Z"),
          escolaId: escola.id,
          responsavelId: responsavelB.id,
        },
      }),
    ]);
    const [matriculaA, matriculaB] = await Promise.all([
      prisma.matricula.create({
        data: { anoLetivo: 2026, escolaId: escola.id, alunoId: alunoA.id },
      }),
      prisma.matricula.create({
        data: { anoLetivo: 2026, escolaId: escola.id, alunoId: alunoB.id },
      }),
    ]);
    const [usuarioFamilia, usuarioBloqueado, usuarioAdmin] = await Promise.all([
      prisma.usuario.create({
        data: {
          nome: `${marker} Família`,
          email: normalizeEmail(`${marker}-FAMILIA@EXAMPLE.TEST`),
          senhaHash,
          papel: "RESPONSAVEL",
          status: "ATIVO",
          escolaId: escola.id,
          responsavelId: responsavelA.id,
        },
      }),
      prisma.usuario.create({
        data: {
          nome: `${marker} Bloqueado`,
          email: normalizeEmail(`${marker}-BLOQUEADO@EXAMPLE.TEST`),
          senhaHash,
          papel: "SECRETARIA",
          status: "BLOQUEADO",
          escolaId: escola.id,
        },
      }),
      prisma.usuario.create({
        data: {
          nome: `${marker} Admin`,
          email: normalizeEmail(`${marker}-ADMIN@EXAMPLE.TEST`),
          senhaHash,
          papel: "ADMINISTRADOR",
          status: "ATIVO",
          escolaId: escola.id,
        },
      }),
    ]);

    await context.test("login do banco, bloqueio e administrador", async () => {
      const active = await prisma.usuario.findUniqueOrThrow({
        where: { id: usuarioFamilia.id },
      });
      assert.equal(await verifyPassword("senha-integracao-segura-2026", active.senhaHash), true);
      assert.equal(usuarioBloqueado.status, "BLOQUEADO");
      assert.equal(hasPermission(usuarioBloqueado.papel, "ACESSAR_PAINEL"), true);
      assert.equal(canAuthenticateUserStatus(usuarioBloqueado.status), false);
      assert.equal(hasPermission(usuarioAdmin.papel, "ADMINISTRAR_SISTEMA"), true);
      assert.equal(hasPermission(usuarioFamilia.papel, "ACESSAR_PAINEL"), false);
    });

    await context.test("convites e consumo simultâneo", async () => {
      const common = { escolaId: escola.id, responsavelId: responsavelA.id };
      const invitations = await Promise.all([
        prisma.conviteAcesso.create({ data: { ...common, tokenHash: hashToken(generateSecureToken()), expiraEm: new Date(Date.now() + 60_000) } }),
        prisma.conviteAcesso.create({ data: { ...common, tokenHash: hashToken(generateSecureToken()), expiraEm: new Date(Date.now() - 60_000) } }),
        prisma.conviteAcesso.create({ data: { ...common, tokenHash: hashToken(generateSecureToken()), status: "CANCELADO", canceladoEm: new Date(), expiraEm: new Date(Date.now() + 60_000) } }),
        prisma.conviteAcesso.create({ data: { ...common, tokenHash: hashToken(generateSecureToken()), status: "UTILIZADO", utilizadoEm: new Date(), expiraEm: new Date(Date.now() + 60_000) } }),
      ]);
      assert.deepEqual(invitations.map((item) => getAccessInvitationAvailability({
        status: item.status,
        expiresAt: item.expiraEm,
        usedAt: item.utilizadoEm,
        canceledAt: item.canceladoEm,
      })), ["valid", "expired", "canceled", "used"]);

      const target = invitations[0];
      const consume = () => prisma.conviteAcesso.updateMany({
        where: { id: target.id, status: "PENDENTE", utilizadoEm: null, canceladoEm: null, expiraEm: { gt: new Date() } },
        data: { status: "UTILIZADO", utilizadoEm: new Date() },
      });
      const results = await Promise.all([consume(), consume()]);
      assert.deepEqual(results.map((item) => item.count).sort(), [0, 1]);
    });

    await context.test("isolamento entre famílias", async () => {
      const own = await prisma.aluno.findFirst({
        where: { id: alunoA.id, escolaId: escola.id, responsavelId: responsavelA.id },
      });
      const other = await prisma.aluno.findFirst({
        where: { id: alunoB.id, escolaId: escola.id, responsavelId: responsavelA.id },
      });
      assert.ok(own);
      assert.equal(other, null);
      assert.equal(canAccessFamilyStudent(
        { escolaId: escola.id, responsavelId: responsavelA.id },
        { escolaId: escola.id, responsavelId: responsavelB.id },
      ), false);
    });

    await context.test("recuperação revoga sessões", async () => {
      await prisma.sessaoUsuario.createMany({
        data: [generateSecureToken(), generateSecureToken()].map((token) => ({
          tokenHash: hashToken(token),
          expiraEm: new Date(Date.now() + 60_000),
          usuarioId: usuarioFamilia.id,
        })),
      });
      const recovery = await prisma.recuperacaoSenha.create({
        data: {
          tokenHash: hashToken(generateSecureToken()),
          expiraEm: new Date(Date.now() + 60_000),
          escolaId: escola.id,
          usuarioId: usuarioFamilia.id,
        },
      });
      const newHash = await hashPassword("nova-senha-integracao-2026");
      await prisma.$transaction(async (tx) => {
        const consumed = await tx.recuperacaoSenha.updateMany({
          where: { id: recovery.id, utilizadoEm: null, revogadoEm: null, expiraEm: { gt: new Date() } },
          data: { utilizadoEm: new Date() },
        });
        assert.equal(consumed.count, 1);
        await tx.usuario.update({ where: { id: usuarioFamilia.id }, data: { senhaHash: newHash } });
        await tx.sessaoUsuario.updateMany({ where: { usuarioId: usuarioFamilia.id, revogadaEm: null }, data: { revogadaEm: new Date() } });
      });
      const updated = await prisma.usuario.findUniqueOrThrow({ where: { id: usuarioFamilia.id } });
      assert.equal(await verifyPassword("nova-senha-integracao-2026", updated.senhaHash), true);
      assert.equal(await prisma.sessaoUsuario.count({ where: { usuarioId: usuarioFamilia.id, revogadaEm: null } }), 0);
    });

    await context.test("documento somente da família proprietária", async () => {
      const enrollmentInvite = await prisma.conviteMatricula.create({
        data: {
          token: `${marker}_DOCUMENT_TOKEN`, status: "CONCLUIDO",
          nomeAluno: alunoA.nome, nomeResponsavel: responsavelA.nome,
          telefoneResponsavel: "TESTE_SPRINT0", anoLetivo: 2026,
          expiraEm: new Date(Date.now() + 60_000), escolaId: escola.id,
          matriculaId: matriculaA.id,
        },
      });
      const document = await prisma.documentoMatricula.create({
        data: {
          tipo: "CERTIDAO_NASCIMENTO", status: "ENVIADO",
          titulo: `${marker} Documento`, chaveArmazenamento: `${marker}/teste.pdf`,
          escolaId: escola.id, conviteId: enrollmentInvite.id, matriculaId: matriculaA.id,
        },
      });
      const query = (responsavelId: string) => prisma.documentoMatricula.findFirst({
        where: { id: document.id, escolaId: escola.id, matricula: { escolaId: escola.id, aluno: { escolaId: escola.id, responsavelId } } },
      });
      assert.ok(await query(responsavelA.id));
      assert.equal(await query(responsavelB.id), null);
      assert.notEqual(matriculaA.id, matriculaB.id);
    });

    await context.test("administrador legado", async () => {
      const config = normalizeAdminSessionConfiguration(process.env.ADMIN_EMAIL, process.env.ADMIN_PASSWORD_HASH);
      assert.ok(config);
      const token = await createSessionToken(config.email, config.passwordHash);
      assert.equal(await verifySessionToken(token, config.email, config.passwordHash), true);
    });
  } finally {
    if (created.escolaId) {
      const escolaId = created.escolaId;
      await prisma.$transaction(async (tx) => {
        await tx.emailTransacional.deleteMany({ where: { escolaId } });
        await tx.registroAuditoria.deleteMany({ where: { escolaId } });
        await tx.tentativaLogin.deleteMany({ where: { escolaId } });
        await tx.recuperacaoSenha.deleteMany({ where: { escolaId } });
        await tx.conviteAcesso.deleteMany({ where: { escolaId } });
        await tx.sessaoUsuario.deleteMany({ where: { usuario: { escolaId } } });
        await tx.documentoMatricula.deleteMany({ where: { escolaId } });
        await tx.conviteMatricula.deleteMany({ where: { escolaId } });
        await tx.pagamentoMatricula.deleteMany({ where: { escolaId } });
        await tx.tarefa.deleteMany({ where: { escolaId } });
        await tx.respostaComunicado.deleteMany({ where: { escolaId } });
        await tx.destinatarioComunicado.deleteMany({ where: { escolaId } });
        await tx.comunicado.deleteMany({ where: { escolaId } });
        await tx.ocorrenciaAluno.deleteMany({ where: { escolaId } });
        await tx.usuario.deleteMany({ where: { escolaId } });
        await tx.matricula.deleteMany({ where: { escolaId } });
        await tx.aluno.deleteMany({ where: { escolaId } });
        await tx.turma.deleteMany({ where: { escolaId } });
        await tx.responsavel.deleteMany({ where: { escolaId } });
        await tx.escola.delete({ where: { id: escolaId } });
      });
      assert.equal(
        await prisma.escola.count({ where: { nome: `${marker} Escola` } }),
        0,
      );
    }
    await prisma.$disconnect();
  }
});
