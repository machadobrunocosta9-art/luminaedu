import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

const tiposPermitidos = [
  "CERTIDAO_NASCIMENTO",
  "RG_ALUNO",
  "CPF_ALUNO",
  "RG_RESPONSAVEL",
  "CPF_RESPONSAVEL",
  "COMPROVANTE_RESIDENCIA",
  "CARTEIRA_VACINACAO",
  "FOTO_ALUNO",
  "LAUDO_MEDICO",
  "CONTRATO_ASSINADO",
  "COMPROVANTE_PAGAMENTO",
  "OUTRO",
] as const;

type TipoDocumentoPermitido =
  (typeof tiposPermitidos)[number];

type RequestBody = {
  conviteToken?: string;
  tipoDocumento?: string;
  titulo?: string;
  nomeArquivoOriginal?: string;
  urlArquivo?: string;
  chaveArmazenamento?: string;
  mimeType?: string;
  tamanhoBytes?: number;
};

const MIME_TYPES_PERMITIDOS = [
  "application/pdf",
  "image/jpeg",
  "image/png",
] as const;

const TAMANHO_MAXIMO = 10 * 1024 * 1024;

const TIPOS_OBRIGATORIOS = new Set<TipoDocumentoPermitido>([
  "CERTIDAO_NASCIMENTO",
  "CPF_RESPONSAVEL",
  "RG_RESPONSAVEL",
  "COMPROVANTE_RESIDENCIA",
  "CARTEIRA_VACINACAO",
  "FOTO_ALUNO",
]);

function isTipoPermitido(
  tipo: string,
): tipo is TipoDocumentoPermitido {
  return tiposPermitidos.includes(
    tipo as TipoDocumentoPermitido,
  );
}

function obterExtensao(nomeArquivo: string) {
  const partes = nomeArquivo.split(".");

  if (partes.length < 2) {
    return null;
  }

  return partes.at(-1)?.toLowerCase() ?? null;
}

export async function POST(request: Request) {
  try {
    const body =
      (await request.json()) as RequestBody;

    const conviteToken =
      body.conviteToken?.trim() ?? "";

    const tipoDocumento =
      body.tipoDocumento?.trim() ?? "";

    const titulo = body.titulo?.trim() ?? "";

    const nomeArquivoOriginal =
      body.nomeArquivoOriginal?.trim() ?? "";

    const urlArquivo =
      body.urlArquivo?.trim() ?? "";

    const chaveArmazenamento =
      body.chaveArmazenamento?.trim() ?? "";

    const mimeType =
      body.mimeType?.trim() ?? "";

    const tamanhoBytes =
      typeof body.tamanhoBytes === "number"
        ? body.tamanhoBytes
        : 0;

    if (
      !conviteToken ||
      !tipoDocumento ||
      !titulo ||
      !nomeArquivoOriginal ||
      !urlArquivo ||
      !chaveArmazenamento ||
      !mimeType ||
      !isTipoPermitido(tipoDocumento) ||
      !MIME_TYPES_PERMITIDOS.includes(
        mimeType as (typeof MIME_TYPES_PERMITIDOS)[number],
      ) ||
      tamanhoBytes <= 0 ||
      tamanhoBytes > TAMANHO_MAXIMO
    ) {
      return NextResponse.json(
        {
          error:
            "Os dados do documento estão incompletos.",
        },
        {
          status: 400,
        },
      );
    }

    const convite =
      await prisma.conviteMatricula.findUnique({
        where: {
          token: conviteToken,
        },
        include: {
          documentos: {
            where: {
              tipo: tipoDocumento,
            },
            orderBy: {
              versao: "desc",
            },
            take: 1,
          },
        },
      });

    if (!convite) {
      return NextResponse.json(
        {
          error:
            "Convite de matrícula não encontrado.",
        },
        {
          status: 404,
        },
      );
    }

    if (
      convite.status !== "CONCLUIDO" ||
      !convite.matriculaId
    ) {
      return NextResponse.json(
        {
          error:
            "A matrícula ainda não está pronta para receber documentos.",
        },
        {
          status: 400,
        },
      );
    }

    const prefixoEsperado =
      `matriculas/${convite.id}/${tipoDocumento}/`;

    if (!chaveArmazenamento.startsWith(prefixoEsperado)) {
      return NextResponse.json(
        { error: "O arquivo informado não pertence a este convite." },
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

    const documentoAnterior =
      convite.documentos[0] ?? null;

    const proximaVersao =
      documentoAnterior
        ? documentoAnterior.versao + 1
        : 1;

    const documento =
      await prisma.documentoMatricula.create({
        data: {
          tipo: tipoDocumento,
          status: "ENVIADO",
          titulo,
          obrigatorio:
            TIPOS_OBRIGATORIOS.has(tipoDocumento),
          ordemExibicao: 0,

          nomeArquivoOriginal,
          nomeArquivoInterno:
            chaveArmazenamento
              .split("/")
              .at(-1) ?? null,
          urlArquivo,
          chaveArmazenamento,
          mimeType,
          extensao:
            obterExtensao(nomeArquivoOriginal),
          tamanhoBytes,
          versao: proximaVersao,

          enviadoEm: new Date(),

          escolaId: convite.escolaId,
          conviteId: convite.id,
          matriculaId:
            convite.matriculaId,
        },
      });

    await prisma.matricula.update({
      where: {
        id: convite.matriculaId,
      },
      data: {
        status: "AGUARDANDO_DOCUMENTOS",
      },
    });

    return NextResponse.json({
      documento,
    });
  } catch (error) {
    console.error(
      "Erro ao registrar documento:",
      error,
    );

    return NextResponse.json(
      {
        error:
          "Não foi possível registrar o documento.",
      },
      {
        status: 500,
      },
    );
  }
}
