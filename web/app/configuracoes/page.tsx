import AppLayout from "@/components/layout/AppLayout";
import { requireAdmin, resolveAuthSchoolId } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { ArrowRight, CheckCircle2, TriangleAlert, UserCog } from "lucide-react";
import { revalidatePath } from "next/cache";
import Link from "next/link";
import { redirect } from "next/navigation";
import ImageUploadField from "@/components/ui/ImageUploadField";

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

  await requireAdmin("ADMINISTRAR_SISTEMA");

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

async function atualizarLogoEscola(url: string) {
  "use server";

  const auth = await requireAdmin("ADMINISTRAR_SISTEMA");
  const escolaId = await resolveAuthSchoolId(auth);

  await prisma.escola.update({
    where: { id: escolaId },
    data: { logoUrl: url },
  });

  revalidatePath("/configuracoes");
  revalidatePath("/dashboard");
  revalidatePath("/login");
  revalidatePath("/portal-familia");
}

const TABELAS_PARA_LIMPAR = [
  "RespostaComunicado",
  "DestinatarioComunicado",
  "Comunicado",
  "OcorrenciaAluno",
  "Tarefa",
  "PagamentoMatricula",
  "DocumentoMatricula",
  "ConviteMatricula",
  "DocumentoAluno",
  "Matricula",
  "ConviteAcesso",
  "RecuperacaoSenha",
  "SessaoUsuario",
  "Usuario",
  "Aluno",
  "Turma",
  "Responsavel",
  "RegistroAuditoria",
  "EmailTransacional",
  "TentativaLogin",
  "Escola",
];

async function limparDadosTeste(formData: FormData) {
  "use server";

  await requireAdmin("ADMINISTRAR_SISTEMA");

  const confirmacao = getString(formData, "confirmacao");

  if (confirmacao !== "LIMPAR") {
    throw new Error('Digite "LIMPAR" para confirmar a limpeza dos dados.');
  }

  const listaTabelas = TABELAS_PARA_LIMPAR.map((tabela) => `"${tabela}"`).join(
    ", ",
  );

  await prisma.$executeRawUnsafe(
    `TRUNCATE TABLE ${listaTabelas} RESTART IDENTITY CASCADE;`,
  );

  revalidatePath("/configuracoes");
  revalidatePath("/dashboard");
  revalidatePath("/alunos");
  revalidatePath("/responsaveis");
  revalidatePath("/turmas");
  revalidatePath("/matriculas");
  revalidatePath("/comunicacao");
  revalidatePath("/portal-familia");

  redirect("/configuracoes?limpo=1");
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

export default async function ConfiguracoesPage({
  searchParams,
}: {
  searchParams?: Promise<{ limpo?: string }>;
}) {
  await requireAdmin("ADMINISTRAR_SISTEMA");
  const data = await getConfiguracoesData();
  const query = searchParams ? await searchParams : {};

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
            <label className="mb-2 block text-sm font-medium text-foreground">
              Logo da escola
            </label>

            <ImageUploadField
              label="Alterar logo"
              pathPrefix={`escola/${data.escola.id}/logo/`}
              clientPayload={{ kind: "logo-escola", escolaId: data.escola.id }}
              currentUrl={data.escola.logoUrl}
              onUploaded={atualizarLogoEscola}
              shape="square"
            />
          </div>

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

      <Link
        href="/convites-acesso"
        className="group mt-6 flex flex-col gap-4 rounded-3xl border border-border bg-card p-6 shadow-sm transition hover:-translate-y-0.5 hover:border-primary/20 hover:shadow-md sm:flex-row sm:items-center sm:justify-between"
      >
        <div className="flex items-start gap-4">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-primary">
            <UserCog size={22} />
          </div>
          <div>
            <h2 className="text-xl font-semibold text-foreground">
              Usuários e acessos
            </h2>
            <p className="mt-1 text-sm leading-6 text-muted-foreground">
              Consulte usuários e gerencie convites para o Portal da Família.
            </p>
          </div>
        </div>
        <span className="inline-flex items-center gap-2 text-sm font-semibold text-primary">
          Gerenciar
          <ArrowRight
            size={17}
            className="transition group-hover:translate-x-0.5"
          />
        </span>
      </Link>

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

      {query.limpo === "1" && (
        <div className="mt-6 flex items-center gap-3 rounded-3xl border border-emerald-200 bg-emerald-50 p-5 text-sm font-semibold text-emerald-700">
          <CheckCircle2 size={20} />
          Todos os dados de teste foram apagados. A escola foi reiniciada em
          branco.
        </div>
      )}

      <div className="mt-6 rounded-3xl border border-red-200 bg-red-50/60 p-6">
        <div className="mb-4 flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-red-100 text-red-700">
            <TriangleAlert size={20} />
          </div>

          <div>
            <h2 className="text-lg font-semibold text-red-800">
              Zona de risco
            </h2>
            <p className="text-sm text-red-700/80">
              Apaga permanentemente alunos, responsáveis, turmas, matrículas,
              comunicados, contas do Portal da Família e tudo mais. Não pode
              ser desfeito.
            </p>
          </div>
        </div>

        <form action={limparDadosTeste} className="flex flex-wrap items-end gap-3">
          <div>
            <label className="mb-2 block text-sm font-medium text-red-800">
              Digite LIMPAR para confirmar
            </label>
            <input
              name="confirmacao"
              required
              placeholder="LIMPAR"
              className="h-12 w-56 rounded-2xl border border-red-200 bg-white px-4 text-sm outline-none transition focus:border-red-500"
            />
          </div>

          <button
            type="submit"
            className="h-12 rounded-2xl bg-red-600 px-6 text-sm font-semibold text-white transition hover:bg-red-700"
          >
            Apagar todos os dados de teste
          </button>
        </form>
      </div>
    </AppLayout>
  );
}

