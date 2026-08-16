-- AlterTable
ALTER TABLE "Escola" ADD COLUMN IF NOT EXISTS "logoChave" TEXT;

-- AlterTable
ALTER TABLE "Aluno" ADD COLUMN IF NOT EXISTS "fotoChave" TEXT;

-- AlterTable
ALTER TABLE "Usuario" ADD COLUMN IF NOT EXISTS "fotoChave" TEXT;
