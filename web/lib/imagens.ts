import "server-only";

import { get } from "@vercel/blob";

/**
 * Le uma imagem privada do blob e devolve como resposta HTTP.
 * As imagens ficam em um store privado, entao nunca sao acessadas
 * diretamente pela URL do blob: sempre passam por uma rota que valida
 * quem esta pedindo.
 */
export async function responderImagemPrivada(chave: string | null | undefined) {
  if (!chave) {
    return new Response("Imagem não encontrada.", { status: 404 });
  }

  try {
    const resultado = await get(chave, { access: "private" });

    if (!resultado) {
      return new Response("Imagem não encontrada.", { status: 404 });
    }

    if (resultado.statusCode !== 200) {
      return new Response(null, { status: 304 });
    }

    return new Response(resultado.stream, {
      headers: {
        "Content-Type": resultado.blob.contentType || "image/jpeg",
        "Cache-Control": "private, max-age=300",
        "X-Content-Type-Options": "nosniff",
      },
    });
  } catch (error) {
    console.error("Erro ao abrir imagem:", error);
    return new Response("Não foi possível abrir a imagem.", { status: 502 });
  }
}
