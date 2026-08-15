-- CreateEnum
CREATE TYPE "StatusMensagemFamilia" AS ENUM ('ABERTA', 'RESPONDIDA', 'ENCERRADA');

-- CreateEnum
CREATE TYPE "AutorMensagemFamilia" AS ENUM ('RESPONSAVEL', 'ESCOLA');

-- CreateTable
CREATE TABLE "MensagemFamilia" (
    "id" TEXT NOT NULL,
    "assunto" TEXT NOT NULL,
    "status" "StatusMensagemFamilia" NOT NULL DEFAULT 'ABERTA',
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizadoEm" TIMESTAMP(3) NOT NULL,
    "escolaId" TEXT NOT NULL,
    "responsavelId" TEXT NOT NULL,
    "alunoId" TEXT,

    CONSTRAINT "MensagemFamilia_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MensagemFamiliaItem" (
    "id" TEXT NOT NULL,
    "autor" "AutorMensagemFamilia" NOT NULL,
    "autorNome" TEXT NOT NULL,
    "texto" TEXT NOT NULL,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "mensagemId" TEXT NOT NULL,

    CONSTRAINT "MensagemFamiliaItem_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "MensagemFamilia_escolaId_idx" ON "MensagemFamilia"("escolaId");

-- CreateIndex
CREATE INDEX "MensagemFamilia_responsavelId_idx" ON "MensagemFamilia"("responsavelId");

-- CreateIndex
CREATE INDEX "MensagemFamilia_status_idx" ON "MensagemFamilia"("status");

-- CreateIndex
CREATE INDEX "MensagemFamiliaItem_mensagemId_idx" ON "MensagemFamiliaItem"("mensagemId");

-- AddForeignKey
ALTER TABLE "MensagemFamilia" ADD CONSTRAINT "MensagemFamilia_escolaId_fkey" FOREIGN KEY ("escolaId") REFERENCES "Escola"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MensagemFamilia" ADD CONSTRAINT "MensagemFamilia_responsavelId_fkey" FOREIGN KEY ("responsavelId") REFERENCES "Responsavel"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MensagemFamilia" ADD CONSTRAINT "MensagemFamilia_alunoId_fkey" FOREIGN KEY ("alunoId") REFERENCES "Aluno"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MensagemFamiliaItem" ADD CONSTRAINT "MensagemFamiliaItem_mensagemId_fkey" FOREIGN KEY ("mensagemId") REFERENCES "MensagemFamilia"("id") ON DELETE CASCADE ON UPDATE CASCADE;
