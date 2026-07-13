-- CreateEnum
CREATE TYPE "StatusConviteMatricula" AS ENUM ('AGUARDANDO_ENVIO', 'AGUARDANDO_RESPONSAVEL', 'EM_PREENCHIMENTO', 'PREENCHIDO', 'CONCLUIDO', 'EXPIRADO', 'CANCELADO');

-- CreateTable
CREATE TABLE "ConviteMatricula" (
    "id" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "status" "StatusConviteMatricula" NOT NULL DEFAULT 'AGUARDANDO_ENVIO',
    "nomeAluno" TEXT NOT NULL,
    "nomeResponsavel" TEXT NOT NULL,
    "telefoneResponsavel" TEXT NOT NULL,
    "emailResponsavel" TEXT,
    "anoLetivo" INTEGER NOT NULL,
    "expiraEm" TIMESTAMP(3) NOT NULL,
    "enviadoEm" TIMESTAMP(3),
    "visualizadoEm" TIMESTAMP(3),
    "preenchidoEm" TIMESTAMP(3),
    "concluidoEm" TIMESTAMP(3),
    "canceladoEm" TIMESTAMP(3),
    "rascunhoDados" JSONB,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizadoEm" TIMESTAMP(3) NOT NULL,
    "escolaId" TEXT NOT NULL,
    "turmaId" TEXT,
    "matriculaId" TEXT,

    CONSTRAINT "ConviteMatricula_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ConviteMatricula_token_key" ON "ConviteMatricula"("token");

-- CreateIndex
CREATE UNIQUE INDEX "ConviteMatricula_matriculaId_key" ON "ConviteMatricula"("matriculaId");

-- CreateIndex
CREATE INDEX "ConviteMatricula_escolaId_idx" ON "ConviteMatricula"("escolaId");

-- CreateIndex
CREATE INDEX "ConviteMatricula_turmaId_idx" ON "ConviteMatricula"("turmaId");

-- CreateIndex
CREATE INDEX "ConviteMatricula_status_idx" ON "ConviteMatricula"("status");

-- CreateIndex
CREATE INDEX "ConviteMatricula_expiraEm_idx" ON "ConviteMatricula"("expiraEm");

-- AddForeignKey
ALTER TABLE "ConviteMatricula" ADD CONSTRAINT "ConviteMatricula_escolaId_fkey" FOREIGN KEY ("escolaId") REFERENCES "Escola"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ConviteMatricula" ADD CONSTRAINT "ConviteMatricula_turmaId_fkey" FOREIGN KEY ("turmaId") REFERENCES "Turma"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ConviteMatricula" ADD CONSTRAINT "ConviteMatricula_matriculaId_fkey" FOREIGN KEY ("matriculaId") REFERENCES "Matricula"("id") ON DELETE SET NULL ON UPDATE CASCADE;
