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

async function atualizarStatusAcademico(formData: FormData) {
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
    throw new Error("Dados inválidos para atualizar o acompanhamento.");
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

  revalidatePath("/academico");
  revalidatePath("/pulse");
  revalidatePath("/dashboard");
  revalidatePath("/relatorios");

  redirect("/academico");
}

function formatStatus(status: string) {
  const labels: Record<string, string> = {
    A_FAZER: "Pendente",
    EM_ANDAMENTO: "Em acompanhamento",
    AGUARDANDO: "Aguardando retorno",
    CONCLUIDA: "Resolvido",
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

async function getAcademicoData() {
  const acompanhamentos = await prisma.tarefa.findMany({
    where: {
      setor: "Acadêmico",
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

  const pendentes = acompanhamentos.filter(
    (item) => item.status !== "CONCLUIDA"
  );

  const emAcompanhamento = acompanhamentos.filter(
    (item) => item.status === "EM_ANDAMENTO"
  );

  const aguardando = acompanhamentos.filter(
    (item) => item.status === "AGUARDANDO"
  );

  const resolvidos = acompanhamentos.filter(
    (item) => item.status === "CONCLUIDA"
  );

  return {
    acompanhamentos,
    pendentes,
    emAcompanhamento,
    aguardando,
    resolvidos,
  };
}

export default async function AcademicoPage() {
  const data = await getAcademicoData();

  return (
    <AppLayout>
      <div className="mb-8 flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-sm font-medium text-muted-foreground">
            Gestão Acadêmica
          </p>

          <h1 className="mt-2 text-4xl font-semibold tracking-tight text-foreground">
            Acadêmico
          </h1>

          <p className="mt-3 max-w-3xl text-base leading-7 text-muted-foreground">
            Acompanhe ocorrências pedagógicas, faltas recorrentes, rendimento e
            demandas acadêmicas vinculadas aos alunos.
          </p>
        </div>

        <Link
          href="/academico/novo"
          className="inline-flex items-center justify-center rounded-2xl bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground transition hover:opacity-90"
        >
          Novo acompanhamento
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
            Em acompanhamento
          </p>

          <div className="mt-4 text-4xl font-semibold text-foreground">
            {data.emAcompanhamento.length}
          </div>

          <p className="mt-2 text-sm text-muted-foreground">
            sendo tratados pela equipe
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
            dependem de retorno
          </p>
        </div>

        <div className="rounded-3xl border border-border bg-card p-6 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">
            Resolvidos
          </p>

          <div className="mt-4 text-4xl font-semibold text-foreground">
            {data.resolvidos.length}
          </div>

          <p className="mt-2 text-sm text-muted-foreground">
            acompanhamentos concluídos
          </p>
        </div>
      </div>

      <div className="rounded-3xl border border-border bg-card p-6 shadow-sm">
        <div className="mb-6">
          <h2 className="text-xl font-semibold text-foreground">
            Acompanhamentos acadêmicos
          </h2>

          <p className="mt-1 text-sm text-muted-foreground">
            {data.acompanhamentos.length} acompanhamento
            {data.acompanhamentos.length === 1 ? "" : "s"} encontrado
            {data.acompanhamentos.length === 1 ? "" : "s"}.
          </p>
        </div>

        {data.acompanhamentos.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-border bg-muted/40 p-8 text-center">
            <h3 className="font-semibold text-foreground">
              Nenhum acompanhamento acadêmico criado ainda.
            </h3>

            <p className="mt-2 text-sm text-muted-foreground">
              Crie um acompanhamento para registrar demandas pedagógicas dos
              alunos.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {data.acompanhamentos.map((item) => (
              <div
                key={item.id}
                className={[
                  "rounded-3xl border border-border bg-background p-5 transition hover:border-primary/30",
                  item.status === "CONCLUIDA"
                    ? "opacity-80"
                    : "hover:bg-primary/5",
                ].join(" ")}
              >
                <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
                  <div>
                    <div className="flex flex-wrap items-center gap-3">
                      <h3 className="text-lg font-semibold text-foreground">
                        {item.titulo}
                      </h3>

                      <span
                        className={[
                          "rounded-full px-3 py-1 text-xs font-semibold ring-1",
                          getStatusClass(item.status),
                        ].join(" ")}
                      >
                        {formatStatus(item.status)}
                      </span>
                    </div>

                    {item.descricao && (
                      <p className="mt-2 max-w-3xl whitespace-pre-line text-sm leading-6 text-muted-foreground">
                        {item.descricao}
                      </p>
                    )}

                    <div className="mt-4 flex flex-wrap gap-x-6 gap-y-2 text-sm text-muted-foreground">
                      <span>
                        Aluno:{" "}
                        <strong className="font-medium text-foreground">
                          {item.aluno?.nome ?? "Não vinculado"}
                        </strong>
                      </span>

                      <span>
                        Responsável:{" "}
                        <strong className="font-medium text-foreground">
                          {item.aluno?.responsavel.nome ?? "Não informado"}
                        </strong>
                      </span>

                      <span>
                        Turma:{" "}
                        <strong className="font-medium text-foreground">
                          {item.aluno?.turma?.nome ?? "Sem turma"}
                        </strong>
                      </span>
                    </div>
                  </div>

                  <div className="flex shrink-0 flex-col gap-2 lg:min-w-[190px]">
                    {item.status === "CONCLUIDA" ? (
                      <form action={atualizarStatusAcademico}>
                        <input type="hidden" name="tarefaId" value={item.id} />

                        <input
                          type="hidden"
                          name="status"
                          value="EM_ANDAMENTO"
                        />

                        <button
                          type="submit"
                          className="w-full rounded-2xl border border-border bg-card px-4 py-3 text-sm font-semibold text-foreground transition hover:bg-muted"
                        >
                          Reabrir acompanhamento
                        </button>
                      </form>
                    ) : (
                      <>
                        <form action={atualizarStatusAcademico}>
                          <input type="hidden" name="tarefaId" value={item.id} />

                          <input
                            type="hidden"
                            name="status"
                            value="EM_ANDAMENTO"
                          />

                          <button
                            type="submit"
                            disabled={item.status === "EM_ANDAMENTO"}
                            className="w-full rounded-2xl border border-border bg-card px-4 py-3 text-sm font-semibold text-foreground transition hover:bg-muted disabled:cursor-not-allowed disabled:opacity-45"
                          >
                            Acompanhar
                          </button>
                        </form>

                        <form action={atualizarStatusAcademico}>
                          <input type="hidden" name="tarefaId" value={item.id} />

                          <input type="hidden" name="status" value="AGUARDANDO" />

                          <button
                            type="submit"
                            disabled={item.status === "AGUARDANDO"}
                            className="w-full rounded-2xl border border-border bg-card px-4 py-3 text-sm font-semibold text-foreground transition hover:bg-muted disabled:cursor-not-allowed disabled:opacity-45"
                          >
                            Aguardar retorno
                          </button>
                        </form>

                        <form action={atualizarStatusAcademico}>
                          <input type="hidden" name="tarefaId" value={item.id} />

                          <input type="hidden" name="status" value="CONCLUIDA" />

                          <button
                            type="submit"
                            className="w-full rounded-2xl bg-primary px-4 py-3 text-sm font-semibold text-primary-foreground transition hover:opacity-90"
                          >
                            Marcar como resolvido
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