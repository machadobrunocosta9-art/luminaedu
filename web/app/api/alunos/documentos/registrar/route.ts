import { getAuthContext, resolveAuthSchoolId } from "@/lib/auth";
import { hasPermission } from "@/lib/security/permissions";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

type RequestBody = {
  alunoId?: string;
  titulo?: string;
  nomeArquivoOriginal?: string;
  urlArquivo?: string;
  chaveArmazenamento?: string;
  mimeType?: string;
  tamanhoBytes?: number;
};

const MIME_TYPES_PERMITIDOS = ["application/pdf", "image/jpeg", "image/png"];
const TAMANHO_MAXIMO = 10 * 1024 * 1024;

export async function POST(request: Request) {
  try {
    const auth = await getAuthContext();

    if (!auth || !hasPermission(auth.papel, "GERENCIAR_ALUNOS")) {
      return NextResponse.json({ error: "Não autorizado." }, { status: 401 });
    }

    const body = (await request.json()) as RequestBody;

    const alunoId = body.alunoId?.trim() ?? "";
    const titulo = body.titulo?.trim() ?? "";
    const nomeArquivoOriginal = body.nomeArquivoOriginal?.trim() ?? "";
    const urlArquivo = body.urlArquivo?.trim() ?? "";
    const chaveArmazenamento = body.chaveArmazenamento?.trim() ?? "";
    const mimeType = body.mimeType?.trim() ?? "";
    const tamanhoBytes =
      typeof body.tamanhoBytes === "number" ? body.tamanhoBytes : 0;

    if (
      !alunoId ||
      !titulo ||
      !nomeArquivoOriginal ||
      !urlArquivo ||
      !chaveArmazenamento ||
      !mimeType ||
      !MIME_TYPES_PERMITIDOS.includes(mimeType) ||
      tamanhoBytes <= 0 ||
      tamanhoBytes > TAMANHO_MAXIMO
    ) {
      return NextResponse.json(
        { error: "Os dados do documento estão incompletos." },
        { status: 400 },
      );
    }

    const escolaId = await resolveAuthSchoolId(auth);

    const aluno = await prisma.aluno.findFirst({
      where: { id: alunoId, escolaId },
      select: { id: true, escolaId: true },
    });

    if (!aluno) {
      return NextResponse.json(
        { error: "Aluno não encontrado." },
        { status: 404 },
      );
    }

    const prefixoEsperado = `alunos/${aluno.id}/documentos/`;

    if (!chaveArmazenamento.startsWith(prefixoEsperado)) {
      return NextResponse.json(
        { error: "O arquivo informado não pertence a este aluno." },
        { status: 400 },
      );
    }

    let urlValidada: URL;

    try {
      urlValidada = new URL(urlArquivo);
    } catch {
      return NextResponse.json(
        { error: "O endereço do arquivo é inválido." },
        { status: 400 },
      );
    }

    if (
      urlValidada.protocol !== "https:" ||
      !urlValidada.hostname.endsWith(".blob.vercel-storage.com")
    ) {
      return NextResponse.json(
        { error: "O arquivo informado não é confiável." },
        { status: 400 },
      );
    }

    const documento = await prisma.documentoAluno.create({
      data: {
        titulo,
        nomeArquivoOriginal,
        urlArquivo,
        chaveArmazenamento,
        mimeType,
        tamanhoBytes,
        escolaId: aluno.escolaId,
        alunoId: aluno.id,
      },
    });

    return NextResponse.json({ documento });
  } catch (error) {
    console.error("Erro ao registrar documento do aluno:", error);

    return NextResponse.json(
      { error: "Não foi possível registrar o documento." },
      { status: 500 },
    );
  }
}
