import AppLayout from "@/components/layout/AppLayout";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import Link from "next/link";

export const dynamic = "force-dynamic";

function getString(formData: FormData, key: string) {
  const value = formData.get(key);

  if (typeof value !== "string") {
    return "";
  }

  return value.trim();
}

async function atualizarStatusDocumento(formData: FormData) {
  "use server";

  const tarefaId = getString(formData, "tarefaId");
  const status = getString(formData, "status");

  const statusPermitidos = [
    "A_FAZER",
    "EM_ANDAMENTO",
    "AGUARDANDO",
    "CONCLUIDA",
  ];

  if (!tarefaId || !statusPermitidos.includes(status)) {
    throw new Error("Dados inválidos para atualizar o documento.");
  }

  await prisma.tarefa.update({
    where: {
      id: tarefaId,
    },
    data: {
      status: status as
        | "A_FAZER"
        | "EM_ANDAMENTO"
        | "AGUARDANDO"
        | "CONCLUIDA",
    },
  });

  revalidatePath("/documentos");
  revalidatePath("/pulse");
  revalidatePath("/dashboard");
  revalidatePath("/matriculas");

  redirect("/documentos");
}

function formatStatus(status: string) {
  const labels: Record<string, string> = {
    A_FAZER: "Pendente",
    EM_ANDAMENTO: "Em análise",
    AGUARDANDO: "Aguardando responsável",
    CONCLUIDA: "Recebido",
  };

  return labels[status] ?? status;
}

function getStatusClass(status: string) {
  const classes: Record<string, string> = {
    A_FAZER: "bg-yellow-50 text-yellow-700 ring-yellow-200",
    EM_ANDAMENTO: "bg-blue-50 text-blue-700 ring-blue-200",
    AGUARDANDO: "bg-orange-50 text-orange-700 ring-orange-200",
    CONCLUIDA: "bg-green-50 text-green-700 ring-green-200",
  };

  return classes[status] ?? "bg-muted text-muted-foreground ring-border";
}

async function getDocumentosData() {
  const documentos = await prisma.tarefa.findMany({
    where: {
      setor: "Documentos",
    },
    orderBy: {
      criadoEm: "desc",
    },
    include: {
      aluno: {
        include: {
          responsavel: true,
          turma: true,
        },
      },
      matricula: true,
    },
  });

  const pendentes = documentos.filter(
    (documento) => documento.status !== "CONCLUIDA"
  );

  const emAnalise = documentos.filter(
    (documento) => documento.status === "EM_ANDAMENTO"
  );

  const aguardando = documentos.filter(
    (documento) => documento.status === "AGUARDANDO"
  );

  const recebidos = documentos.filter(
    (documento) => documento.status === "CONCLUIDA"
  );

  return {
    documentos,
    pendentes,
    emAnalise,
    aguardando,
    recebidos,
  };
}

