import AppLayout from "@/components/layout/AppLayout";
import { requireAdmin } from "@/lib/auth";
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

async function criarPendenciaDocumento(formData: FormData) {
  "use server";

  await requireAdmin();

  const tipoDocumento = getString(formData, "tipoDocumento");
  const alunoId = getString(formData, "alunoId");
  const matriculaId = getString(formData, "matriculaId");
  const observacoes = getString(formData, "observacoes");
  const prioridade = getString(formData, "prioridade");
  const status = getString(formData, "status");

  if (!tipoDocumento || !alunoId) {
    throw new Error("Documento e aluno são obrigatórios.");
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
    `Documento: ${tipoDocumento}`,
    `Aluno: ${aluno.nome}`,
    `Responsável: ${aluno.responsavel.nome}`,
    `Turma: ${aluno.turma?.nome ?? "Sem turma"}`,
    "",
    observacoes || "Sem observações adicionais.",
  ].join("\n");

  await prisma.tarefa.create({
    data: {
      titulo: `Receber ${tipoDocumento}`,
      descricao,
      setor: "Documentos",
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
      matriculaId: matriculaId || null,
    },
  });

  revalidatePath("/documentos");
  revalidatePath("/pulse");
  revalidatePath("/dashboard");
  revalidatePath("/matriculas");

  redirect("/documentos");
}

async function getFormData() {
  const [alunos, matriculas] = await Promise.all([
    prisma.aluno.findMany({
      orderBy: {
        nome: "asc",
      },
      include: {
        turma: true,
        responsavel: true,
      },
    }),

    prisma.matricula.findMany({
      orderBy: {
        criadoEm: "desc",
      },
      include: {
        aluno: true,
      },
    }),
  ]);

  return {
    alunos,
    matriculas,
  };
}

export default async function NovoDocumentoPage() {
  const data = await getFormData();

  return (
    <AppLayout>
      <div className="mb-8">
        <p className="text-sm font-medium text-muted-foreground">
          Gestão de Documentos
        </p>

        <h1 className="mt-2 text-4xl font-semibold tracking-tight text-foreground">
          Nova pendência documental
        </h1>

        <p className="mt-3 max-w-3xl text-base leading-7 text-muted-foreground">
          Crie uma pendência para acompanhar documentos de matrícula no Pulse.
        </p>
      </div>

      <form
        action={criarPendenciaDocumento}
        className="grid grid-cols-1 gap-6 xl:grid-cols-[1.4fr_1fr]"
      >
        <div className="rounded-3xl border border-border bg-card p-6 shadow-sm">
          <h2 className="text-xl font-semibold text-foreground">
            Dados do documento
          </h2>

          <p className="mt-1 text-sm text-muted-foreground">
            Informe o aluno, documento necessário e status inicial.
          </p>

          <div className="mt-6 grid grid-cols-1 gap-5 md:grid-cols-2">
            <div>
              <label className="text-sm font-medium text-foreground">
                Tipo de documento *
              </label>

              <select
                name="tipoDocumento"
                required
                defaultValue="Certidão de nascimento"
                className="mt-2 w-full rounded-2xl border border-border bg-background px-4 py-3 text-sm outline-none transition focus:border-primary"
              >
                <option value="Certidão de nascimento">
                  Certidão de nascimento
                </option>
                <option value="RG do aluno">RG do aluno</option>
                <option value="CPF do aluno">CPF do aluno</option>
                <option value="RG do responsável">RG do responsável</option>
                <option value="CPF do responsável">CPF do responsável</option>
                <option value="Comprovante de residência">
                  Comprovante de residência
                </option>
                <option value="Foto 3x4">Foto 3x4</option>
                <option value="Contrato assinado">Contrato assinado</option>
                <option value="Declaração escolar">Declaração escolar</option>
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
                <option value="EM_ANDAMENTO">Em análise</option>
                <option value="AGUARDANDO">Aguardando responsável</option>
                <option value="CONCLUIDA">Recebido</option>
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
                Matrícula vinculada
              </label>

              <select
                name="matriculaId"
                defaultValue=""
                className="mt-2 w-full rounded-2xl border border-border bg-background px-4 py-3 text-sm outline-none transition focus:border-primary"
              >
                <option value="">Nenhuma matrícula específica</option>

                {data.matriculas.map((matricula) => (
                  <option key={matricula.id} value={matricula.id}>
                    {matricula.aluno.nome} — {matricula.anoLetivo}
                  </option>
                ))}
              </select>
            </div>

            <div className="md:col-span-2">
              <label className="text-sm font-medium text-foreground">
                Observações
              </label>

              <textarea
                name="observacoes"
                rows={6}
                placeholder="Ex: Responsável ficou de entregar até sexta-feira."
                className="mt-2 w-full resize-none rounded-2xl border border-border bg-background px-4 py-3 text-sm outline-none transition placeholder:text-muted-foreground focus:border-primary"
              />
            </div>
          </div>
        </div>

        <div className="rounded-3xl border border-border bg-card p-6 shadow-sm">
          <h2 className="text-xl font-semibold text-foreground">
            Controle pelo Pulse
          </h2>

          <p className="mt-1 text-sm leading-6 text-muted-foreground">
            A pendência será criada no setor Documentos e também aparecerá no
            Pulse e no Dashboard.
          </p>

          <div className="mt-6 rounded-2xl border border-primary/10 bg-primary/5 p-5">
            <p className="text-sm font-semibold text-foreground">
              Fluxo recomendado
            </p>

            <div className="mt-3 space-y-2 text-sm text-muted-foreground">
              <p>
                <strong className="text-foreground">Pendente:</strong>{" "}
                documento ainda não entregue.
              </p>

              <p>
                <strong className="text-foreground">Em análise:</strong>{" "}
                documento recebido e em conferência.
              </p>

              <p>
                <strong className="text-foreground">
                  Aguardando responsável:
                </strong>{" "}
                falta correção ou envio.
              </p>

              <p>
                <strong className="text-foreground">Recebido:</strong>{" "}
                documento aprovado.
              </p>
            </div>
          </div>

          <div className="mt-8 flex flex-col gap-3">
            <button
              type="submit"
              className="rounded-2xl bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground transition hover:opacity-90"
            >
              Criar pendência
            </button>

            <Link
              href="/documentos"
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

