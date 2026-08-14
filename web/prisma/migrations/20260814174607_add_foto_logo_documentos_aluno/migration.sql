-- AlterTable
ALTER TABLE "Aluno" ADD COLUMN     "fotoUrl" TEXT;

-- AlterTable
ALTER TABLE "Escola" ADD COLUMN     "logoUrl" TEXT;

-- CreateTable
CREATE TABLE "DocumentoAluno" (
    "id" TEXT NOT NULL,
    "titulo" TEXT NOT NULL,
    "descricao" TEXT,
    "nomeArquivoOriginal" TEXT,
    "urlArquivo" TEXT NOT NULL,
    "chaveArmazenamento" TEXT NOT NULL,
    "mimeType" TEXT,
    "tamanhoBytes" INTEGER,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizadoEm" TIMESTAMP(3) NOT NULL,
    "escolaId" TEXT NOT NULL,
    "alunoId" TEXT NOT NULL,

    CONSTRAINT "DocumentoAluno_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "DocumentoAluno_escolaId_idx" ON "DocumentoAluno"("escolaId");

-- CreateIndex
CREATE INDEX "DocumentoAluno_alunoId_idx" ON "DocumentoAluno"("alunoId");

-- AddForeignKey
ALTER TABLE "DocumentoAluno" ADD CONSTRAINT "DocumentoAluno_escolaId_fkey" FOREIGN KEY ("escolaId") REFERENCES "Escola"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DocumentoAluno" ADD CONSTRAINT "DocumentoAluno_alunoId_fkey" FOREIGN KEY ("alunoId") REFERENCES "Aluno"("id") ON DELETE CASCADE ON UPDATE CASCADE;
