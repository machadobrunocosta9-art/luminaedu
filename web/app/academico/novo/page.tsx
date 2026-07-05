import AppLayout from "@/components/layout/AppLayout";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import Link from "next/link";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

function getString(formData: FormData, key: string) {
  const value = formData.get(key);

  if (typeof value !== "string") {
    return "";
  }

  return value.trim();
}

async function criarAcompanhamentoAcademico(formData: FormData) {
  "use server";

  const tipo = getString(formData, "tipo");
  const alunoId = getString(formData, "alunoId");
  const observacoes = getString(formData, "observacoes");
  const prioridade = getString(formData, "prioridade");
  const status = getString(formData, "status");

  if (!tipo || !alunoId || !observacoes) {
    throw new Error("Tipo, aluno e observações são obrigatórios.");
  }

  const escola = await prisma.escola.upsert({
    where: {
      id: "lumina-demo-school",
    },
    update: {},
    create: {
      id: "lumina-demo-school",
      nome: "Jardim Escola Girassol Encantado",
    },
  });

  const aluno = await prisma.aluno.findFirst({
    where: {
      id: alunoId,
      escolaId: escola.id,
    },
    include: {
      responsavel: true,
      turma: true,
    },
  });

  if (!aluno) {
    throw new Error("Aluno não encontrado.");
  }

  const descricao = [
    `Tipo: ${tipo}`,
    `Aluno: ${aluno.nome}`,
    `Responsável: ${aluno.responsavel.nome}`,
    `Turma: ${aluno.turma?.nome ?? "Sem turma"}`,
    "",
    observacoes,
  ].join("\n");

  await prisma.tarefa.create({
    data: {
      titulo: tipo,
      descricao,
      setor: "Acadêmico",
      prioridade:
        prioridade === "BAIXA" ||
        prioridade === "MEDIA" ||
        prioridade === "ALTA" ||
        prioridade === "CRITICA"
          ? prioridade
          : "MEDIA",
      status:
        status === "A_FAZER" ||
        status === "EM_ANDAMENTO" ||
        status === "AGUARDANDO" ||
        status === "CONCLUIDA"
          ? status
          : "A_FAZER",
      escolaId: escola.id,
      alunoId: aluno.id,
    },
  });

  revalidatePath("/academico");
  revalidatePath("/pulse");
  revalidatePath("/dashboard");
  revalidatePath("/relatorios");

  redirect("/academico");
}

async function getFormData() {
  const alunos = await prisma.aluno.findMany({
    orderBy: {
      nome: "asc",
    },
    include: {
      turma: true,
      responsavel: true,
    },
  });

  return {
    alunos,
  };
}

