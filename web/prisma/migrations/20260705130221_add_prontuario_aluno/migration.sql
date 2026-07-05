-- CreateEnum
CREATE TYPE "TipoOcorrenciaAluno" AS ENUM ('ADVERTENCIA', 'SUSPENSAO', 'OCORRENCIA', 'RELATORIO', 'RESUMO', 'ATENDIMENTO');

-- CreateEnum
CREATE TYPE "StatusOcorrenciaAluno" AS ENUM ('RASCUNHO', 'REGISTRADO', 'ENVIADO', 'CANCELADO');

-- CreateTable
CREATE TABLE "OcorrenciaAluno" (
    "id" TEXT NOT NULL,
    "tipo" "TipoOcorrenciaAluno" NOT NULL,
    "titulo" TEXT NOT NULL,
    "descricao" TEXT NOT NULL,
    "textoFinal" TEXT,
    "status" "StatusOcorrenciaAluno" NOT NULL DEFAULT 'REGISTRADO',
    "enviarParaResponsavel" BOOLEAN NOT NULL DEFAULT false,
    "enviadoPorEmail" BOOLEAN NOT NULL DEFAULT false,
    "emailResponsavel" TEXT,
    "dataEnvioEmail" TIMESTAMP(3),
    "inicioSuspensao" TIMESTAMP(3),
    "fimSuspensao" TIMESTAMP(3),
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizadoEm" TIMESTAMP(3) NOT NULL,
    "escolaId" TEXT NOT NULL,
    "alunoId" TEXT NOT NULL,

    CONSTRAINT "OcorrenciaAluno_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "OcorrenciaAluno" ADD CONSTRAINT "OcorrenciaAluno_escolaId_fkey" FOREIGN KEY ("escolaId") REFERENCES "Escola"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OcorrenciaAluno" ADD CONSTRAINT "OcorrenciaAluno_alunoId_fkey" FOREIGN KEY ("alunoId") REFERENCES "Aluno"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
