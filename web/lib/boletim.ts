import "server-only";

import { prisma } from "@/lib/prisma";

export type LinhaBoletim = {
  disciplinaId: string;
  disciplinaNome: string;
  notas: Array<number | null>;
  media: number | null;
};

export async function getBoletimAluno(input: {
  escolaId: string;
  alunoId: string;
  anoLetivo: number;
}): Promise<LinhaBoletim[]> {
  const notas = await prisma.nota.findMany({
    where: {
      escolaId: input.escolaId,
      alunoId: input.alunoId,
      anoLetivo: input.anoLetivo,
    },
    include: { disciplina: true },
  });

  const disciplinas = await prisma.disciplina.findMany({
    where: { escolaId: input.escolaId },
    orderBy: { nome: "asc" },
  });

  return disciplinas.map((disciplina) => {
    const notasDisciplina = notas.filter(
      (nota) => nota.disciplinaId === disciplina.id,
    );

    const notasPorBimestre: Array<number | null> = [1, 2, 3, 4].map(
      (bimestre) => {
        const nota = notasDisciplina.find((item) => item.bimestre === bimestre);
        return nota ? Number(nota.valor) : null;
      },
    );

    const notasPreenchidas = notasPorBimestre.filter(
      (valor): valor is number => valor !== null,
    );

    const media =
      notasPreenchidas.length > 0
        ? notasPreenchidas.reduce((soma, valor) => soma + valor, 0) /
          notasPreenchidas.length
        : null;

    return {
      disciplinaId: disciplina.id,
      disciplinaNome: disciplina.nome,
      notas: notasPorBimestre,
      media,
    };
  });
}