export default async function NovoAcademicoPage() {
  const data = await getFormData();

  return (
    <AppLayout>
      <div className="mb-8">
        <p className="text-sm font-medium text-muted-foreground">
          Gestão Acadêmica
        </p>

        <h1 className="mt-2 text-4xl font-semibold tracking-tight text-foreground">
          Novo acompanhamento
        </h1>

        <p className="mt-3 max-w-3xl text-base leading-7 text-muted-foreground">
          Registre uma ocorrência, necessidade pedagógica ou acompanhamento
          individual de aluno.
        </p>
      </div>

      <form
        action={criarAcompanhamentoAcademico}
        className="grid grid-cols-1 gap-6 xl:grid-cols-[1.4fr_1fr]"
      >
        <div className="rounded-3xl border border-border bg-card p-6 shadow-sm">
          <h2 className="text-xl font-semibold text-foreground">
            Dados acadêmicos
          </h2>

          <p className="mt-1 text-sm text-muted-foreground">
            Informe o tipo de acompanhamento, aluno e detalhes da situação.
          </p>

          <div className="mt-6 grid grid-cols-1 gap-5 md:grid-cols-2">
            <div>
              <label className="text-sm font-medium text-foreground">
                Tipo *
              </label>

              <select
                name="tipo"
                required
                defaultValue="Acompanhamento individual"
                className="mt-2 w-full rounded-2xl border border-border bg-background px-4 py-3 text-sm outline-none transition focus:border-primary"
              >
                <option value="Acompanhamento individual">
                  Acompanhamento individual
                </option>
                <option value="Ocorrência pedagógica">
                  Ocorrência pedagógica
                </option>
                <option value="Baixo rendimento">Baixo rendimento</option>
                <option value="Falta recorrente">Falta recorrente</option>
                <option value="Atendimento com responsável">
                  Atendimento com responsável
                </option>
                <option value="Encaminhamento para coordenação">
                  Encaminhamento para coordenação
                </option>
              </select>
            </div>

            <div>
              <label className="text-sm font-medium text-foreground">
                Prioridade
              </label>

              <select
                name="prioridade"
                defaultValue="MEDIA"
                className="mt-2 w-full rounded-2xl border border-border bg-background px-4 py-3 text-sm outline-none transition focus:border-primary"
              >
                <option value="BAIXA">Baixa</option>
                <option value="MEDIA">Média</option>
                <option value="ALTA">Alta</option>
                <option value="CRITICA">Crítica</option>
              </select>
            </div>

            <div>
              <label className="text-sm font-medium text-foreground">
                Status inicial
              </label>

              <select
                name="status"
                defaultValue="A_FAZER"
                className="mt-2 w-full rounded-2xl border border-border bg-background px-4 py-3 text-sm outline-none transition focus:border-primary"
              >
                <option value="A_FAZER">Pendente</option>
                <option value="EM_ANDAMENTO">Em acompanhamento</option>
                <option value="AGUARDANDO">Aguardando retorno</option>
                <option value="CONCLUIDA">Resolvido</option>
              </select>
            </div>

            <div>
              <label className="text-sm font-medium text-foreground">
                Aluno *
              </label>

              <select
                name="alunoId"
                required
                defaultValue=""
                className="mt-2 w-full rounded-2xl border border-border bg-background px-4 py-3 text-sm outline-none transition focus:border-primary"
              >
                <option value="" disabled>
                  Selecione um aluno
                </option>

                {data.alunos.map((aluno) => (
                  <option key={aluno.id} value={aluno.id}>
                    {aluno.nome} — {aluno.turma?.nome ?? "Sem turma"} —{" "}
                    {aluno.responsavel.nome}
                  </option>
                ))}
              </select>
            </div>

            <div className="md:col-span-2">
              <label className="text-sm font-medium text-foreground">
                Observações *
              </label>

              <textarea
                name="observacoes"
                required
                rows={8}
                placeholder="Descreva a situação, próximos passos ou orientação pedagógica..."
                className="mt-2 w-full resize-none rounded-2xl border border-border bg-background px-4 py-3 text-sm outline-none transition placeholder:text-muted-foreground focus:border-primary"
              />
            </div>
          </div>
        </div>

        <div className="rounded-3xl border border-border bg-card p-6 shadow-sm">
          <h2 className="text-xl font-semibold text-foreground">
            Fluxo acadêmico
          </h2>

          <p className="mt-1 text-sm leading-6 text-muted-foreground">
            Esse acompanhamento será criado no setor Acadêmico e também
            aparecerá no Pulse e nas atividades recentes do Dashboard.
          </p>

          <div className="mt-6 rounded-2xl border border-primary/10 bg-primary/5 p-5">
            <p className="text-sm font-semibold text-foreground">
              Fluxo recomendado
            </p>

            <div className="mt-3 space-y-2 text-sm text-muted-foreground">
              <p>
                <strong className="text-foreground">Pendente:</strong> ainda
                precisa ser tratado.
              </p>

              <p>
                <strong className="text-foreground">Em acompanhamento:</strong>{" "}
                equipe já iniciou o atendimento.
              </p>

              <p>
                <strong className="text-foreground">Aguardando retorno:</strong>{" "}
                depende da família, aluno ou equipe.
              </p>

              <p>
                <strong className="text-foreground">Resolvido:</strong>{" "}
                acompanhamento finalizado.
              </p>
            </div>
          </div>

          <div className="mt-8 flex flex-col gap-3">
            <button
              type="submit"
              className="rounded-2xl bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground transition hover:opacity-90"
            >
              Criar acompanhamento
            </button>

            <Link
              href="/academico"
              className="rounded-2xl border border-border bg-background px-5 py-3 text-center text-sm font-semibold text-foreground transition hover:bg-muted"
            >
              Cancelar
            </Link>
          </div>
        </div>
      </form>
    </AppLayout>
  );
}

