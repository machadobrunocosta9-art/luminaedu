/*
  Warnings:

  - Added the required column `escolaId` to the `Aluno` table without a default value. This is not possible if the table is not empty.
  - Added the required column `atualizadoEm` to the `Matricula` table without a default value. This is not possible if the table is not empty.
  - Added the required column `escolaId` to the `Matricula` table without a default value. This is not possible if the table is not empty.
  - Added the required column `escolaId` to the `Responsavel` table without a default value. This is not possible if the table is not empty.
  - Added the required column `atualizadoEm` to the `Turma` table without a default value. This is not possible if the table is not empty.
  - Added the required column `escolaId` to the `Turma` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "StatusTarefa" AS ENUM ('A_FAZER', 'EM_ANDAMENTO', 'AGUARDANDO', 'CONCLUIDA');

-- CreateEnum
CREATE TYPE "PrioridadeTarefa" AS ENUM ('BAIXA', 'MEDIA', 'ALTA', 'CRITICA');

-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "StatusMatricula" ADD VALUE 'EM_ANALISE';
ALTER TYPE "StatusMatricula" ADD VALUE 'AGUARDANDO_DOCUMENTOS';
ALTER TYPE "StatusMatricula" ADD VALUE 'AGUARDANDO_PAGAMENTO';

-- AlterTable
ALTER TABLE "Aluno" ADD COLUMN     "escolaId" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "Matricula" ADD COLUMN     "atualizadoEm" TIMESTAMP(3) NOT NULL,
ADD COLUMN     "escolaId" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "Responsavel" ADD COLUMN     "escolaId" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "Turma" ADD COLUMN     "atualizadoEm" TIMESTAMP(3) NOT NULL,
ADD COLUMN     "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "escolaId" TEXT NOT NULL;

-- CreateTable
CREATE TABLE "Escola" (
    "id" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizadoEm" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Escola_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Tarefa" (
    "id" TEXT NOT NULL,
    "titulo" TEXT NOT NULL,
    "descricao" TEXT,
    "setor" TEXT NOT NULL,
    "responsavel" TEXT,
    "status" "StatusTarefa" NOT NULL DEFAULT 'A_FAZER',
    "prioridade" "PrioridadeTarefa" NOT NULL DEFAULT 'MEDIA',
    "prazo" TIMESTAMP(3),
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizadoEm" TIMESTAMP(3) NOT NULL,
    "escolaId" TEXT NOT NULL,
    "alunoId" TEXT,
    "matriculaId" TEXT,

    CONSTRAINT "Tarefa_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "Responsavel" ADD CONSTRAINT "Responsavel_escolaId_fkey" FOREIGN KEY ("escolaId") REFERENCES "Escola"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Turma" ADD CONSTRAINT "Turma_escolaId_fkey" FOREIGN KEY ("escolaId") REFERENCES "Escola"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Aluno" ADD CONSTRAINT "Aluno_escolaId_fkey" FOREIGN KEY ("escolaId") REFERENCES "Escola"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Matricula" ADD CONSTRAINT "Matricula_escolaId_fkey" FOREIGN KEY ("escolaId") REFERENCES "Escola"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Tarefa" ADD CONSTRAINT "Tarefa_escolaId_fkey" FOREIGN KEY ("escolaId") REFERENCES "Escola"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Tarefa" ADD CONSTRAINT "Tarefa_alunoId_fkey" FOREIGN KEY ("alunoId") REFERENCES "Aluno"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Tarefa" ADD CONSTRAINT "Tarefa_matriculaId_fkey" FOREIGN KEY ("matriculaId") REFERENCES "Matricula"("id") ON DELETE SET NULL ON UPDATE CASCADE;
