import { getAuthContext, resolveAuthSchoolId } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { responderImagemPrivada } from "@/lib/imagens";

export const dynamic = "force-dynamic";

export async function GET() {
  const auth = await getAuthContext();

  if (!auth) {
    return new Response("Não autorizado.", { status: 401 });
  }

  const escolaId = await resolveAuthSchoolId(auth);

  const escola = await prisma.escola.findUnique({
    where: { id: escolaId },
    select: { logoChave: true },
  });

  return responderImagemPrivada(escola?.logoChave);
}
