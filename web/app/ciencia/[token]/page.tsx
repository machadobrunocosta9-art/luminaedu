import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { notFound, redirect } from "next/navigation";
import { CheckCircle2, FileText, ShieldCheck } from "lucide-react";

type CienciaPageProps = {
  params: Promise<{
    token: string;
  }>;
};

function formatDateTime(date?: Date | null) {
  if (!date) return "Não informado";

  return new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(date);
}

function getTipoLabel(tipo: string) {
  const labels: Record<string, string> = {
    ADVERTENCIA: "Advertência",
    SUSPENSAO: "Suspensão",
    OCORRENCIA: "Ocorrência",
    RELATORIO: "Relatório",
    RESUMO: "Resumo",
    ATENDIMENTO: "Atendimento",
  };

  return labels[tipo] ?? tipo;
}

export default async function CienciaPage({ params }: CienciaPageProps) {
  const { token } = await params;

  const ocorrencia = await prisma.ocorrenciaAluno.findUnique({
    where: {
      tokenCiencia: token,
    },
    include: {
      escola: true,
      aluno: {
        include: {
          responsavel: true,
          turma: true,
        },
      },
    },
  });

  if (!ocorrencia) {
    notFound();
  }

  const ocorrenciaEncontrada = ocorrencia;

  async function confirmarCiencia(formData: FormData) {
    "use server";

    const nomeConfirmante = String(
      formData.get("nomeConfirmante") || "",
    ).trim();

    const parentescoConfirmante = String(
      formData.get("parentescoConfirmante") || "",
    ).trim();

    const observacaoCiencia = String(
      formData.get("observacaoCiencia") || "",
    ).trim();

    if (!nomeConfirmante || !parentescoConfirmante) {
      throw new Error("Nome e parentesco são obrigatórios.");
    }

    await prisma.ocorrenciaAluno.update({
      where: {
        id: ocorrenciaEncontrada.id,
      },
      data: {
        cienciaConfirmada: true,
        dataCiencia: new Date(),
        nomeConfirmante,
        parentescoConfirmante,
        observacaoCiencia: observacaoCiencia || null,
      },
    });

    revalidatePath(`/ciencia/${token}`);
    revalidatePath(`/alunos/${ocorrenciaEncontrada.alunoId}`);

    redirect(`/ciencia/${token}`);
  }

  return (
    <main className="min-h-screen bg-background px-4 py-8 text-foreground">
      <div className="mx-auto max-w-3xl">
        <div className="mb-8 rounded-3xl border border-border bg-card p-6 shadow-sm">
          <div className="flex items-start gap-4">
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-3xl bg-primary text-primary-foreground">
              <ShieldCheck size={28} />
            </div>

            <div>
              <p className="text-sm font-medium text-muted-foreground">
                Lumina · Ciência Digital
              </p>

              <h1 className="mt-2 text-3xl font-semibold tracking-tight text-foreground">
                Confirmação do responsável
              </h1>

              <p className="mt-2 text-sm leading-6 text-muted-foreground">
                Leia o comunicado abaixo e confirme ciência para que a escola
                registre que o responsável visualizou este documento.
              </p>
            </div>
          </div>
        </div>

        <section className="mb-6 rounded-3xl border border-border bg-card p-6 shadow-sm">
          <div className="mb-5 flex items-center gap-3">
            <FileText size={22} />

            <div>
              <h2 className="font-semibold text-foreground">
                {ocorrenciaEncontrada.titulo}
              </h2>

              <p className="text-sm text-muted-foreground">
                {getTipoLabel(ocorrenciaEncontrada.tipo)} ·{" "}
                {ocorrenciaEncontrada.escola.nome}
              </p>
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="rounded-2xl bg-muted p-4">
              <p className="text-xs font-medium uppercase tracking-[0.16em] text-muted-foreground">
                Aluno
              </p>
              <p className="mt-1 font-medium text-foreground">
                {ocorrenciaEncontrada.aluno.nome}
              </p>
            </div>

            <div className="rounded-2xl bg-muted p-4">
              <p className="text-xs font-medium uppercase tracking-[0.16em] text-muted-foreground">
                Turma
              </p>
              <p className="mt-1 font-medium text-foreground">
                {ocorrenciaEncontrada.aluno.turma?.nome ?? "Não informado"}
              </p>
            </div>
          </div>

          <div className="mt-5 rounded-2xl bg-muted p-5">
            <p className="mb-3 text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">
              Comunicado
            </p>

            <p className="whitespace-pre-line text-sm leading-7 text-foreground">
              {ocorrenciaEncontrada.textoFinal ||
                ocorrenciaEncontrada.descricao}
            </p>
          </div>
        </section>

        {ocorrenciaEncontrada.cienciaConfirmada ? (
          <section className="rounded-3xl border border-border bg-card p-6 shadow-sm">
            <div className="flex items-start gap-4">
              <CheckCircle2 size={28} />

              <div>
                <h2 className="font-semibold text-foreground">
                  Ciência já confirmada
                </h2>

                <p className="mt-2 text-sm leading-6 text-muted-foreground">
                  Este comunicado foi confirmado por{" "}
                  <strong className="text-foreground">
                    {ocorrenciaEncontrada.nomeConfirmante || "responsável"}
                  </strong>{" "}
                  em {formatDateTime(ocorrenciaEncontrada.dataCiencia)}.
                </p>

                {ocorrenciaEncontrada.observacaoCiencia && (
                  <div className="mt-4 rounded-2xl bg-muted p-4">
                    <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                      Observação
                    </p>
                    <p className="mt-2 text-sm leading-6 text-foreground">
                      {ocorrenciaEncontrada.observacaoCiencia}
                    </p>
                  </div>
                )}
              </div>
            </div>
          </section>
        ) : (
          <section className="rounded-3xl border border-border bg-card p-6 shadow-sm">
            <h2 className="font-semibold text-foreground">
              Confirmar ciência
            </h2>

            <p className="mt-2 text-sm leading-6 text-muted-foreground">
              Ao confirmar, a escola verá no prontuário do aluno que o
              responsável tomou ciência deste comunicado.
            </p>

            <form action={confirmarCiencia} className="mt-6 space-y-5">
              <div>
                <label className="mb-2 block text-sm font-medium text-foreground">
                  Nome de quem está confirmando *
                </label>

                <input
                  name="nomeConfirmante"
                  required
                  placeholder="Ex: Maria da Silva"
                  defaultValue={ocorrenciaEncontrada.aluno.responsavel.nome}
                  className="h-12 w-full rounded-2xl border border-border bg-background px-4 text-sm outline-none transition placeholder:text-muted-foreground focus:border-primary"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-foreground">
                  Parentesco *
                </label>

                <select
                  name="parentescoConfirmante"
                  required
                  defaultValue="Responsável"
                  className="h-12 w-full rounded-2xl border border-border bg-background px-4 text-sm outline-none transition focus:border-primary"
                >
                  <option value="Responsável">Responsável</option>
                  <option value="Mãe">Mãe</option>
                  <option value="Pai">Pai</option>
                  <option value="Avó/Avô">Avó/Avô</option>
                  <option value="Tia/Tio">Tia/Tio</option>
                  <option value="Outro">Outro</option>
                </select>
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-foreground">
                  Observação
                </label>

                <textarea
                  name="observacaoCiencia"
                  rows={4}
                  placeholder="Opcional"
                  className="w-full resize-none rounded-2xl border border-border bg-background px-4 py-3 text-sm leading-6 outline-none transition placeholder:text-muted-foreground focus:border-primary"
                />
              </div>

              <button
                type="submit"
                className="w-full rounded-2xl bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground transition hover:opacity-90"
              >
                Estou ciente
              </button>
            </form>
          </section>
        )}
      </div>
    </main>
  );
}