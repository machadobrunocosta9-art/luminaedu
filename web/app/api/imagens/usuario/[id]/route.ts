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

  const ehProprioUsuario = auth.kind === "user" && auth.usuarioId === id;

  if (!ehProprioUsuario && !hasPermission(auth.papel, "GERENCIAR_USUARIOS")) {
    return new Response("Acesso negado.", { status: 403 });
  }

  const usuario = await prisma.usuario.findFirst({
    where: { id, escolaId },
    select: { fotoChave: true },
  });

  if (!usuario) {
    return new Response("Usuário não encontrado.", { status: 404 });
  }

  return responderImagemPrivada(usuario.fotoChave);
}
