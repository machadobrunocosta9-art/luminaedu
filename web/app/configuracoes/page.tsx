import AppLayout from "@/components/layout/AppLayout";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

function getString(formData: FormData, key: string) {
  const value = formData.get(key);

  if (typeof value !== "string") {
    return "";
  }

  return value.trim();
}

async function atualizarEscola(formData: FormData) {
  "use server";

  const nome = getString(formData, "nome");

  if (!nome) {
    throw new Error("O nome da escola é obrigatório.");
  }

  await prisma.escola.upsert({
    where: {
      id: "lumina-demo-school",
    },
    update: {
      nome,
    },
    create: {
      id: "lumina-demo-school",
      nome,
    },
  });

  revalidatePath("/configuracoes");
  revalidatePath("/dashboard");

  redirect("/configuracoes");
}

async function getConfiguracoesData() {
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

  const [alunos, turmas, responsaveis, matriculas, tarefas] =
    await Promise.all([
      prisma.aluno.count(),
      prisma.turma.count(),
      prisma.responsavel.count(),
      prisma.matricula.count(),
      prisma.tarefa.count(),
    ]);

  return {
    escola,
    alunos,
    turmas,
    responsaveis,
    matriculas,
    tarefas,
  };
}

export default async function ConfiguracoesPage() {
  const data = await getConfiguracoesData();

  return (
    <AppLayout>
      <div className="mb-8">
        <p className="text-sm font-medium text-muted-foreground">
          Administração
        </p>

        <h1 className="mt-2 text-4xl font-semibold tracking-tight text-foreground">
          Configurações
        </h1>

        <p className="mt-3 max-w-3xl text-base leading-7 text-muted-foreground">
          Gerencie informações principais da escola e acompanhe a estrutura
          atual da Lumina.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[1.3fr_1fr]">
        <form
          action={atualizarEscola}
          className="rounded-3xl border border-border bg-card p-6 shadow-sm"
        >
          <h2 className="text-xl font-semibold text-foreground">
            Dados da escola
          </h2>

          <p className="mt-1 text-sm text-muted-foreground">
            Essas informações aparecem nos módulos principais da plataforma.
          </p>

          <div className="mt-6">
            <label className="text-sm font-medium text-foreground">
              Nome da escola *
            </label>

            <input
              name="nome"
              required
              defaultValue={data.escola.nome}
              className="mt-2 w-full rounded-2xl border border-border bg-background px-4 py-3 text-sm outline-none transition placeholder:text-muted-foreground focus:border-primary"
            />
          </div>

          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <button
              type="submit"
              className="rounded-2xl bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground transition hover:opacity-90"
            >
              Salvar alterações
            </button>
          </div>
        </form>

        <div className="rounded-3xl border border-border bg-card p-6 shadow-sm">
          <h2 className="text-xl font-semibold text-foreground">
            Resumo da conta
          </h2>

          <p className="mt-1 text-sm text-muted-foreground">
            Visão rápida da estrutura cadastrada.
          </p>

          <div className="mt-6 grid grid-cols-2 gap-3">
            <div className="rounded-2xl bg-muted/50 p-4">
              <p className="text-xs text-muted-foreground">Alunos</p>

              <p className="mt-1 text-2xl font-semibold text-foreground">
                {data.alunos}
              </p>
            </div>

            <div className="rounded-2xl bg-muted/50 p-4">
              <p className="text-xs text-muted-foreground">Responsáveis</p>

              <p className="mt-1 text-2xl font-semibold text-foreground">
                {data.responsaveis}
              </p>
            </div>

            <div className="rounded-2xl bg-muted/50 p-4">
              <p className="text-xs text-muted-foreground">Turmas</p>

              <p className="mt-1 text-2xl font-semibold text-foreground">
                {data.turmas}
              </p>
            </div>

            <div className="rounded-2xl bg-muted/50 p-4">
              <p className="text-xs text-muted-foreground">Matrículas</p>

              <p className="mt-1 text-2xl font-semibold text-foreground">
                {data.matriculas}
              </p>
            </div>

            <div className="col-span-2 rounded-2xl bg-primary/5 p-4">
              <p className="text-xs text-muted-foreground">Pulse</p>

              <p className="mt-1 text-2xl font-semibold text-foreground">
                {data.tarefas} tarefas operacionais
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-6 rounded-3xl border border-border bg-card p-6 shadow-sm">
        <h2 className="text-xl font-semibold text-foreground">
          Módulos ativos
        </h2>

        <p className="mt-1 text-sm text-muted-foreground">
          Estes módulos já estão funcionando com dados reais.
        </p>

        <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
          {[
            "Dashboard",
            "Alunos",
            "Responsáveis",
            "Turmas",
            "Matrículas",
            "Pulse",
            "Acadêmico",
            "Financeiro",
            "Comunicação",
            "Documentos",
            "Relatórios",
          ].map((modulo) => (
            <div
              key={modulo}
              className="rounded-2xl border border-border bg-background p-5"
            >
              <p className="font-semibold text-foreground">{modulo}</p>

              <p className="mt-1 text-sm text-muted-foreground">
                Operacional
              </p>
            </div>
          ))}
        </div>
      </div>
    </AppLayout>
  );
}

