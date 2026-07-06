/*
  Warnings:

  - A unique constraint covering the columns `[tokenCiencia]` on the table `OcorrenciaAluno` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "OcorrenciaAluno" ADD COLUMN     "cienciaConfirmada" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "dataCiencia" TIMESTAMP(3),
ADD COLUMN     "nomeConfirmante" TEXT,
ADD COLUMN     "observacaoCiencia" TEXT,
ADD COLUMN     "parentescoConfirmante" TEXT,
ADD COLUMN     "tokenCiencia" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "OcorrenciaAluno_tokenCiencia_key" ON "OcorrenciaAluno"("tokenCiencia");
