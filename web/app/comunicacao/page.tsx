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

async function atualizarStatusComunicado(formData: FormData) {
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
    throw new Error("Dados inválidos para atualizar o comunicado.");
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

  revalidatePath("/comunicacao");
  revalidatePath("/pulse");
  revalidatePath("/dashboard");

  redirect("/comunicacao");
}

function formatStatus(status: string) {
  const labels: Record<string, string> = {
    A_FAZER: "Rascunho",
    EM_ANDAMENTO: "Preparado",
    AGUARDANDO: "Aguardando aprovação",
    CONCLUIDA: "Enviado",
  };

  return labels[status] ?? status;
}

function getStatusClass(status: string) {
  const classes: Record<string, string> = {
    A_FAZER: "bg-slate-50 text-slate-700 ring-slate-200",
    EM_ANDAMENTO: "bg-blue-50 text-blue-700 ring-blue-200",
    AGUARDANDO: "bg-yellow-50 text-yellow-700 ring-yellow-200",
    CONCLUIDA: "bg-green-50 text-green-700 ring-green-200",
  };

  return classes[status] ?? "bg-muted text-muted-foreground ring-border";
}

async function getComunicacaoData() {
  const comunicados = await prisma.tarefa.findMany({
    where: {
      setor: "Comunicação",
    },
    orderBy: {
      criadoEm: "desc",
    },
    include: {
      aluno: true,
      matricula: true,
    },
  });

  const rascunhos = comunicados.filter(
    (comunicado) => comunicado.status === "A_FAZER"
  );

  const preparados = comunicados.filter(
    (comunicado) => comunicado.status === "EM_ANDAMENTO"
  );

  const aguardando = comunicados.filter(
    (comunicado) => comunicado.status === "AGUARDANDO"
  );

  const enviados = comunicados.filter(
    (comunicado) => comunicado.status === "CONCLUIDA"
  );

  return {
    comunicados,
    rascunhos,
    preparados,
    aguardando,
    enviados,
  };
}

