import { getAuthContext, resolveAuthSchoolId } from "@/lib/auth";
import { hasPermission } from "@/lib/security/permissions";
import { prisma } from "@/lib/prisma";
import { handleUpload, type HandleUploadBody } from "@vercel/blob/client";
import { NextResponse } from "next/server";

type ClientPayload = {
  alunoId: string;
};

const TIPOS_PERMITIDOS = ["application/pdf", "image/jpeg", "image/png"];

export async function POST(request: Request): Promise<NextResponse> {
  const body = (await request.json()) as HandleUploadBody;

  try {
    const jsonResponse = await handleUpload({
      body,
      request,

      onBeforeGenerateToken: async (pathname, clientPayloadRaw) => {
        const auth = await getAuthContext();

        if (!auth || !hasPermission(auth.papel, "GERENCIAR_ALUNOS")) {
          throw new Error("Sem permissão para anexar documentos.");
        }

        if (!clientPayloadRaw) {
          throw new Error("Dados do upload não foram informados.");
        }

        let payload: ClientPayload;

        try {
          payload = JSON.parse(clientPayloadRaw) as ClientPayload;
        } catch {
          throw new Error("Dados do upload são inválidos.");
        }

        if (!payload.alunoId) {
          throw new Error("Aluno inválido.");
        }

        const escolaId = await resolveAuthSchoolId(auth);

        const aluno = await prisma.aluno.findFirst({
          where: { id: payload.alunoId, escolaId },
          select: { id: true },
        });

        if (!aluno) {
          throw new Error("Aluno não encontrado.");
        }

        const prefixoEsperado = `alunos/${aluno.id}/documentos/`;

        if (!pathname.startsWith(prefixoEsperado)) {
          throw new Error("Caminho do arquivo inválido.");
        }

        return {
          allowedContentTypes: TIPOS_PERMITIDOS,
          addRandomSuffix: true,
          tokenPayload: JSON.stringify({ alunoId: aluno.id }),
        };
      },

      onUploadCompleted: async () => {
        // Os metadados são registrados pela aplicação logo após o upload.
      },
    });

    return NextResponse.json(jsonResponse);
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "Não foi possível autorizar o upload.";

    return NextResponse.json({ error: message }, { status: 400 });
  }
}
