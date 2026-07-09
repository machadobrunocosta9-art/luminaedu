import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const dataLimite = new Date();
    dataLimite.setDate(dataLimite.getDate() - 90);

    const [
      tarefasAbertas,
      tarefasPrioritarias,
      matriculasPendentes,
      comunicadosPendentes,
      comunicadosVisualizados,
      pendenciasFinanceiras,
      pendenciasDocumentais,
      ocorrenciasRecentes,
      totalAlunos,
    ] = await Promise.all([
      prisma.tarefa.count({
        where: {
          status: {
            not: "CONCLUIDA",
          },
        },
      }),

      prisma.tarefa.count({
        where: {
          status: {
            not: "CONCLUIDA",
          },
          prioridade: {
            in: ["ALTA", "CRITICA"],
          },
        },
      }),

      prisma.matricula.count({
        where: {
          status: {
            in: [
              "PENDENTE",
              "EM_ANALISE",
              "AGUARDANDO_DOCUMENTOS",
              "AGUARDANDO_PAGAMENTO",
            ],
          },
        },
      }),

      prisma.destinatarioComunicado.count({
        where: {
          status: {
            in: ["PENDENTE", "ENVIADO", "VISUALIZADO"],
          },
        },
      }),

      prisma.destinatarioComunicado.count({
        where: {
          status: "VISUALIZADO",
        },
      }),

      prisma.tarefa.count({
        where: {
          setor: "Financeiro",
          status: {
            not: "CONCLUIDA",
          },
        },
      }),

      prisma.tarefa.count({
        where: {
          setor: "Documentos",
          status: {
            not: "CONCLUIDA",
          },
        },
      }),

      prisma.ocorrenciaAluno.count({
        where: {
          criadoEm: {
            gte: dataLimite,
          },
          tipo: {
            in: ["ADVERTENCIA", "SUSPENSAO"],
          },
        },
      }),

      prisma.aluno.count(),
    ]);

    return NextResponse.json({
      tarefasAbertas,
      tarefasPrioritarias,
      matriculasPendentes,
      comunicadosPendentes,
      comunicadosVisualizados,
      pendenciasFinanceiras,
      pendenciasDocumentais,
      ocorrenciasRecentes,
      totalAlunos,
    });
  } catch (error) {
    console.error("Erro ao carregar resumo da Lumi:", error);

    return NextResponse.json(
      {
        error: "Não foi possível carregar o resumo da Lumi.",
      },
      {
        status: 500,
      },
    );
  }
}