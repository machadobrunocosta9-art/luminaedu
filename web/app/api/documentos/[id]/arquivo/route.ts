import { isAdminAuthenticated } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { get } from "@vercel/blob";

export const dynamic = "force-dynamic";

type RouteProps = {
  params: Promise<{
    id: string;
  }>;
};

function nomeSeguro(nome: string) {
  return nome.replace(/[\r\n"]/g, "_");
}

export async function GET(
  _request: Request,
  { params }: RouteProps,
) {
  if (!(await isAdminAuthenticated())) {
    return new Response("Não autorizado.", { status: 401 });
  }

  const { id } = await params;

  const documento =
    await prisma.documentoMatricula.findUnique({
      where: { id },
      select: {
        chaveArmazenamento: true,
        nomeArquivoOriginal: true,
        mimeType: true,
      },
    });

  if (!documento?.chaveArmazenamento) {
    return new Response("Documento não encontrado.", {
      status: 404,
    });
  }

  try {
    const resultado = await get(
      documento.chaveArmazenamento,
      {
        access: "private",
      },
    );

    if (!resultado) {
      return new Response("Arquivo não encontrado.", {
        status: 404,
      });
    }

    if (resultado.statusCode !== 200) {
      return new Response(null, { status: 304 });
    }

    const nome = nomeSeguro(
      documento.nomeArquivoOriginal ?? "documento",
    );

    return new Response(resultado.stream, {
      headers: {
        "Content-Type":
          documento.mimeType ||
          resultado.blob.contentType ||
          "application/octet-stream",
        "Content-Disposition": `inline; filename="${nome}"`,
        "Cache-Control": "private, no-store",
        "X-Content-Type-Options": "nosniff",
      },
    });
  } catch (error) {
    console.error("Erro ao abrir documento:", error);

    return new Response(
      "Não foi possível abrir o documento.",
      { status: 502 },
    );
  }
}
