import { getAuthContext, resolveAuthSchoolId } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export type Notificacao = {
  id: string;
  titulo: string;
  descricao: string;
  href: string;
};

export async function GET() {
  const auth = await getAuthContext();

  if (!auth) {
    return NextResponse.json({ error: "Não autorizado." }, { status: 401 });
  }

  const escolaId = await resolveAuthSchoolId(auth);
  const trintaDiasAtras = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

  const [
    mensagensAbertas,
    comunicadosPendentes,
    documentosPendentes,
    matriculasPendentes,
    tarefasAtrasadas,
  ] = await Promise.all([
    prisma.mensagemFamilia.count({
      where: { escolaId, status: "ABERTA" },
    }),
    prisma.destinatarioComunicado.count({
      where: {
        escolaId,
        status: { not: "RESPONDIDO" },
        comunicado: { status: "ENVIADO", criadoEm: { gte: trintaDiasAtras } },
      },
    }),
    prisma.documentoMatricula.count({
      where: { escolaId, status: { in: ["ENVIADO", "EM_ANALISE"] } },
    }),
    prisma.matricula.count({
      where: {
        escolaId,
        status: {
          in: ["PENDENTE", "EM_ANALISE", "AGUARDANDO_DOCUMENTOS", "AGUARDANDO_PAGAMENTO"],
        },
      },
    }),
    prisma.tarefa.count({
      where: {
        escolaId,
        status: { not: "CONCLUIDA" },
        prazo: { lt: new Date() },
      },
    }),
  ]);

  const notificacoes: Notificacao[] = [];

  if (mensagensAbertas > 0) {
    notificacoes.push({
      id: "mensagens",
      titulo: `${mensagensAbertas} mensagem(ns) de famílias`,
      descricao: "Aguardando sua resposta",
      href: "/mensagens",
    });
  }

  if (documentosPendentes > 0) {
    notificacoes.push({
      id: "documentos",
      titulo: `${documentosPendentes} documento(s) para conferir`,
      descricao: "Enviados pelas famílias",
      href: "/documentos/matriculas",
    });
  }

  if (matriculasPendentes > 0) {
    notificacoes.push({
      id: "matriculas",
      titulo: `${matriculasPendentes} matrícula(s) em andamento`,
      descricao: "Precisam de acompanhamento",
      href: "/matriculas",
    });
  }

  if (comunicadosPendentes > 0) {
    notificacoes.push({
      id: "comunicados",
      titulo: `${comunicadosPendentes} comunicado(s) sem resposta`,
      descricao: "Famílias ainda não responderam",
      href: "/comunicacao",
    });
  }

  if (tarefasAtrasadas > 0) {
    notificacoes.push({
      id: "tarefas",
      titulo: `${tarefasAtrasadas} tarefa(s) atrasada(s)`,
      descricao: "Prazo já venceu",
      href: "/pulse",
    });
  }

  return NextResponse.json({ notificacoes });
}
