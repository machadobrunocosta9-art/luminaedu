import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { Inbox } from "lucide-react";
import { requireFamily } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import {
  isTipoRespostaPermitido,
  registrarRespostaComunicado,
} from "@/lib/comunicados";
import ComunicadoRespostaCard from "@/components/comunicacao/ComunicadoRespostaCard";

export const dynamic = "force-dynamic";

async function responderComunicadoFamilia(formData: FormData) {
  "use server";

  const auth = await requireFamily();

  const destinatarioId = String(formData.get("destinatarioId") || "");
  const tipoResposta = String(formData.get("tipoResposta") || "");
  const nomeRespondente = String(formData.get("nomeRespondente") || "").trim();
  const parentescoRespondente = String(
    formData.get("parentescoRespondente") || "",
  ).trim();
  const observacao = String(formData.get("observacao") || "").trim();
  const motivoNegativa = String(formData.get("motivoNegativa") || "").trim();

  if (!destinatarioId) {
    throw new Error("Comunicado inválido.");
  }

  if (!isTipoRespostaPermitido(tipoResposta)) {
    throw new Error("Tipo de resposta inválido.");
  }

  if (!nomeRespondente || !parentescoRespondente) {
    redirect(`/portal-familia/comunicados?erro=dados#dest-${destinatarioId}`);
  }

  if (
    (tipoResposta === "NAO_PARTICIPA" || tipoResposta === "NAO_AUTORIZADO") &&
    !motivoNegativa
  ) {
    redirect(`/portal-familia/comunicados?erro=motivo#dest-${destinatarioId}`);
  }

  const destinatario = await prisma.destinatarioComunicado.findFirst({
    where: {
      id: destinatarioId,
      escolaId: auth.escolaId,
      responsavelId: auth.responsavelId,
    },
    select: { id: true, alunoId: true },
  });

  if (!destinatario) {
    throw new Error("Comunicado não encontrado para este responsável.");
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
    revalidatePath("/portal-familia/comunicados");
    revalidatePath("/comunicacao");
    revalidatePath("/dashboard");
    revalidatePath("/relatorios");

    if (destinatario.alunoId) {
      revalidatePath(`/alunos/${destinatario.alunoId}`);
      revalidatePath(`/portal-familia/filhos/${destinatario.alunoId}`);
    }
  }

  redirect(`/portal-familia/comunicados?sucesso=1#dest-${destinatarioId}`);
}

type ComunicadosPageProps = {
  searchParams?: Promise<{
    sucesso?: string;
    erro?: string;
  }>;
};

export default async function FamilyComunicadosPage({
  searchParams,
}: ComunicadosPageProps) {
  const auth = await requireFamily();
  const query = searchParams ? await searchParams : {};
  const erro =
    query?.erro === "dados" || query?.erro === "motivo" ? query.erro : null;

  const destinatarios = await prisma.destinatarioComunicado.findMany({
    where: {
      escolaId: auth.escolaId,
      responsavelId: auth.responsavelId,
      comunicado: { status: "ENVIADO" },
    },
    include: {
      aluno: true,
      respostas: {
        orderBy: { dataResposta: "desc" },
      },
      comunicado: {
        include: { turma: true },
      },
    },
    orderBy: { criadoEm: "desc" },
  });

  const pendentes = destinatarios.filter(
    (item) => item.status !== "RESPONDIDO" && item.respostas.length === 0,
  );
  const respondidos = destinatarios.filter(
    (item) => item.status === "RESPONDIDO" || item.respostas.length > 0,
  );

  return (
    <main className="mx-auto w-full max-w-md space-y-6 px-4 pt-6 sm:px-6">
      <header>
        <h1 className="text-[28px] font-semibold tracking-tight text-foreground">
          Comunicados
        </h1>
        <p className="mt-1 text-[15px] text-[#8e8e93]">
          Acompanhe e responda os avisos da escola.
        </p>
      </header>

      {destinatarios.length === 0 ? (
        <div className="rounded-[22px] bg-white p-8 text-center shadow-[0_1px_2px_rgba(0,0,0,0.04),0_1px_8px_rgba(0,0,0,0.04)]">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary">
            <Inbox size={22} />
          </div>
          <p className="font-medium text-foreground">
            Nenhum comunicado recebido ainda
          </p>
          <p className="mt-2 text-sm text-[#8e8e93]">
            Assim que a escola enviar um comunicado, ele aparecerá aqui.
          </p>
        </div>
      ) : (
        <>
          {pendentes.length > 0 && (
            <section className="space-y-4">
              <h2 className="text-lg font-semibold text-foreground">
                Aguardando sua resposta ({pendentes.length})
              </h2>

              {pendentes.map((destinatario) => (
                <div key={destinatario.id} id={`dest-${destinatario.id}`}>
                  {destinatarios.length > 0 && destinatario.aluno && (
                    <p className="mb-2 text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">
                      {destinatario.aluno.nome}
                    </p>
                  )}

                  <ComunicadoRespostaCard
                    comunicado={destinatario.comunicado}
                    alunoNome={destinatario.aluno?.nome || null}
                    turmaNome={destinatario.comunicado.turma?.nome || null}
                    jaRespondido={false}
                    respostaExistente={null}
                    action={responderComunicadoFamilia}
                    hiddenFieldName="destinatarioId"
                    hiddenFieldValue={destinatario.id}
                    erro={erro}
                  />
                </div>
              ))}
            </section>
          )}

          {respondidos.length > 0 && (
            <section className="space-y-4">
              <h2 className="text-lg font-semibold text-foreground">
                Já respondidos ({respondidos.length})
              </h2>

              {respondidos.map((destinatario) => (
                <div key={destinatario.id} id={`dest-${destinatario.id}`}>
                  {destinatario.aluno && (
                    <p className="mb-2 text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">
                      {destinatario.aluno.nome}
                    </p>
                  )}

                  <ComunicadoRespostaCard
                    comunicado={destinatario.comunicado}
                    alunoNome={destinatario.aluno?.nome || null}
                    turmaNome={destinatario.comunicado.turma?.nome || null}
                    jaRespondido={true}
                    respostaExistente={destinatario.respostas[0] || null}
                    action={responderComunicadoFamilia}
                    hiddenFieldName="destinatarioId"
                    hiddenFieldValue={destinatario.id}
                  />
                </div>
              ))}
            </section>
          )}
        </>
      )}
    </main>
  );
}
