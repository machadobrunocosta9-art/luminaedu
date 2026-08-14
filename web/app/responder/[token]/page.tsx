import { prisma } from "@/lib/prisma";
import {
  isTipoRespostaPermitido,
  registrarRespostaComunicado,
} from "@/lib/comunicados";
import { revalidatePath } from "next/cache";
import { notFound, redirect } from "next/navigation";
import { MessageCircle } from "lucide-react";
import ComunicadoRespostaCard from "@/components/comunicacao/ComunicadoRespostaCard";

export const dynamic = "force-dynamic";

async function registrarResposta(formData: FormData) {
  "use server";

  const token = String(formData.get("token") || "");
  const tipoResposta = String(formData.get("tipoResposta") || "");
  const nomeRespondente = String(formData.get("nomeRespondente") || "").trim();
  const parentescoRespondente = String(
    formData.get("parentescoRespondente") || "",
  ).trim();
  const observacao = String(formData.get("observacao") || "").trim();
  const motivoNegativa = String(formData.get("motivoNegativa") || "").trim();

  if (!token) {
    throw new Error("Link de resposta inválido.");
  }

  if (!isTipoRespostaPermitido(tipoResposta)) {
    throw new Error("Tipo de resposta inválido.");
  }

  if (!nomeRespondente || !parentescoRespondente) {
    redirect(`/responder/${token}?erro=dados`);
  }

  if (
    (tipoResposta === "NAO_PARTICIPA" || tipoResposta === "NAO_AUTORIZADO") &&
    !motivoNegativa
  ) {
    redirect(`/responder/${token}?erro=motivo`);
  }

  const destinatario = await prisma.destinatarioComunicado.findUnique({
    where: {
      tokenResposta: token,
    },
    select: { id: true, alunoId: true },
  });

  if (!destinatario) {
    throw new Error("Comunicado não encontrado.");
  }

  const resultado = await registrarRespostaComunicado({
    destinatarioId: destinatario.id,
    tipoResposta,
    nomeRespondente,
    parentescoRespondente,
    observacao: observacao || null,
    motivoNegativa: motivoNegativa || null,
  });

  if (!resultado.alreadyAnswered) {
    revalidatePath("/comunicacao");
    revalidatePath("/dashboard");
    revalidatePath("/relatorios");
    revalidatePath("/portal-familia/comunicados");

    if (destinatario.alunoId) {
      revalidatePath(`/alunos/${destinatario.alunoId}`);
      revalidatePath(`/portal-familia/filhos/${destinatario.alunoId}`);
    }
  }

  redirect(`/responder/${token}?sucesso=1`);
}

type ResponderPageProps = {
  params: Promise<{
    token: string;
  }>;
  searchParams?: Promise<{
    sucesso?: string;
    erro?: string;
  }>;
};

export default async function ResponderComunicadoPage({
  params,
  searchParams,
}: ResponderPageProps) {
  const { token } = await params;
  const query = searchParams ? await searchParams : {};

  const destinatario = await prisma.destinatarioComunicado.findUnique({
    where: {
      tokenResposta: token,
    },
    include: {
      aluno: true,
      responsavel: true,
      respostas: {
        orderBy: {
          dataResposta: "desc",
        },
      },
      comunicado: {
        include: {
          escola: true,
          turma: true,
          aluno: true,
        },
      },
    },
  });

  if (!destinatario) {
    notFound();
  }

  if (
    destinatario.status !== "RESPONDIDO" &&
    !destinatario.visualizadoEm &&
    (destinatario.status === "PENDENTE" || destinatario.status === "ENVIADO")
  ) {
    await prisma.destinatarioComunicado.update({
      where: {
        id: destinatario.id,
      },
      data: {
        status: "VISUALIZADO",
        visualizadoEm: new Date(),
      },
    });
  }

  const comunicado = destinatario.comunicado;
  const respostaExistente = destinatario.respostas[0];

  const jaRespondido =
    destinatario.status === "RESPONDIDO" || Boolean(respostaExistente);

  const erro =
    query.erro === "dados" || query.erro === "motivo" ? query.erro : null;

  return (
    <main className="min-h-screen bg-muted px-4 py-8 text-foreground">
      <div className="mx-auto max-w-3xl">
        <div className="mb-6 text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-3xl bg-primary text-primary-foreground">
            <MessageCircle size={26} />
          </div>

          <p className="text-sm font-medium text-muted-foreground">
            {comunicado.escola.nome}
          </p>

          <h1 className="mt-2 text-3xl font-semibold tracking-tight">
            Comunicação da escola
          </h1>

          <p className="mt-2 text-sm text-muted-foreground">
            Responda este comunicado de forma simples e segura.
          </p>
        </div>

        <ComunicadoRespostaCard
          comunicado={comunicado}
          alunoNome={
            destinatario.aluno?.nome || comunicado.aluno?.nome || null
          }
          turmaNome={comunicado.turma?.nome || null}
          jaRespondido={jaRespondido}
          respostaExistente={respostaExistente}
          action={registrarResposta}
          hiddenFieldName="token"
          hiddenFieldValue={token}
          erro={erro}
        />

        <p className="mt-6 text-center text-xs text-muted-foreground">
          Lumina OS — Comunicação Inteligente
        </p>
      </div>
    </main>
  );
}
