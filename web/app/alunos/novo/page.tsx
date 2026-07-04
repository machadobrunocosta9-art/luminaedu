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

async function criarAluno(formData: FormData) {
  "use server";

  const nomeAluno = getString(formData, "nomeAluno");
  const dataNascimento = getString(formData, "dataNascimento");
  const sexo = getString(formData, "sexo");
  const alergias = getString(formData, "alergias");
  const observacoes = getString(formData, "observacoes");

  const nomeResponsavel = getString(formData, "nomeResponsavel");
  const telefoneResponsavel = getString(formData, "telefoneResponsavel");
  const emailResponsavel = getString(formData, "emailResponsavel");
  const cpfResponsavel = getString(formData, "cpfResponsavel");

  if (!nomeAluno || !dataNascimento || !nomeResponsavel || !telefoneResponsavel) {
    throw new Error("Preencha os campos obrigatórios.");
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

  const turma =
    (await prisma.turma.findFirst({
      where: {
        escolaId: escola.id,
      },
      orderBy: {
        criadoEm: "asc",
      },
    })) ??
    (await prisma.turma.create({
      data: {
        nome: "Turma Inicial",
        segmento: "Educação Infantil",
        turno: "Manhã",
        capacidade: 25,
        escolaId: escola.id,
      },
    }));

  const responsavel = await prisma.responsavel.create({
    data: {
      nome: nomeResponsavel,
      telefone: telefoneResponsavel,
      email: emailResponsavel || null,
      cpf: cpfResponsavel || null,
      escolaId: escola.id,
    },
  });

  const aluno = await prisma.aluno.create({
    data: {
      nome: nomeAluno,
      dataNascimento: new Date(dataNascimento),
      sexo: sexo || null,
      alergias: alergias || null,
      observacoes: observacoes || null,
      escolaId: escola.id,
      responsavelId: responsavel.id,
      turmaId: turma.id,
    },
  });

  const matricula = await prisma.matricula.create({
    data: {
      anoLetivo: 2026,
      status: "PENDENTE",
      escolaId: escola.id,
      alunoId: aluno.id,
    },
  });

  await prisma.tarefa.createMany({
    data: [
      {
        titulo: "Conferir documentos da matrícula",
        descricao: `Conferir documentos iniciais de ${aluno.nome}.`,
        setor: "Secretaria",
        prioridade: "ALTA",
        escolaId: escola.id,
        alunoId: aluno.id,
        matriculaId: matricula.id,
      },
      {
        titulo: "Confirmar pagamento da matrícula",
        descricao: `Verificar pagamento inicial da matrícula de ${aluno.nome}.`,
        setor: "Financeiro",
        prioridade: "MEDIA",
        escolaId: escola.id,
        alunoId: aluno.id,
        matriculaId: matricula.id,
      },
    ],
  });

  redirect("/alunos");
}

export default function NovoAlunoPage() {
  return (
    <AppLayout>
      <div className="mb-8">
        <p className="text-sm font-medium text-muted-foreground">
          Centro do Aluno
        </p>

        <h1 className="mt-2 text-4xl font-semibold tracking-tight text-foreground">
          Novo aluno
        </h1>

        <p className="mt-3 max-w-3xl text-base leading-7 text-muted-foreground">
          Cadastre um aluno, vincule um responsável e inicie automaticamente o
          fluxo de matrícula no Pulse.
        </p>
      </div>

      <form action={criarAluno} className="grid grid-cols-1 gap-6 xl:grid-cols-[1.4fr_1fr]">
        <div className="rounded-3xl border border-border bg-card p-6 shadow-sm">
          <h2 className="text-xl font-semibold text-foreground">
            Dados do aluno
          </h2>

          <p className="mt-1 text-sm text-muted-foreground">
            Informações principais para iniciar o cadastro.
          </p>

          <div className="mt-6 grid grid-cols-1 gap-5 md:grid-cols-2">
            <div className="md:col-span-2">
              <label className="text-sm font-medium text-foreground">
                Nome do aluno *
              </label>

              <input
                name="nomeAluno"
                required
                placeholder="Ex: João Pedro Silva"
                className="mt-2 w-full rounded-2xl border border-border bg-background px-4 py-3 text-sm outline-none transition placeholder:text-muted-foreground focus:border-primary"
              />
            </div>

            <div>
              <label className="text-sm font-medium text-foreground">
                Data de nascimento *
              </label>

              <input
                name="dataNascimento"
                required
                type="date"
                className="mt-2 w-full rounded-2xl border border-border bg-background px-4 py-3 text-sm outline-none transition focus:border-primary"
              />
            </div>

            <div>
              <label className="text-sm font-medium text-foreground">
                Sexo
              </label>

              <select
                name="sexo"
                className="mt-2 w-full rounded-2xl border border-border bg-background px-4 py-3 text-sm outline-none transition focus:border-primary"
              >
                <option value="">Não informado</option>
                <option value="Feminino">Feminino</option>
                <option value="Masculino">Masculino</option>
              </select>
            </div>

            <div className="md:col-span-2">
              <label className="text-sm font-medium text-foreground">
                Alergias
              </label>

              <input
                name="alergias"
                placeholder="Ex: Lactose, dipirona, amendoim..."
                className="mt-2 w-full rounded-2xl border border-border bg-background px-4 py-3 text-sm outline-none transition placeholder:text-muted-foreground focus:border-primary"
              />
            </div>

            <div className="md:col-span-2">
              <label className="text-sm font-medium text-foreground">
                Observações
              </label>

              <textarea
                name="observacoes"
                rows={4}
                placeholder="Informações importantes sobre o aluno..."
                className="mt-2 w-full resize-none rounded-2xl border border-border bg-background px-4 py-3 text-sm outline-none transition placeholder:text-muted-foreground focus:border-primary"
              />
            </div>
          </div>
        </div>

        <div className="rounded-3xl border border-border bg-card p-6 shadow-sm">
          <h2 className="text-xl font-semibold text-foreground">
            Responsável
          </h2>

          <p className="mt-1 text-sm text-muted-foreground">
            Pessoa responsável pelo aluno.
          </p>

          <div className="mt-6 space-y-5">
            <div>
              <label className="text-sm font-medium text-foreground">
                Nome do responsável *
              </label>

              <input
                name="nomeResponsavel"
                required
                placeholder="Ex: Maria Silva"
                className="mt-2 w-full rounded-2xl border border-border bg-background px-4 py-3 text-sm outline-none transition placeholder:text-muted-foreground focus:border-primary"
              />
            </div>

            <div>
              <label className="text-sm font-medium text-foreground">
                Telefone *
              </label>

              <input
                name="telefoneResponsavel"
                required
                placeholder="Ex: (21) 99999-0000"
                className="mt-2 w-full rounded-2xl border border-border bg-background px-4 py-3 text-sm outline-none transition placeholder:text-muted-foreground focus:border-primary"
              />
            </div>

            <div>
              <label className="text-sm font-medium text-foreground">
                E-mail
              </label>

              <input
                name="emailResponsavel"
                type="email"
                placeholder="Ex: responsavel@email.com"
                className="mt-2 w-full rounded-2xl border border-border bg-background px-4 py-3 text-sm outline-none transition placeholder:text-muted-foreground focus:border-primary"
              />
            </div>

            <div>
              <label className="text-sm font-medium text-foreground">
                CPF
              </label>

              <input
                name="cpfResponsavel"
                placeholder="Ex: 000.000.000-00"
                className="mt-2 w-full rounded-2xl border border-border bg-background px-4 py-3 text-sm outline-none transition placeholder:text-muted-foreground focus:border-primary"
              />
            </div>
          </div>

          <div className="mt-8 flex flex-col gap-3">
            <button
              type="submit"
              className="rounded-2xl bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground transition hover:opacity-90"
            >
              Cadastrar aluno
            </button>

            <Link
              href="/alunos"
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