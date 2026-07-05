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

async function criarComunicado(formData: FormData) {
  "use server";

  const titulo = getString(formData, "titulo");
  const mensagem = getString(formData, "mensagem");
  const publico = getString(formData, "publico");
  const canal = getString(formData, "canal");
  const prioridade = getString(formData, "prioridade");
  const status = getString(formData, "status");
  const alunoId = getString(formData, "alunoId");

  if (!titulo || !mensagem || !publico || !canal) {
    throw new Error("Preencha os campos obrigatórios do comunicado.");
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

  const descricao = [
    `Público: ${publico}`,
    `Canal: ${canal}`,
    "",
    mensagem,
  ].join("\n");

  await prisma.tarefa.create({
    data: {
      titulo,
      descricao,
      setor: "Comunicação",
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
      alunoId: alunoId || null,
    },
  });

  revalidatePath("/comunicacao");
  revalidatePath("/pulse");
  revalidatePath("/dashboard");

  redirect("/comunicacao");
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

export default async function NovoComunicadoPage() {
  const data = await getFormData();

  return (
    <AppLayout>
      <div className="mb-8">
        <p className="text-sm font-medium text-muted-foreground">
          Comunicação Escolar
        </p>

        <h1 className="mt-2 text-4xl font-semibold tracking-tight text-foreground">
          Novo comunicado
        </h1>

        <p className="mt-3 max-w-3xl text-base leading-7 text-muted-foreground">
          Crie um comunicado para responsáveis, alunos ou setores da escola e
          acompanhe o envio pelo Pulse.
        </p>
      </div>

      <form
        action={criarComunicado}
        className="grid grid-cols-1 gap-6 xl:grid-cols-[1.4fr_1fr]"
      >
        <div className="rounded-3xl border border-border bg-card p-6 shadow-sm">
          <h2 className="text-xl font-semibold text-foreground">
            Dados do comunicado
          </h2>

          <p className="mt-1 text-sm text-muted-foreground">
            Informe o assunto, público e mensagem principal.
          </p>

          <div className="mt-6 grid grid-cols-1 gap-5 md:grid-cols-2">
            <div className="md:col-span-2">
              <label className="text-sm font-medium text-foreground">
                Título *
              </label>

              <input
                name="titulo"
                required
                placeholder="Ex: Reunião de responsáveis"
                className="mt-2 w-full rounded-2xl border border-border bg-background px-4 py-3 text-sm outline-none transition placeholder:text-muted-foreground focus:border-primary"
              />
            </div>

            <div>
              <label className="text-sm font-medium text-foreground">
                Público *
              </label>

              <select
                name="publico"
                required
                defaultValue="Responsáveis"
                className="mt-2 w-full rounded-2xl border border-border bg-background px-4 py-3 text-sm outline-none transition focus:border-primary"
              >
                <option value="Responsáveis">Responsáveis</option>
                <option value="Alunos">Alunos</option>
                <option value="Professores">Professores</option>
                <option value="Equipe interna">Equipe interna</option>
                <option value="Toda a escola">Toda a escola</option>
              </select>
            </div>

            <div>
              <label className="text-sm font-medium text-foreground">
                Canal *
              </label>

              <select
                name="canal"
                required
                defaultValue="WhatsApp"
                className="mt-2 w-full rounded-2xl border border-border bg-background px-4 py-3 text-sm outline-none transition focus:border-primary"
              >
                <option value="WhatsApp">WhatsApp</option>
                <option value="E-mail">E-mail</option>
                <option value="Agenda escolar">Agenda escolar</option>
                <option value="Mural">Mural</option>
                <option value="Aplicativo">Aplicativo</option>
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
                <option value="A_FAZER">Rascunho</option>
                <option value="EM_ANDAMENTO">Preparado</option>
                <option value="AGUARDANDO">Aguardando aprovação</option>
                <option value="CONCLUIDA">Enviado</option>
              </select>
            </div>

            <div className="md:col-span-2">
              <label className="text-sm font-medium text-foreground">
                Aluno vinculado
              </label>

              <select
                name="alunoId"
                defaultValue=""
                className="mt-2 w-full rounded-2xl border border-border bg-background px-4 py-3 text-sm outline-none transition focus:border-primary"
              >
                <option value="">Nenhum aluno específico</option>

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
                Mensagem *
              </label>

              <textarea
                name="mensagem"
                required
                rows={8}
                placeholder="Escreva aqui o texto do comunicado..."
                className="mt-2 w-full resize-none rounded-2xl border border-border bg-background px-4 py-3 text-sm outline-none transition placeholder:text-muted-foreground focus:border-primary"
              />
            </div>
          </div>
        </div>

        <div className="rounded-3xl border border-border bg-card p-6 shadow-sm">
          <h2 className="text-xl font-semibold text-foreground">
            Fluxo de envio
          </h2>

          <p className="mt-1 text-sm leading-6 text-muted-foreground">
            O comunicado será criado como uma tarefa do setor Comunicação. Ele
            também aparecerá no Pulse e nas atividades recentes do Dashboard.
          </p>

          <div className="mt-6 rounded-2xl border border-primary/10 bg-primary/5 p-5">
            <p className="text-sm font-semibold text-foreground">
              Status disponíveis
            </p>

            <div className="mt-3 space-y-2 text-sm text-muted-foreground">
              <p>
                <strong className="text-foreground">Rascunho:</strong> ainda em
                criação.
              </p>

              <p>
                <strong className="text-foreground">Preparado:</strong> pronto
                para envio.
              </p>

              <p>
                <strong className="text-foreground">
                  Aguardando aprovação:
                </strong>{" "}
                precisa de validação.
              </p>

              <p>
                <strong className="text-foreground">Enviado:</strong>{" "}
                comunicado finalizado.
              </p>
            </div>
          </div>

          <div className="mt-8 flex flex-col gap-3">
            <button
              type="submit"
              className="rounded-2xl bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground transition hover:opacity-90"
            >
              Criar comunicado
            </button>

            <Link
              href="/comunicacao"
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

