-- CreateEnum
CREATE TYPE "TipoComunicado" AS ENUM ('SIMPLES', 'CIENCIA', 'EVENTO', 'AUTORIZACAO', 'PAGAMENTO');

-- CreateEnum
CREATE TYPE "StatusComunicado" AS ENUM ('RASCUNHO', 'PREPARADO', 'ENVIADO', 'CANCELADO', 'ARQUIVADO');

-- CreateEnum
CREATE TYPE "StatusDestinatarioComunicado" AS ENUM ('PENDENTE', 'ENVIADO', 'VISUALIZADO', 'RESPONDIDO', 'CANCELADO');

-- CreateEnum
CREATE TYPE "TipoRespostaComunicado" AS ENUM ('CIENTE', 'PARTICIPA', 'NAO_PARTICIPA', 'AUTORIZADO', 'NAO_AUTORIZADO', 'RESPOSTA_TEXTO');

-- CreateTable
CREATE TABLE "Comunicado" (
    "id" TEXT NOT NULL,
    "tipo" "TipoComunicado" NOT NULL,
    "status" "StatusComunicado" NOT NULL DEFAULT 'RASCUNHO',
    "titulo" TEXT NOT NULL,
    "conteudo" TEXT NOT NULL,
    "publicoAlvo" TEXT,
    "observacoes" TEXT,
    "dataEvento" TIMESTAMP(3),
    "horaEvento" TEXT,
    "localEvento" TEXT,
    "valorCentavos" INTEGER,
    "requerCiencia" BOOLEAN NOT NULL DEFAULT false,
    "requerParticipacao" BOOLEAN NOT NULL DEFAULT false,
    "requerAutorizacao" BOOLEAN NOT NULL DEFAULT false,
    "requerPagamento" BOOLEAN NOT NULL DEFAULT false,
    "permiteRespostaTexto" BOOLEAN NOT NULL DEFAULT false,
    "enviadoEm" TIMESTAMP(3),
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizadoEm" TIMESTAMP(3) NOT NULL,
    "escolaId" TEXT NOT NULL,
    "alunoId" TEXT,
    "turmaId" TEXT,

    CONSTRAINT "Comunicado_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DestinatarioComunicado" (
    "id" TEXT NOT NULL,
    "status" "StatusDestinatarioComunicado" NOT NULL DEFAULT 'PENDENTE',
    "nomeResponsavel" TEXT,
    "email" TEXT,
    "telefone" TEXT,
    "tokenResposta" TEXT,
    "enviadoEm" TIMESTAMP(3),
    "visualizadoEm" TIMESTAMP(3),
    "respondidoEm" TIMESTAMP(3),
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizadoEm" TIMESTAMP(3) NOT NULL,
    "escolaId" TEXT NOT NULL,
    "comunicadoId" TEXT NOT NULL,
    "alunoId" TEXT,
    "responsavelId" TEXT,

    CONSTRAINT "DestinatarioComunicado_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RespostaComunicado" (
    "id" TEXT NOT NULL,
    "tipo" "TipoRespostaComunicado" NOT NULL,
    "cienciaConfirmada" BOOLEAN NOT NULL DEFAULT false,
    "participa" BOOLEAN,
    "autorizado" BOOLEAN,
    "motivoNegativa" TEXT,
    "observacao" TEXT,
    "nomeRespondente" TEXT,
    "parentescoRespondente" TEXT,
    "dataResposta" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizadoEm" TIMESTAMP(3) NOT NULL,
    "escolaId" TEXT NOT NULL,
    "comunicadoId" TEXT NOT NULL,
    "destinatarioId" TEXT NOT NULL,
    "alunoId" TEXT,
    "responsavelId" TEXT,

    CONSTRAINT "RespostaComunicado_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "DestinatarioComunicado_tokenResposta_key" ON "DestinatarioComunicado"("tokenResposta");

-- AddForeignKey
ALTER TABLE "Comunicado" ADD CONSTRAINT "Comunicado_escolaId_fkey" FOREIGN KEY ("escolaId") REFERENCES "Escola"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Comunicado" ADD CONSTRAINT "Comunicado_alunoId_fkey" FOREIGN KEY ("alunoId") REFERENCES "Aluno"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Comunicado" ADD CONSTRAINT "Comunicado_turmaId_fkey" FOREIGN KEY ("turmaId") REFERENCES "Turma"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DestinatarioComunicado" ADD CONSTRAINT "DestinatarioComunicado_escolaId_fkey" FOREIGN KEY ("escolaId") REFERENCES "Escola"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DestinatarioComunicado" ADD CONSTRAINT "DestinatarioComunicado_comunicadoId_fkey" FOREIGN KEY ("comunicadoId") REFERENCES "Comunicado"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DestinatarioComunicado" ADD CONSTRAINT "DestinatarioComunicado_alunoId_fkey" FOREIGN KEY ("alunoId") REFERENCES "Aluno"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DestinatarioComunicado" ADD CONSTRAINT "DestinatarioComunicado_responsavelId_fkey" FOREIGN KEY ("responsavelId") REFERENCES "Responsavel"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RespostaComunicado" ADD CONSTRAINT "RespostaComunicado_escolaId_fkey" FOREIGN KEY ("escolaId") REFERENCES "Escola"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RespostaComunicado" ADD CONSTRAINT "RespostaComunicado_comunicadoId_fkey" FOREIGN KEY ("comunicadoId") REFERENCES "Comunicado"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RespostaComunicado" ADD CONSTRAINT "RespostaComunicado_destinatarioId_fkey" FOREIGN KEY ("destinatarioId") REFERENCES "DestinatarioComunicado"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RespostaComunicado" ADD CONSTRAINT "RespostaComunicado_alunoId_fkey" FOREIGN KEY ("alunoId") REFERENCES "Aluno"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RespostaComunicado" ADD CONSTRAINT "RespostaComunicado_responsavelId_fkey" FOREIGN KEY ("responsavelId") REFERENCES "Responsavel"("id") ON DELETE SET NULL ON UPDATE CASCADE;
