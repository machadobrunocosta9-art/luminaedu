-- CreateEnum
CREATE TYPE "TipoDocumentoMatricula" AS ENUM ('CERTIDAO_NASCIMENTO', 'RG_ALUNO', 'CPF_ALUNO', 'RG_RESPONSAVEL', 'CPF_RESPONSAVEL', 'COMPROVANTE_RESIDENCIA', 'CARTEIRA_VACINACAO', 'FOTO_ALUNO', 'LAUDO_MEDICO', 'CONTRATO_ASSINADO', 'COMPROVANTE_PAGAMENTO', 'OUTRO');

-- CreateEnum
CREATE TYPE "StatusDocumentoMatricula" AS ENUM ('PENDENTE', 'ENVIADO', 'EM_ANALISE', 'APROVADO', 'REJEITADO', 'REENVIO_SOLICITADO', 'CANCELADO');

-- CreateTable
CREATE TABLE "DocumentoMatricula" (
    "id" TEXT NOT NULL,
    "tipo" "TipoDocumentoMatricula" NOT NULL,
    "status" "StatusDocumentoMatricula" NOT NULL DEFAULT 'PENDENTE',
    "titulo" TEXT NOT NULL,
    "descricao" TEXT,
    "obrigatorio" BOOLEAN NOT NULL DEFAULT true,
    "ordemExibicao" INTEGER NOT NULL DEFAULT 0,
    "nomeArquivoOriginal" TEXT,
    "nomeArquivoInterno" TEXT,
    "urlArquivo" TEXT,
    "chaveArmazenamento" TEXT,
    "mimeType" TEXT,
    "extensao" TEXT,
    "tamanhoBytes" INTEGER,
    "versao" INTEGER NOT NULL DEFAULT 1,
    "observacaoResponsavel" TEXT,
    "observacaoSecretaria" TEXT,
    "motivoRejeicao" TEXT,
    "enviadoEm" TIMESTAMP(3),
    "analisadoEm" TIMESTAMP(3),
    "aprovadoEm" TIMESTAMP(3),
    "rejeitadoEm" TIMESTAMP(3),
    "reenvioSolicitadoEm" TIMESTAMP(3),
    "analisadoPor" TEXT,
    "aprovadoPor" TEXT,
    "rejeitadoPor" TEXT,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizadoEm" TIMESTAMP(3) NOT NULL,
    "escolaId" TEXT NOT NULL,
    "conviteId" TEXT NOT NULL,
    "matriculaId" TEXT,

    CONSTRAINT "DocumentoMatricula_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "DocumentoMatricula_escolaId_idx" ON "DocumentoMatricula"("escolaId");

-- CreateIndex
CREATE INDEX "DocumentoMatricula_conviteId_idx" ON "DocumentoMatricula"("conviteId");

-- CreateIndex
CREATE INDEX "DocumentoMatricula_matriculaId_idx" ON "DocumentoMatricula"("matriculaId");

-- CreateIndex
CREATE INDEX "DocumentoMatricula_status_idx" ON "DocumentoMatricula"("status");

-- CreateIndex
CREATE INDEX "DocumentoMatricula_tipo_idx" ON "DocumentoMatricula"("tipo");

-- CreateIndex
CREATE INDEX "DocumentoMatricula_conviteId_tipo_idx" ON "DocumentoMatricula"("conviteId", "tipo");

-- AddForeignKey
ALTER TABLE "DocumentoMatricula" ADD CONSTRAINT "DocumentoMatricula_escolaId_fkey" FOREIGN KEY ("escolaId") REFERENCES "Escola"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DocumentoMatricula" ADD CONSTRAINT "DocumentoMatricula_conviteId_fkey" FOREIGN KEY ("conviteId") REFERENCES "ConviteMatricula"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DocumentoMatricula" ADD CONSTRAINT "DocumentoMatricula_matriculaId_fkey" FOREIGN KEY ("matriculaId") REFERENCES "Matricula"("id") ON DELETE SET NULL ON UPDATE CASCADE;