export default async function DocumentosPage() {
  const data = await getDocumentosData();

  return (
    <AppLayout>
      <div className="mb-8 flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-sm font-medium text-muted-foreground">
            Gestão de Documentos
          </p>

          <h1 className="mt-2 text-4xl font-semibold tracking-tight text-foreground">
            Documentos
          </h1>

          <p className="mt-3 max-w-3xl text-base leading-7 text-muted-foreground">
            Controle documentos pendentes, recebidos e em análise durante o
            processo de matrícula.
          </p>
        </div>

        <Link
          href="/documentos/novo"
          className="inline-flex items-center justify-center rounded-2xl bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground transition hover:opacity-90"
        >
          Nova pendência
        </Link>
      </div>

      <div className="mb-6 grid grid-cols-1 gap-5 md:grid-cols-4">
        <div className="rounded-3xl border border-border bg-card p-6 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">
            Pendentes
          </p>

          <div className="mt-4 text-4xl font-semibold text-foreground">
            {data.pendentes.length}
          </div>

          <p className="mt-2 text-sm text-muted-foreground">
            precisam de acompanhamento
          </p>
        </div>

        <div className="rounded-3xl border border-border bg-card p-6 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">
            Em análise
          </p>

          <div className="mt-4 text-4xl font-semibold text-foreground">
            {data.emAnalise.length}
          </div>

          <p className="mt-2 text-sm text-muted-foreground">
            sendo conferidos
          </p>
        </div>

        <div className="rounded-3xl border border-border bg-card p-6 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">
            Aguardando
          </p>

          <div className="mt-4 text-4xl font-semibold text-foreground">
            {data.aguardando.length}
          </div>

          <p className="mt-2 text-sm text-muted-foreground">
            dependem do responsável
          </p>
        </div>

        <div className="rounded-3xl border border-border bg-card p-6 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">
            Recebidos
          </p>

          <div className="mt-4 text-4xl font-semibold text-foreground">
            {data.recebidos.length}
          </div>

          <p className="mt-2 text-sm text-muted-foreground">
            documentos concluídos
          </p>
        </div>
      </div>

      <div className="rounded-3xl border border-border bg-card p-6 shadow-sm">
        <div className="mb-6">
          <h2 className="text-xl font-semibold text-foreground">
            Pendências documentais
          </h2>

          <p className="mt-1 text-sm text-muted-foreground">
            {data.documentos.length} documento
            {data.documentos.length === 1 ? "" : "s"} encontrado
            {data.documentos.length === 1 ? "" : "s"}.
          </p>
        </div>

        {data.documentos.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-border bg-muted/40 p-8 text-center">
            <h3 className="font-semibold text-foreground">
              Nenhuma pendência documental encontrada.
            </h3>

            <p className="mt-2 text-sm text-muted-foreground">
              Crie uma pendência para acompanhar documentos de matrícula.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {data.documentos.map((documento) => (
              <div
                key={documento.id}
                className={[
                  "rounded-3xl border border-border bg-background p-5 transition hover:border-primary/30",
                  documento.status === "CONCLUIDA"
                    ? "opacity-80"
                    : "hover:bg-primary/5",
                ].join(" ")}
              >
                <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
                  <div>
                    <div className="flex flex-wrap items-center gap-3">
                      <h3 className="text-lg font-semibold text-foreground">
                        {documento.titulo}
                      </h3>

                      <span
                        className={[
                          "rounded-full px-3 py-1 text-xs font-semibold ring-1",
                          getStatusClass(documento.status),
                        ].join(" ")}
                      >
                        {formatStatus(documento.status)}
                      </span>
                    </div>

                    {documento.descricao && (
                      <p className="mt-2 max-w-3xl whitespace-pre-line text-sm leading-6 text-muted-foreground">
                        {documento.descricao}
                      </p>
                    )}

                    <div className="mt-4 flex flex-wrap gap-x-6 gap-y-2 text-sm text-muted-foreground">
                      <span>
                        Aluno:{" "}
                        <strong className="font-medium text-foreground">
                          {documento.aluno?.nome ?? "Não vinculado"}
                        </strong>
                      </span>

                      <span>
                        Responsável:{" "}
                        <strong className="font-medium text-foreground">
                          {documento.aluno?.responsavel.nome ?? "Não informado"}
                        </strong>
                      </span>

                      <span>
                        Turma:{" "}
                        <strong className="font-medium text-foreground">
                          {documento.aluno?.turma?.nome ?? "Sem turma"}
                        </strong>
                      </span>

                      <span>
                        Matrícula:{" "}
                        <strong className="font-medium text-foreground">
                          {documento.matricula?.anoLetivo ?? "Não vinculada"}
                        </strong>
                      </span>
                    </div>
                  </div>

                  <div className="flex shrink-0 flex-col gap-2 lg:min-w-[190px]">
                    {documento.status === "CONCLUIDA" ? (
                      <form action={atualizarStatusDocumento}>
                        <input
                          type="hidden"
                          name="tarefaId"
                          value={documento.id}
                        />

                        <input
                          type="hidden"
                          name="status"
                          value="EM_ANDAMENTO"
                        />

                        <button
                          type="submit"
                          className="w-full rounded-2xl border border-border bg-card px-4 py-3 text-sm font-semibold text-foreground transition hover:bg-muted"
                        >
                          Reabrir análise
                        </button>
                      </form>
                    ) : (
                      <>
                        <form action={atualizarStatusDocumento}>
                          <input
                            type="hidden"
                            name="tarefaId"
                            value={documento.id}
                          />

                          <input
                            type="hidden"
                            name="status"
                            value="EM_ANDAMENTO"
                          />

                          <button
                            type="submit"
                            disabled={documento.status === "EM_ANDAMENTO"}
                            className="w-full rounded-2xl border border-border bg-card px-4 py-3 text-sm font-semibold text-foreground transition hover:bg-muted disabled:cursor-not-allowed disabled:opacity-45"
                          >
                            Analisar
                          </button>
                        </form>

                        <form action={atualizarStatusDocumento}>
                          <input
                            type="hidden"
                            name="tarefaId"
                            value={documento.id}
                          />

                          <input type="hidden" name="status" value="AGUARDANDO" />

                          <button
                            type="submit"
                            disabled={documento.status === "AGUARDANDO"}
                            className="w-full rounded-2xl border border-border bg-card px-4 py-3 text-sm font-semibold text-foreground transition hover:bg-muted disabled:cursor-not-allowed disabled:opacity-45"
                          >
                            Aguardar responsável
                          </button>
                        </form>

                        <form action={atualizarStatusDocumento}>
                          <input
                            type="hidden"
                            name="tarefaId"
                            value={documento.id}
                          />

                          <input type="hidden" name="status" value="CONCLUIDA" />

                          <button
                            type="submit"
                            className="w-full rounded-2xl bg-primary px-4 py-3 text-sm font-semibold text-primary-foreground transition hover:opacity-90"
                          >
                            Marcar como recebido
                          </button>
                        </form>
                      </>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </AppLayout>
  );
}