export default async function ComunicacaoPage() {
  const data = await getComunicacaoData();

  return (
    <AppLayout>
      <div className="mb-8 flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-sm font-medium text-muted-foreground">
            Comunicação Escolar
          </p>

          <h1 className="mt-2 text-4xl font-semibold tracking-tight text-foreground">
            Comunicação
          </h1>

          <p className="mt-3 max-w-3xl text-base leading-7 text-muted-foreground">
            Crie, acompanhe e organize comunicados para responsáveis, alunos e
            setores da escola.
          </p>
        </div>

        <Link
          href="/comunicacao/novo"
          className="inline-flex items-center justify-center rounded-2xl bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground transition hover:opacity-90"
        >
          Novo comunicado
        </Link>
      </div>

      <div className="mb-6 grid grid-cols-1 gap-5 md:grid-cols-4">
        <div className="rounded-3xl border border-border bg-card p-6 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">
            Comunicados
          </p>

          <div className="mt-4 text-4xl font-semibold text-foreground">
            {data.comunicados.length}
          </div>

          <p className="mt-2 text-sm text-muted-foreground">
            cadastrados no módulo
          </p>
        </div>

        <div className="rounded-3xl border border-border bg-card p-6 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">
            Rascunhos
          </p>

          <div className="mt-4 text-4xl font-semibold text-foreground">
            {data.rascunhos.length}
          </div>

          <p className="mt-2 text-sm text-muted-foreground">
            ainda não enviados
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
            pendentes de aprovação
          </p>
        </div>

        <div className="rounded-3xl border border-border bg-card p-6 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">
            Enviados
          </p>

          <div className="mt-4 text-4xl font-semibold text-foreground">
            {data.enviados.length}
          </div>

          <p className="mt-2 text-sm text-muted-foreground">
            comunicados finalizados
          </p>
        </div>
      </div>

      <div className="rounded-3xl border border-border bg-card p-6 shadow-sm">
        <div className="mb-6">
          <h2 className="text-xl font-semibold text-foreground">
            Comunicados da escola
          </h2>

          <p className="mt-1 text-sm text-muted-foreground">
            {data.comunicados.length} comunicado
            {data.comunicados.length === 1 ? "" : "s"} encontrado
            {data.comunicados.length === 1 ? "" : "s"}.
          </p>
        </div>

        {data.comunicados.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-border bg-muted/40 p-8 text-center">
            <h3 className="font-semibold text-foreground">
              Nenhum comunicado criado ainda.
            </h3>

            <p className="mt-2 text-sm text-muted-foreground">
              Crie o primeiro comunicado para responsáveis ou setores da escola.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {data.comunicados.map((comunicado) => (
              <div
                key={comunicado.id}
                className={[
                  "rounded-3xl border border-border bg-background p-5 transition hover:border-primary/30",
                  comunicado.status === "CONCLUIDA"
                    ? "opacity-80"
                    : "hover:bg-primary/5",
                ].join(" ")}
              >
                <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
                  <div>
                    <div className="flex flex-wrap items-center gap-3">
                      <h3 className="text-lg font-semibold text-foreground">
                        {comunicado.titulo}
                      </h3>

                      <span
                        className={[
                          "rounded-full px-3 py-1 text-xs font-semibold ring-1",
                          getStatusClass(comunicado.status),
                        ].join(" ")}
                      >
                        {formatStatus(comunicado.status)}
                      </span>
                    </div>

                    {comunicado.descricao && (
                      <p className="mt-3 max-w-3xl whitespace-pre-line text-sm leading-6 text-muted-foreground">
                        {comunicado.descricao}
                      </p>
                    )}

                    <div className="mt-4 flex flex-wrap gap-x-6 gap-y-2 text-sm text-muted-foreground">
                      <span>
                        Criado em{" "}
                        <strong className="font-medium text-foreground">
                          {comunicado.criadoEm.toLocaleDateString("pt-BR")}
                        </strong>
                      </span>

                      <span>
                        Atualizado em{" "}
                        <strong className="font-medium text-foreground">
                          {comunicado.atualizadoEm.toLocaleDateString("pt-BR")}
                        </strong>
                      </span>
                    </div>
                  </div>

                  <div className="flex shrink-0 flex-col gap-2 lg:min-w-[190px]">
                    {comunicado.status === "CONCLUIDA" ? (
                      <form action={atualizarStatusComunicado}>
                        <input
                          type="hidden"
                          name="tarefaId"
                          value={comunicado.id}
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
                          Reabrir comunicado
                        </button>
                      </form>
                    ) : (
                      <>
                        <form action={atualizarStatusComunicado}>
                          <input
                            type="hidden"
                            name="tarefaId"
                            value={comunicado.id}
                          />

                          <input
                            type="hidden"
                            name="status"
                            value="EM_ANDAMENTO"
                          />

                          <button
                            type="submit"
                            disabled={comunicado.status === "EM_ANDAMENTO"}
                            className="w-full rounded-2xl border border-border bg-card px-4 py-3 text-sm font-semibold text-foreground transition hover:bg-muted disabled:cursor-not-allowed disabled:opacity-45"
                          >
                            Preparar
                          </button>
                        </form>

                        <form action={atualizarStatusComunicado}>
                          <input
                            type="hidden"
                            name="tarefaId"
                            value={comunicado.id}
                          />

                          <input type="hidden" name="status" value="AGUARDANDO" />

                          <button
                            type="submit"
                            disabled={comunicado.status === "AGUARDANDO"}
                            className="w-full rounded-2xl border border-border bg-card px-4 py-3 text-sm font-semibold text-foreground transition hover:bg-muted disabled:cursor-not-allowed disabled:opacity-45"
                          >
                            Aguardar aprovação
                          </button>
                        </form>

                        <form action={atualizarStatusComunicado}>
                          <input
                            type="hidden"
                            name="tarefaId"
                            value={comunicado.id}
                          />

                          <input type="hidden" name="status" value="CONCLUIDA" />

                          <button
                            type="submit"
                            className="w-full rounded-2xl bg-primary px-4 py-3 text-sm font-semibold text-primary-foreground transition hover:opacity-90"
                          >
                            Marcar como enviado
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