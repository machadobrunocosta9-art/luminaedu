import { getAuthContext, resolveAuthSchoolId } from "@/lib/auth";
import { hasPermission } from "@/lib/security/permissions";
import { prisma } from "@/lib/prisma";
import { handleUpload, type HandleUploadBody } from "@vercel/blob/client";
import { NextResponse } from "next/server";

type ClientPayload =
  | { kind: "foto-aluno"; alunoId: string }
  | { kind: "logo-escola"; escolaId: string };

const TIPOS_PERMITIDOS = ["image/jpeg", "image/png", "image/webp"];

export async function POST(request: Request): Promise<NextResponse> {
  const body = (await request.json()) as HandleUploadBody;

  try {
    const jsonResponse = await handleUpload({
      body,
      request,

      onBeforeGenerateToken: async (pathname, clientPayloadRaw) => {
        const auth = await getAuthContext();

        if (!auth) {
          throw new Error("Não autorizado.");
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

        if (payload.kind === "foto-aluno") {
          if (!hasPermission(auth.papel, "GERENCIAR_ALUNOS")) {
            throw new Error("Sem permissão para alterar foto do aluno.");
          }

          const escolaId = await resolveAuthSchoolId(auth);

          const aluno = await prisma.aluno.findFirst({
            where: { id: payload.alunoId, escolaId },
            select: { id: true },
          });

          if (!aluno) {
            throw new Error("Aluno não encontrado.");
          }

          const prefixoEsperado = `alunos/${aluno.id}/foto/`;

          if (!pathname.startsWith(prefixoEsperado)) {
            throw new Error("Caminho do arquivo inválido.");
          }
        } else if (payload.kind === "logo-escola") {
          if (!hasPermission(auth.papel, "ADMINISTRAR_SISTEMA")) {
            throw new Error("Sem permissão para alterar o logo da escola.");
          }

          const escolaId = await resolveAuthSchoolId(auth);

          if (payload.escolaId !== escolaId) {
            throw new Error("Escola inválida.");
          }

          const prefixoEsperado = `escola/${escolaId}/logo/`;

          if (!pathname.startsWith(prefixoEsperado)) {
            throw new Error("Caminho do arquivo inválido.");
          }
        } else {
          throw new Error("Tipo de upload inválido.");
        }

        return {
          allowedContentTypes: TIPOS_PERMITIDOS,
          addRandomSuffix: true,
        };
      },

      onUploadCompleted: async () => {
        // Nada a fazer aqui: a página que iniciou o upload persiste a URL.
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
