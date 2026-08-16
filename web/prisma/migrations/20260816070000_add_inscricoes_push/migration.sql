-- CreateTable
CREATE TABLE IF NOT EXISTS "InscricaoPush" (
    "id" TEXT NOT NULL,
    "endpoint" TEXT NOT NULL,
    "p256dh" TEXT NOT NULL,
    "auth" TEXT NOT NULL,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "ultimoUsoEm" TIMESTAMP(3),
    "escolaId" TEXT NOT NULL,
    "usuarioId" TEXT NOT NULL,

    CONSTRAINT "InscricaoPush_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "InscricaoPush_endpoint_key" ON "InscricaoPush"("endpoint");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "InscricaoPush_escolaId_idx" ON "InscricaoPush"("escolaId");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "InscricaoPush_usuarioId_idx" ON "InscricaoPush"("usuarioId");

-- AddForeignKey
ALTER TABLE "InscricaoPush" ADD CONSTRAINT "InscricaoPush_escolaId_fkey" FOREIGN KEY ("escolaId") REFERENCES "Escola"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InscricaoPush" ADD CONSTRAINT "InscricaoPush_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "Usuario"("id") ON DELETE CASCADE ON UPDATE CASCADE;
