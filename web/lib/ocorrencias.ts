import "server-only";

import { prisma } from "@/lib/prisma";

export type ConfirmarCienciaOcorrenciaInput = {
  ocorrenciaId: string;
  nomeConfirmante: string;
  parentescoConfirmante: string;
  observacaoCiencia?: string | null;
};

export async function confirmarCienciaOcorrencia(
  input: ConfirmarCienciaOcorrenciaInput,
) {
  const ocorrencia = await prisma.ocorrenciaAluno.findUnique({
    where: { id: input.ocorrenciaId },
    select: { id: true, cienciaConfirmada: true },
  });

  if (!ocorrencia) {
    throw new Error("Registro não encontrado.");
  }

  if (ocorrencia.cienciaConfirmada) {
    return { alreadyConfirmed: true as const };
  }

  await prisma.ocorrenciaAluno.update({
    where: { id: ocorrencia.id },
    data: {
      cienciaConfirmada: true,
      dataCiencia: new Date(),
      nomeConfirmante: input.nomeConfirmante,
      parentescoConfirmante: input.parentescoConfirmante,
      observacaoCiencia: input.observacaoCiencia || null,
    },
  });

  return { alreadyConfirmed: false as const };
}
