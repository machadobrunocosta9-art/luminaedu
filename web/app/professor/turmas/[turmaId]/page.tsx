import Link from "next/link";
import {
  ChevronLeft,
  ClipboardList,
  FileText,
  MessageSquare,
  NotebookPen,
} from "lucide-react";
import { notFound } from "next/navigation";
import { requireProfessor } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export default async function ProfessorTurmaPage({
  params,
}: {
  params: Promise<{ turmaId: string }>;
}) {
  const auth = await requireProfessor();
  const { turmaId } = await params;

  const atribuicoes = await prisma.atribuicaoProfessor.findMany({
    where: {
      escolaId: auth.escolaId,
      usuarioId: auth.usuarioId,
      turmaId,
    },
    include: { turma: true, disciplina: true },
  });

  if (atribuicoes.length === 0) {
    notFound();
  }

  const turma = atribuicoes[0].turma;

  const alunos = await prisma.aluno.findMany({
    where: { escolaId: auth.escolaId, turmaId },
    select: { id: true, nome: true, fotoUrl: true },
    orderBy: { nome: "asc" },
  });

  const acoes = [
    {
      href: `/professor/turmas/${turmaId}/notas`,
      label: "Lançar notas",
      description: "Notas por disciplina e bimestre",
      icon: NotebookPen,
    },
    {
      href: `/professor/turmas/${turmaId}/atividades`,
      label: "Atividades",
      description: "Trabalhos e atividades para a turma",
      icon: ClipboardList,
    },
    {
      href: `/professor/turmas/${turmaId}/boletins`,
      label: "Boletins",
      description: "Consultar e imprimir por aluno",
      icon: FileText,
    },
    {
      href: `/professor/turmas/${turmaId}/bilhete`,
      label: "Enviar bilhete",
      description: "Aviso rápido para as famílias",
      icon: MessageSquare,
    },
  ];

  return (
    <main className="mx-auto w-full max-w-md space-y-6 px-4 pt-4 sm:px-6">
      <Link
        href="/professor"
        className="inline-flex items-center gap-1 text-[15px] font-medium text-primary"
      >
        <ChevronLeft size={18} />
        Turmas
      </Link>

      <header>
        <h1 className="text-[26px] font-semibold tracking-tight text-foreground">
          {turma.nome}
        </h1>
        <p className="mt-1 text-[14px] text-[#8e8e93]">
          {turma.segmento} ·{" "}
          {atribuicoes.map((atribuicao) => atribuicao.disciplina.nome).join(", ")}
        </p>
      </header>

      <section className="grid gap-3">
        {acoes.map((acao) => {
          const Icon = acao.icon;

          return (
            <Link
              key={acao.href}
              href={acao.href}
              className="flex items-center gap-3.5 rounded-[22px] bg-white p-4 shadow-[0_1px_2px_rgba(0,0,0,0.04),0_1px_8px_rgba(0,0,0,0.04)] transition active:scale-[0.98] active:bg-black/[0.02]"
            >
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
                <Icon size={20} />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-[15px] font-semibold text-foreground">
                  {acao.label}
                </p>
                <p className="mt-0.5 text-[12px] text-[#8e8e93]">
                  {acao.description}
                </p>
              </div>
            </Link>
          );
        })}
      </section>

      <section className="space-y-3">
        <h2 className="text-[13px] font-semibold uppercase tracking-wide text-[#8e8e93]">
          Alunos ({alunos.length})
        </h2>

        <div className="overflow-hidden rounded-[22px] bg-white shadow-[0_1px_2px_rgba(0,0,0,0.04),0_1px_8px_rgba(0,0,0,0.04)]">
          {alunos.length === 0 ? (
            <p className="p-5 text-sm text-[#8e8e93]">
              Nenhum aluno nesta turma ainda.
            </p>
          ) : (
            alunos.map((aluno, index) => (
              <div
                key={aluno.id}
                className={`flex items-center gap-3 px-4 py-3 ${
                  index > 0 ? "border-t border-black/5" : ""
                }`}
              >
                {aluno.fotoUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={aluno.fotoUrl}
                    alt={aluno.nome}
                    className="h-9 w-9 rounded-full object-cover"
                  />
                ) : (
                  <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary">
                    {aluno.nome.slice(0, 1).toUpperCase()}
                  </div>
                )}
                <span className="text-[14px] text-foreground">{aluno.nome}</span>
              </div>
            ))
          )}
        </div>
      </section>
    </main>
  );
}
