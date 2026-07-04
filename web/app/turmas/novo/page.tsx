import AppLayout from "@/components/layout/AppLayout";
import { prisma } from "@/lib/prisma";
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

async function criarTurma(formData: FormData) {
  "use server";

  const nome = getString(formData, "nome");
  const segmento = getString(formData, "segmento");
  const turno = getString(formData, "turno");
  const capacidadeTexto = getString(formData, "capacidade");

  const capacidade = Number(capacidadeTexto);

  if (!nome || !segmento || !turno || !capacidade || capacidade <= 0) {
    throw new Error("Preencha os campos obrigatórios da turma.");
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

  await prisma.turma.create({
    data: {
      nome,
      segmento,
      turno,
      capacidade,
      escolaId: escola.id,
    },
  });

  redirect("/turmas");
}

export default function NovaTurmaPage() {
  return (
    <AppLayout>
      <div className="mb-8">
        <p className="text-sm font-medium text-muted-foreground">
          Organização Escolar
        </p>

        <h1 className="mt-2 text-4xl font-semibold tracking-tight text-foreground">
          Nova turma
        </h1>

        <p className="mt-3 max-w-3xl text-base leading-7 text-muted-foreground">
          Cadastre uma turma para organizar alunos, turnos e capacidade.
        </p>
      </div>

      <form
        action={criarTurma}
        className="grid grid-cols-1 gap-6 xl:grid-cols-[1.4fr_1fr]"
      >
        <div className="rounded-3xl border border-border bg-card p-6 shadow-sm">
          <h2 className="text-xl font-semibold text-foreground">
            Dados da turma
          </h2>

          <p className="mt-1 text-sm text-muted-foreground">
            Defina nome, segmento, turno e capacidade.
          </p>

          <div className="mt-6 grid grid-cols-1 gap-5 md:grid-cols-2">
            <div className="md:col-span-2">
              <label className="text-sm font-medium text-foreground">
                Nome da turma *
              </label>

              <input
                name="nome"
                required
                placeholder="Ex: 5º Ano B"
                className="mt-2 w-full rounded-2xl border border-border bg-background px-4 py-3 text-sm outline-none transition placeholder:text-muted-foreground focus:border-primary"
              />
            </div>

            <div>
              <label className="text-sm font-medium text-foreground">
                Segmento *
              </label>

              <select
                name="segmento"
                required
                defaultValue="Ensino Fundamental"
                className="mt-2 w-full rounded-2xl border border-border bg-background px-4 py-3 text-sm outline-none transition focus:border-primary"
              >
                <option value="Educação Infantil">Educação Infantil</option>
                <option value="Ensino Fundamental">Ensino Fundamental</option>
                <option value="Ensino Médio">Ensino Médio</option>
                <option value="Integral">Integral</option>
              </select>
            </div>

            <div>
              <label className="text-sm font-medium text-foreground">
                Turno *
              </label>

              <select
                name="turno"
                required
                defaultValue="Manhã"
                className="mt-2 w-full rounded-2xl border border-border bg-background px-4 py-3 text-sm outline-none transition focus:border-primary"
              >
                <option value="Manhã">Manhã</option>
                <option value="Tarde">Tarde</option>
                <option value="Noite">Noite</option>
                <option value="Integral">Integral</option>
              </select>
            </div>

            <div>
              <label className="text-sm font-medium text-foreground">
                Capacidade *
              </label>

              <input
                name="capacidade"
                required
                type="number"
                min={1}
                defaultValue={25}
                className="mt-2 w-full rounded-2xl border border-border bg-background px-4 py-3 text-sm outline-none transition focus:border-primary"
              />
            </div>
          </div>
        </div>

        <div className="rounded-3xl border border-border bg-card p-6 shadow-sm">
          <h2 className="text-xl font-semibold text-foreground">
            Controle de vagas
          </h2>

          <p className="mt-1 text-sm leading-6 text-muted-foreground">
            A capacidade da turma será usada para acompanhar ocupação e vagas
            disponíveis.
          </p>

          <div className="mt-6 rounded-2xl border border-primary/10 bg-primary/5 p-5">
            <p className="text-sm font-semibold text-foreground">
              Próximo passo
            </p>

            <p className="mt-2 text-sm leading-6 text-muted-foreground">
              Depois vamos permitir escolher a turma diretamente no cadastro do
              aluno.
            </p>
          </div>

          <div className="mt-8 flex flex-col gap-3">
            <button
              type="submit"
              className="rounded-2xl bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground transition hover:opacity-90"
            >
              Criar turma
            </button>

            <Link
              href="/turmas"
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