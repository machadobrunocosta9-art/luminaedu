import { get } from "@vercel/blob";
import { getAuthContext } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { hasPermission } from "@/lib/security/permissions";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

function safeFilename(name: string) {
  return name.replace(/[\r\n"]/gu, "_");
}

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const auth = await getAuthContext();

  if (
    !auth ||
    auth.kind !== "user" ||
    auth.papel !== "RESPONSAVEL" ||
    !auth.responsavelId ||
    !hasPermission(auth.papel, "ACESSAR_DOCUMENTOS_FAMILIA")
  ) {
    return new Response("Não autorizado.", { status: 401 });
  }
  const { id } = await params;
  const document = await prisma.documentoMatricula.findFirst({
    where: {
      id,
      escolaId: auth.escolaId,
      matricula: {
        escolaId: auth.escolaId,
        aluno: {
          escolaId: auth.escolaId,
          responsavelId: auth.responsavelId,
        },
      },
    },
    select: {
      chaveArmazenamento: true,
      nomeArquivoOriginal: true,
      mimeType: true,
    },
  });

  if (!document?.chaveArmazenamento) {
    return new Response("Documento não encontrado.", { status: 404 });
  }

  try {
    const result = await get(document.chaveArmazenamento, {
      access: "private",
    });

    if (!result) {
      return new Response("Arquivo não encontrado.", { status: 404 });
    }

    if (result.statusCode !== 200) {
      return new Response(null, { status: 304 });
    }

    return new Response(result.stream, {
      headers: {
        "Content-Type":
          document.mimeType ||
          result.blob.contentType ||
          "application/octet-stream",
        "Content-Disposition": `inline; filename="${safeFilename(document.nomeArquivoOriginal ?? "documento")}"`,
        "Cache-Control": "private, no-store",
        "X-Content-Type-Options": "nosniff",
      },
    });
  } catch {
    return new Response("Não foi possível abrir o documento.", {
      status: 502,
    });
  }
}
