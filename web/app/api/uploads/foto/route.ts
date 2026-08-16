import { getAuthContext, resolveAuthSchoolId } from "@/lib/auth";
import { hasPermission } from "@/lib/security/permissions";
import { prisma } from "@/lib/prisma";
import { put } from "@vercel/blob";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

const TIPOS_PERMITIDOS = ["image/jpeg", "image/png", "image/webp"];
const TAMANHO_MAXIMO = 4 * 1024 * 1024;

function limparNomeArquivo(nome: string) {
  return nome
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .replace(/[^a-zA-Z0-9._-]/g, "-")
    .replace(/-+/g, "-")
    .toLowerCase();
}

export async function POST(request: Request) {
  try {
    const auth = await getAuthContext();

    if (!auth) {
      return NextResponse.json({ error: "Não autorizado." }, { status: 401 });
    }

    const escolaId = await resolveAuthSchoolId(auth);

    const formData = await request.formData();
    const file = formData.get("file");
    const kind = String(formData.get("kind") || "");
    const targetId = String(formData.get("targetId") || "");

    if (!(file instanceof File)) {
      return NextResponse.json(
        { error: "Nenhum arquivo enviado." },
        { status: 400 },
      );
    }

    if (!TIPOS_PERMITIDOS.includes(file.type)) {
      return NextResponse.json(
        { error: "Envie uma imagem JPG, PNG ou WEBP." },
        { status: 400 },
      );
    }

    if (file.size > TAMANHO_MAXIMO) {
      return NextResponse.json(
        { error: "A imagem deve ter no máximo 4 MB." },
        { status: 400 },
      );
    }

    let pathname: string;

    if (kind === "foto-aluno") {
      if (!hasPermission(auth.papel, "GERENCIAR_ALUNOS")) {
        return NextResponse.json(
          { error: "Sem permissão para alterar a foto do aluno." },
          { status: 403 },
        );
      }

      const aluno = await prisma.aluno.findFirst({
        where: { id: targetId, escolaId },
        select: { id: true },
      });

      if (!aluno) {
        return NextResponse.json(
          { error: "Aluno não encontrado." },
          { status: 404 },
        );
      }

      pathname = `alunos/${aluno.id}/foto/${Date.now()}-${limparNomeArquivo(file.name)}`;
    } else if (kind === "logo-escola") {
      if (!hasPermission(auth.papel, "ADMINISTRAR_SISTEMA")) {
        return NextResponse.json(
          { error: "Sem permissão para alterar o logo da escola." },
          { status: 403 },
        );
      }

      pathname = `escola/${escolaId}/logo/${Date.now()}-${limparNomeArquivo(file.name)}`;
    } else if (kind === "foto-usuario") {
      if (auth.kind !== "user" || !auth.usuarioId) {
        return NextResponse.json(
          { error: "Sua conta não permite foto de perfil." },
          { status: 403 },
        );
      }

      pathname = `usuarios/${auth.usuarioId}/foto/${Date.now()}-${limparNomeArquivo(file.name)}`;
    } else {
      return NextResponse.json(
        { error: "Tipo de upload inválido." },
        { status: 400 },
      );
    }

    // O store de blobs desta conta e privado: as imagens sao gravadas com
    // acesso privado e servidas pelas rotas em /api/imagens, que validam
    // quem pode ver cada uma.
    const blob = await put(pathname, file, {
      access: "private",
      addRandomSuffix: true,
      contentType: file.type,
    });

    const versao = Date.now();
    let urlPublica: string;

    if (kind === "foto-aluno") {
      urlPublica = `/api/imagens/aluno/${targetId}?v=${versao}`;

      await prisma.aluno.updateMany({
        where: { id: targetId, escolaId },
        data: { fotoUrl: urlPublica, fotoChave: blob.pathname },
      });
    } else if (kind === "logo-escola") {
      urlPublica = `/api/imagens/escola?v=${versao}`;

      await prisma.escola.update({
        where: { id: escolaId },
        data: { logoUrl: urlPublica, logoChave: blob.pathname },
      });
    } else if (kind === "foto-usuario" && auth.usuarioId) {
      urlPublica = `/api/imagens/usuario/${auth.usuarioId}?v=${versao}`;

      await prisma.usuario.update({
        where: { id: auth.usuarioId },
        data: { fotoUrl: urlPublica, fotoChave: blob.pathname },
      });
    } else {
      return NextResponse.json(
        { error: "Tipo de upload inválido." },
        { status: 400 },
      );
    }

    return NextResponse.json({ url: urlPublica });
  } catch (error) {
    console.error("Erro ao enviar imagem:", error);

    const message =
      error instanceof Error ? error.message : "Não foi possível enviar a imagem.";

    return NextResponse.json({ error: message }, { status: 500 });
  }
}
