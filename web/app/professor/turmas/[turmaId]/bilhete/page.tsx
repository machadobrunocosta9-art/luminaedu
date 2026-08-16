import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { notFound, redirect } from "next/navigation";
import { randomUUID } from "crypto";
import { requireProfessor } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { enviarEmailsComunicado } from "@/lib/comunicados";

export const dynamic = "force-dynamic";

export default async function ProfessorBilhetePage({
  params,
}: {
  params: Promise<{ turmaId: string }>;
}) {
  const auth = await requireProfessor();
  const { turmaId } = await params;

  const atribuicao = await prisma.atribuicaoProfessor.findFirst({
    where: { escolaId: auth.escolaId, usuarioId: auth.usuarioId, turmaId },
    include: { turma: true },
  });

  if (!atribuicao) {
    notFound();
  }

  const turma = atribuicao.turma;

  async function enviarBilhete(formData: FormData) {
    "use server";

    const authAction = await requireProfessor();

    const atribuicaoValida = await prisma.atribuicaoProfessor.findFirst({
      where: { escolaId: authAction.escolaId, usuarioId: authAction.usuarioId, turmaId },
    });

    if (!atribuicaoValida) {
      throw new Error("Você não tem permissão para enviar bilhetes nesta turma.");
    }

    const titulo = String(formData.get("titulo") || "").trim();
    const conteudo = String(formData.get("conteudo") || "").trim();

    if (!titulo || !conteudo) {
      throw new Error("Preencha o título e a mensagem.");
    }

    const comunicado = await prisma.comunicado.create({
      data: {
        tipo: "SIMPLES",
        status: "ENVIADO",
        titulo,
        conteudo,
        publicoAlvo: "TURMA",
        escolaId: authAction.escolaId,
        turmaId,
        enviadoEm: new Date(),
      },
    });

    const alunosDaTurma = await prisma.aluno.findMany({
      where: { escolaId: authAction.escolaId, turmaId },
      include: { responsavel: true },
    });

    const alunosComResponsavel = alunosDaTurma.filter(
      (aluno) => aluno.responsavel,
    );

    if (alunosComResponsavel.length > 0) {
      await prisma.destinatarioComunicado.createMany({
        data: alunosComResponsavel.map((aluno) => ({
          status: "ENVIADO",
          nomeResponsavel: aluno.responsavel.nome,
          email: aluno.responsavel.email,
          telefone: aluno.responsavel.telefone,
          tokenResposta: randomUUID(),
          enviadoEm: new Date(),
          escolaId: authAction.escolaId,
          comunicadoId: comunicado.id,
          alunoId: aluno.id,
          responsavelId: aluno.responsavelId,
        })),
      });
    }

    await enviarEmailsComunicado({
      comunicadoId: comunicado.id,
      criadoPorUsuarioId: authAction.usuarioId,
    });

    redirect(`/professor/turmas/${turmaId}?bilheteEnviado=1`);
  }

  return (
    <main className="mx-auto w-full max-w-md space-y-6 px-4 pt-4 sm:px-6">
      <Link
        href={`/professor/turmas/${turmaId}`}
        className="inline-flex items-center gap-1 text-[15px] font-medium text-primary"
      >
        <ChevronLeft size={18} />
        {turma.nome}
      </Link>

      <header>
        <h1 className="text-[24px] font-semibold tracking-tight text-foreground">
          Enviar bilhete
        </h1>
        <p className="mt-1 text-[13px] text-[#8e8e93]">
          Vai por e-mail e no Portal da Família de todos os alunos de{" "}
          {turma.nome}.
        </p>
      </header>

      <form
        action={enviarBilhete}
        className="space-y-4 rounded-[22px] bg-white p-5 shadow-[0_1px_2px_rgba(0,0,0,0.04),0_1px_8px_rgba(0,0,0,0.04)]"
      >
        <div>
          <label className="mb-2 block text-[13px] font-medium text-[#8e8e93]">
            Título
          </label>
          <input
            name="titulo"
            required
            placeholder="Ex: Lembrete sobre a prova de amanhã"
            className="h-12 w-full rounded-xl bg-[#f5f5f7] px-4 text-[15px] outline-none placeholder:text-[#c7c7cc]"
          />
        </div>

        <div>
          <label className="mb-2 block text-[13px] font-medium text-[#8e8e93]">
            Mensagem
          </label>
          <textarea
            name="conteudo"
            required
            rows={5}
            className="w-full resize-none rounded-xl bg-[#f5f5f7] px-4 py-3 text-[15px] outline-none"
          />
        </div>

        <button
          type="submit"
          className="w-full rounded-xl bg-primary px-5 py-3.5 text-[15px] font-semibold text-primary-foreground transition active:opacity-80"
        >
          Enviar para a turma
        </button>
      </form>
    </main>
  );
}
