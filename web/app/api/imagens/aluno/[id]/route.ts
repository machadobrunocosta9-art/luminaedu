import { getAuthContext, resolveAuthSchoolId } from "@/lib/auth";
import { hasPermission } from "@/lib/security/permissions";
import { prisma } from "@/lib/prisma";
import { responderImagemPrivada } from "@/lib/imagens";

export const dynamic = "force-dynamic";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const auth = await getAuthContext();

  if (!auth) {
    return new Response("Não autorizado.", { status: 401 });
  }

  const { id } = await params;
  const escolaId = await resolveAuthSchoolId(auth);

  const aluno = await prisma.aluno.findFirst({
    where: { id, escolaId },
    select: { fotoChave: true, responsavelId: true, turmaId: true },
  });

  if (!aluno) {
    return new Response("Aluno não encontrado.", { status: 404 });
  }

  const podeVer = await (async () => {
    if (hasPermission(auth.papel, "GERENCIAR_ALUNOS")) {
      return true;
    }

    if (auth.papel === "RESPONSAVEL") {
      return Boolean(
        auth.responsavelId && auth.responsavelId === aluno.responsavelId,
      );
    }

    if (auth.papel === "PROFESSOR" && auth.usuarioId && aluno.turmaId) {
      const atribuicao = await prisma.atribuicaoProfessor.findFirst({
        where: {
          escolaId,
          usuarioId: auth.usuarioId,
          turmaId: aluno.turmaId,
        },
        select: { id: true },
      });

      return Boolean(atribuicao);
    }

    return false;
  })();

  if (!podeVer) {
    return new Response("Acesso negado.", { status: 403 });
  }

  return responderImagemPrivada(aluno.fotoChave);
}
