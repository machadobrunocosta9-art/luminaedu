-- CreateTable
CREATE TABLE "Aluno" (
    "id" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "turma" TEXT NOT NULL,
    "responsavel" TEXT NOT NULL,
    "telefone" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'Ativo',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Aluno_pkey" PRIMARY KEY ("id")
);
