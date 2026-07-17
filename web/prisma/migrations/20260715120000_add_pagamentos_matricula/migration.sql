-- CreateEnum
CREATE TYPE "StatusPagamentoMatricula" AS ENUM ('PENDENTE', 'EM_ANALISE', 'CONFIRMADO', 'CANCELADO');

-- CreateEnum
CREATE TYPE "FormaPagamentoMatricula" AS ENUM ('PIX', 'CARTAO', 'BOLETO', 'DINHEIRO', 'TRANSFERENCIA', 'OUTRO');

-- CreateTable
CREATE TABLE "PagamentoMatricula" (
    "id" TEXT NOT NULL,
    "status" "StatusPagamentoMatricula" NOT NULL DEFAULT 'PENDENTE',
    "descricao" TEXT NOT NULL DEFAULT 'Taxa de matrícula',
    "valorCentavos" INTEGER NOT NULL,
    "vencimento" TIMESTAMP(3),
    "formaPagamento" "FormaPagamentoMatricula",
    "referencia" TEXT,
    "observacao" TEXT,
    "pagoEm" TIMESTAMP(3),
    "confirmadoEm" TIMESTAMP(3),
    "canceladoEm" TIMESTAMP(3),
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizadoEm" TIMESTAMP(3) NOT NULL,
    "escolaId" TEXT NOT NULL,
    "matriculaId" TEXT NOT NULL,

    CONSTRAINT "PagamentoMatricula_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "PagamentoMatricula_matriculaId_key" ON "PagamentoMatricula"("matriculaId");

-- CreateIndex
CREATE INDEX "PagamentoMatricula_escolaId_idx" ON "PagamentoMatricula"("escolaId");

-- CreateIndex
CREATE INDEX "PagamentoMatricula_status_idx" ON "PagamentoMatricula"("status");

-- CreateIndex
CREATE INDEX "PagamentoMatricula_vencimento_idx" ON "PagamentoMatricula"("vencimento");

-- AddForeignKey
ALTER TABLE "PagamentoMatricula" ADD CONSTRAINT "PagamentoMatricula_escolaId_fkey" FOREIGN KEY ("escolaId") REFERENCES "Escola"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PagamentoMatricula" ADD CONSTRAINT "PagamentoMatricula_matriculaId_fkey" FOREIGN KEY ("matriculaId") REFERENCES "Matricula"("id") ON DELETE CASCADE ON UPDATE CASCADE;
