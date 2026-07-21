import "server-only";

import { prisma } from "@/lib/prisma";

type AuditInput = {
  acao: string;
  resultado: "SUCESSO" | "FALHA" | "NEGADO";
  escolaId: string;
  usuarioId?: string | null;
  entidade?: string;
  entidadeId?: string;
  metadados?: Record<string, string | number | boolean | null>;
};

export async function recordAudit(input: AuditInput) {
  try {
    await prisma.registroAuditoria.create({
      data: {
        acao: input.acao,
        resultado: input.resultado,
        escolaId: input.escolaId,
        usuarioId: input.usuarioId,
        entidade: input.entidade,
        entidadeId: input.entidadeId,
        metadados: input.metadados,
      },
    });
  } catch {
    // Auditoria nunca deve expor dados nem interromper o fluxo principal.
  }
}
