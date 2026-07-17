import { prisma } from "@/lib/prisma";
import {
  handleUpload,
  type HandleUploadBody,
} from "@vercel/blob/client";
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

type ClientPayload = {
  conviteToken: string;
  tipoDocumento: TipoDocumentoPermitido;
};

function isTipoPermitido(
  tipo: string,
): tipo is TipoDocumentoPermitido {
  return tiposPermitidos.includes(
    tipo as TipoDocumentoPermitido,
  );
}

export async function POST(
  request: Request,
): Promise<NextResponse> {
  const body =
    (await request.json()) as HandleUploadBody;

  try {
    const jsonResponse = await handleUpload({
      body,
      request,

      onBeforeGenerateToken: async (
        pathname,
        clientPayload,
      ) => {
        if (!clientPayload) {
          throw new Error(
            "Dados do convite não foram informados.",
          );
        }

        let payload: ClientPayload;

        try {
          payload = JSON.parse(
            clientPayload,
          ) as ClientPayload;
        } catch {
          throw new Error(
            "Dados do upload são inválidos.",
          );
        }

        if (
          !payload.conviteToken ||
          !payload.tipoDocumento ||
          !isTipoPermitido(payload.tipoDocumento)
        ) {
          throw new Error(
            "Tipo de documento ou convite inválido.",
          );
        }

        const convite =
          await prisma.conviteMatricula.findUnique({
            where: {
              token: payload.conviteToken,
            },
            select: {
              id: true,
              status: true,
              expiraEm: true,
              matriculaId: true,
            },
          });

        if (!convite) {
          throw new Error(
            "Convite de matrícula não encontrado.",
          );
        }

        if (
          convite.status === "CANCELADO" ||
          convite.status === "EXPIRADO"
        ) {
          throw new Error(
            "Este convite não permite novos envios.",
          );
        }

        if (
          convite.status !== "CONCLUIDO" ||
          !convite.matriculaId
        ) {
          throw new Error(
            "Conclua primeiro os dados da matrícula.",
          );
        }

        const prefixoEsperado =
          `matriculas/${convite.id}/${payload.tipoDocumento}/`;

        if (!pathname.startsWith(prefixoEsperado)) {
          throw new Error(
            "Caminho do documento inválido.",
          );
        }

        return {
          allowedContentTypes: [
            "application/pdf",
            "image/jpeg",
            "image/png",
          ],
          addRandomSuffix: true,
          tokenPayload: JSON.stringify({
            conviteId: convite.id,
            matriculaId: convite.matriculaId,
            tipoDocumento:
              payload.tipoDocumento,
          }),
        };
      },

      onUploadCompleted: async () => {
        // Os metadados são registrados pela aplicação
        // imediatamente após o retorno do upload.
      },
    });

    return NextResponse.json(jsonResponse);
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "Não foi possível autorizar o upload.";

    return NextResponse.json(
      {
        error: message,
      },
      {
        status: 400,
      },
    );
  }
}