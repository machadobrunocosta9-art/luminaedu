-- Sprint 0: additive identity, access, audit and transactional email foundation.
-- This migration intentionally does not alter or remove existing tables, columns or constraints.

CREATE TYPE "PapelUsuario" AS ENUM ('ADMINISTRADOR', 'SECRETARIA', 'COORDENACAO', 'FINANCEIRO', 'RESPONSAVEL');
CREATE TYPE "StatusUsuario" AS ENUM ('PENDENTE', 'ATIVO', 'BLOQUEADO');
CREATE TYPE "StatusConviteAcesso" AS ENUM ('PENDENTE', 'UTILIZADO', 'CANCELADO', 'EXPIRADO');
CREATE TYPE "TipoEmailTransacional" AS ENUM ('CONVITE_ACESSO', 'RECUPERACAO_SENHA', 'CONFIRMACAO_CONTA', 'COMUNICADO', 'AVISO_DOCUMENTO', 'ATUALIZACAO_MATRICULA', 'CRM');
CREATE TYPE "StatusEmailTransacional" AS ENUM ('PENDENTE', 'ENVIADO', 'FALHOU', 'NAO_CONFIGURADO');

CREATE TABLE "Usuario" (
    "id" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "senhaHash" TEXT NOT NULL,
    "papel" "PapelUsuario" NOT NULL,
    "status" "StatusUsuario" NOT NULL DEFAULT 'PENDENTE',
    "ultimoAcessoEm" TIMESTAMP(3),
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizadoEm" TIMESTAMP(3) NOT NULL,
    "escolaId" TEXT NOT NULL,
    "responsavelId" TEXT,
    CONSTRAINT "Usuario_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "SessaoUsuario" (
    "id" TEXT NOT NULL,
    "tokenHash" TEXT NOT NULL,
    "expiraEm" TIMESTAMP(3) NOT NULL,
    "revogadaEm" TIMESTAMP(3),
    "ultimoUsoEm" TIMESTAMP(3),
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "usuarioId" TEXT NOT NULL,
    CONSTRAINT "SessaoUsuario_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "ConviteAcesso" (
    "id" TEXT NOT NULL,
    "tokenHash" TEXT NOT NULL,
    "status" "StatusConviteAcesso" NOT NULL DEFAULT 'PENDENTE',
    "expiraEm" TIMESTAMP(3) NOT NULL,
    "utilizadoEm" TIMESTAMP(3),
    "canceladoEm" TIMESTAMP(3),
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizadoEm" TIMESTAMP(3) NOT NULL,
    "escolaId" TEXT NOT NULL,
    "responsavelId" TEXT NOT NULL,
    "alunoId" TEXT,
    "matriculaId" TEXT,
    "criadoPorUsuarioId" TEXT,
    "usuarioAtivadoId" TEXT,
    CONSTRAINT "ConviteAcesso_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "RecuperacaoSenha" (
    "id" TEXT NOT NULL,
    "tokenHash" TEXT NOT NULL,
    "expiraEm" TIMESTAMP(3) NOT NULL,
    "utilizadoEm" TIMESTAMP(3),
    "revogadoEm" TIMESTAMP(3),
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "escolaId" TEXT NOT NULL,
    "usuarioId" TEXT NOT NULL,
    CONSTRAINT "RecuperacaoSenha_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "TentativaLogin" (
    "id" TEXT NOT NULL,
    "identificadorHash" TEXT NOT NULL,
    "ipHash" TEXT,
    "sucesso" BOOLEAN NOT NULL DEFAULT false,
    "bloqueada" BOOLEAN NOT NULL DEFAULT false,
    "criadaEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "escolaId" TEXT,
    CONSTRAINT "TentativaLogin_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "RegistroAuditoria" (
    "id" TEXT NOT NULL,
    "acao" TEXT NOT NULL,
    "resultado" TEXT NOT NULL,
    "entidade" TEXT,
    "entidadeId" TEXT,
    "metadados" JSONB,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "escolaId" TEXT NOT NULL,
    "usuarioId" TEXT,
    CONSTRAINT "RegistroAuditoria_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "EmailTransacional" (
    "id" TEXT NOT NULL,
    "tipo" "TipoEmailTransacional" NOT NULL,
    "status" "StatusEmailTransacional" NOT NULL DEFAULT 'PENDENTE',
    "destinatario" TEXT NOT NULL,
    "assunto" TEXT NOT NULL,
    "conteudo" TEXT NOT NULL,
    "provedor" TEXT,
    "mensagemExternaId" TEXT,
    "tentativas" INTEGER NOT NULL DEFAULT 0,
    "erroClasse" TEXT,
    "enviadoEm" TIMESTAMP(3),
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizadoEm" TIMESTAMP(3) NOT NULL,
    "escolaId" TEXT NOT NULL,
    "criadoPorUsuarioId" TEXT,
    CONSTRAINT "EmailTransacional_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "Usuario_email_key" ON "Usuario"("email");
CREATE UNIQUE INDEX "Usuario_responsavelId_key" ON "Usuario"("responsavelId");
CREATE INDEX "Usuario_escolaId_idx" ON "Usuario"("escolaId");
CREATE INDEX "Usuario_papel_idx" ON "Usuario"("papel");
CREATE INDEX "Usuario_status_idx" ON "Usuario"("status");

CREATE UNIQUE INDEX "SessaoUsuario_tokenHash_key" ON "SessaoUsuario"("tokenHash");
CREATE INDEX "SessaoUsuario_usuarioId_idx" ON "SessaoUsuario"("usuarioId");
CREATE INDEX "SessaoUsuario_expiraEm_idx" ON "SessaoUsuario"("expiraEm");
CREATE INDEX "SessaoUsuario_revogadaEm_idx" ON "SessaoUsuario"("revogadaEm");

CREATE UNIQUE INDEX "ConviteAcesso_tokenHash_key" ON "ConviteAcesso"("tokenHash");
CREATE INDEX "ConviteAcesso_escolaId_idx" ON "ConviteAcesso"("escolaId");
CREATE INDEX "ConviteAcesso_responsavelId_idx" ON "ConviteAcesso"("responsavelId");
CREATE INDEX "ConviteAcesso_alunoId_idx" ON "ConviteAcesso"("alunoId");
CREATE INDEX "ConviteAcesso_matriculaId_idx" ON "ConviteAcesso"("matriculaId");
CREATE INDEX "ConviteAcesso_status_idx" ON "ConviteAcesso"("status");
CREATE INDEX "ConviteAcesso_expiraEm_idx" ON "ConviteAcesso"("expiraEm");

CREATE UNIQUE INDEX "RecuperacaoSenha_tokenHash_key" ON "RecuperacaoSenha"("tokenHash");
CREATE INDEX "RecuperacaoSenha_escolaId_idx" ON "RecuperacaoSenha"("escolaId");
CREATE INDEX "RecuperacaoSenha_usuarioId_idx" ON "RecuperacaoSenha"("usuarioId");
CREATE INDEX "RecuperacaoSenha_expiraEm_idx" ON "RecuperacaoSenha"("expiraEm");

CREATE INDEX "TentativaLogin_identificadorHash_criadaEm_idx" ON "TentativaLogin"("identificadorHash", "criadaEm");
CREATE INDEX "TentativaLogin_ipHash_criadaEm_idx" ON "TentativaLogin"("ipHash", "criadaEm");
CREATE INDEX "TentativaLogin_escolaId_idx" ON "TentativaLogin"("escolaId");

CREATE INDEX "RegistroAuditoria_escolaId_criadoEm_idx" ON "RegistroAuditoria"("escolaId", "criadoEm");
CREATE INDEX "RegistroAuditoria_usuarioId_idx" ON "RegistroAuditoria"("usuarioId");
CREATE INDEX "RegistroAuditoria_acao_idx" ON "RegistroAuditoria"("acao");

CREATE INDEX "EmailTransacional_escolaId_criadoEm_idx" ON "EmailTransacional"("escolaId", "criadoEm");
CREATE INDEX "EmailTransacional_status_idx" ON "EmailTransacional"("status");
CREATE INDEX "EmailTransacional_tipo_idx" ON "EmailTransacional"("tipo");

ALTER TABLE "Usuario" ADD CONSTRAINT "Usuario_escolaId_fkey" FOREIGN KEY ("escolaId") REFERENCES "Escola"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "Usuario" ADD CONSTRAINT "Usuario_responsavelId_fkey" FOREIGN KEY ("responsavelId") REFERENCES "Responsavel"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "SessaoUsuario" ADD CONSTRAINT "SessaoUsuario_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "Usuario"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ConviteAcesso" ADD CONSTRAINT "ConviteAcesso_escolaId_fkey" FOREIGN KEY ("escolaId") REFERENCES "Escola"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "ConviteAcesso" ADD CONSTRAINT "ConviteAcesso_responsavelId_fkey" FOREIGN KEY ("responsavelId") REFERENCES "Responsavel"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "ConviteAcesso" ADD CONSTRAINT "ConviteAcesso_alunoId_fkey" FOREIGN KEY ("alunoId") REFERENCES "Aluno"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "ConviteAcesso" ADD CONSTRAINT "ConviteAcesso_matriculaId_fkey" FOREIGN KEY ("matriculaId") REFERENCES "Matricula"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "ConviteAcesso" ADD CONSTRAINT "ConviteAcesso_criadoPorUsuarioId_fkey" FOREIGN KEY ("criadoPorUsuarioId") REFERENCES "Usuario"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "ConviteAcesso" ADD CONSTRAINT "ConviteAcesso_usuarioAtivadoId_fkey" FOREIGN KEY ("usuarioAtivadoId") REFERENCES "Usuario"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "RecuperacaoSenha" ADD CONSTRAINT "RecuperacaoSenha_escolaId_fkey" FOREIGN KEY ("escolaId") REFERENCES "Escola"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "RecuperacaoSenha" ADD CONSTRAINT "RecuperacaoSenha_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "Usuario"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "TentativaLogin" ADD CONSTRAINT "TentativaLogin_escolaId_fkey" FOREIGN KEY ("escolaId") REFERENCES "Escola"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "RegistroAuditoria" ADD CONSTRAINT "RegistroAuditoria_escolaId_fkey" FOREIGN KEY ("escolaId") REFERENCES "Escola"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "RegistroAuditoria" ADD CONSTRAINT "RegistroAuditoria_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "Usuario"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "EmailTransacional" ADD CONSTRAINT "EmailTransacional_escolaId_fkey" FOREIGN KEY ("escolaId") REFERENCES "Escola"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "EmailTransacional" ADD CONSTRAINT "EmailTransacional_criadoPorUsuarioId_fkey" FOREIGN KEY ("criadoPorUsuarioId") REFERENCES "Usuario"("id") ON DELETE SET NULL ON UPDATE CASCADE;
