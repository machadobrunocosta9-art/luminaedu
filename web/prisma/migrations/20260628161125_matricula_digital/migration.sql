/*
  Warnings:

  - You are about to drop the column `createdAt` on the `Aluno` table. All the data in the column will be lost.
  - You are about to drop the column `responsavel` on the `Aluno` table. All the data in the column will be lost.
  - You are about to drop the column `status` on the `Aluno` table. All the data in the column will be lost.
  - You are about to drop the column `telefone` on the `Aluno` table. All the data in the column will be lost.
  - You are about to drop the column `turma` on the `Aluno` table. All the data in the column will be lost.
  - You are about to drop the column `updatedAt` on the `Aluno` table. All the data in the column will be lost.
  - Added the required column `atualizadoEm` to the `Aluno` table without a default value. This is not possible if the table is not empty.
  - Added the required column `dataNascimento` to the `Aluno` table without a default value. This is not possible if the table is not empty.
  - Added the required column `responsavelId` to the `Aluno` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "StatusMatricula" AS ENUM ('PENDENTE', 'ATIVA', 'CANCELADA', 'CONCLUIDA');

-- AlterTable
ALTER TABLE "Aluno" DROP COLUMN "createdAt",
DROP COLUMN "responsavel",
DROP COLUMN "status",
DROP COLUMN "telefone",
DROP COLUMN "turma",
DROP COLUMN "updatedAt",
ADD COLUMN     "alergias" TEXT,
ADD COLUMN     "atualizadoEm" TIMESTAMP(3) NOT NULL,
ADD COLUMN     "certidaoNascimento" TEXT,
ADD COLUMN     "cpf" TEXT,
ADD COLUMN     "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "dataNascimento" TIMESTAMP(3) NOT NULL,
ADD COLUMN     "observacoes" TEXT,
ADD COLUMN     "responsavelId" TEXT NOT NULL,
ADD COLUMN     "sexo" TEXT,
ADD COLUMN     "turmaId" TEXT;

-- CreateTable
CREATE TABLE "Responsavel" (
    "id" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "cpf" TEXT,
    "email" TEXT,
    "telefone" TEXT NOT NULL,
    "profissao" TEXT,
    "endereco" TEXT,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizadoEm" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Responsavel_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Turma" (
    "id" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "segmento" TEXT NOT NULL,
    "turno" TEXT NOT NULL,
    "capacidade" INTEGER NOT NULL,

    CONSTRAINT "Turma_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Matricula" (
    "id" TEXT NOT NULL,
    "anoLetivo" INTEGER NOT NULL,
    "dataMatricula" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "status" "StatusMatricula" NOT NULL DEFAULT 'PENDENTE',
    "alunoId" TEXT NOT NULL,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Matricula_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Responsavel_cpf_key" ON "Responsavel"("cpf");

-- AddForeignKey
ALTER TABLE "Aluno" ADD CONSTRAINT "Aluno_responsavelId_fkey" FOREIGN KEY ("responsavelId") REFERENCES "Responsavel"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Aluno" ADD CONSTRAINT "Aluno_turmaId_fkey" FOREIGN KEY ("turmaId") REFERENCES "Turma"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Matricula" ADD CONSTRAINT "Matricula_alunoId_fkey" FOREIGN KEY ("alunoId") REFERENCES "Aluno"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
