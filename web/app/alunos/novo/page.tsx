import AppLayout from "@/components/layout/AppLayout";
import { requireAdmin, resolveAuthSchoolId } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  GraduationCap,
  Save,
  Sparkles,
  UserRound,
} from "lucide-react";

export const dynamic = "force-dynamic";

function getString(formData: FormData, key: string) {
  const value = formData.get(key);

  if (typeof value !== "string") {
    return "";
  }

  return value.trim();
}

export default async function NovoAlunoDiretoPage() {
  const auth = await requireAdmin("GERENCIAR_ALUNOS");
  const escolaId = await resolveAuthSchoolId(auth);

  const [responsaveis, turmas] = await Promise.all([
    prisma.responsavel.findMany({
      where: { escolaId },
      orderBy: { nome: "asc" },
    }),
    prisma.turma.findMany({
      where: { escolaId },
      orderBy: { nome: "asc" },
    }),
  ]);

  const anoAtual = new Date().getFullYear();

  async function cadastrarAlunoExistente(formData: FormData) {
    "use server";

    const authAction = await requireAdmin("GERENCIAR_ALUNOS");
    const escolaIdAction = await resolveAuthSchoolId(authAction);

    const nomeAluno = getString(formData, "nomeAluno");
    const dataNascimento = getString(formData, "dataNascimento");
    const sexo = getString(formData, "sexo");
    const cpfAluno = getString(formData, "cpfAluno");
    const certidaoNascimento = getString(formData, "certidaoNascimento");
    const alergias = getString(formData, "alergias");
    const observacoes = getString(formData, "observacoes");
    const turmaId = getString(formData, "turmaId");
    const anoLetivoTexto = getString(formData, "anoLetivo");
    const anoLetivo = Number(anoLetivoTexto) || anoAtual;

    const responsavelId = getString(formData, "responsavelId");
    const nomeResponsavel = getString(formData, "nomeResponsavel");
    const telefoneResponsavel = getString(formData, "telefoneResponsavel");
    const emailResponsavel = getString(formData, "emailResponsavel");
    const cpfResponsavel = getString(formData, "cpfResponsavel");
    const enderecoResponsavel = getString(formData, "enderecoResponsavel");
    const profissaoResponsavel = getString(formData, "profissaoResponsavel");

    if (!nomeAluno || !dataNascimento) {
      throw new Error("Nome e data de nascimento do aluno são obrigatórios.");
    }

    let responsavelIdFinal = "";

    if (responsavelId) {
      const responsavel = await prisma.responsavel.findFirst({
        where: { id: responsavelId, escolaId: escolaIdAction },
        select: { id: true },
      });

      if (!responsavel) {
        throw new Error("Responsável selecionado não foi encontrado.");
      }

      responsavelIdFinal = responsavel.id;
    } else {
      if (!nomeResponsavel || !telefoneResponsavel) {
        throw new Error(
          "Informe um responsável existente ou preencha nome e telefone do novo responsável.",
        );
      }

      const novoResponsavel = await prisma.responsavel.create({
        data: {
          nome: nomeResponsavel,
          telefone: telefoneResponsavel,
          email: emailResponsavel || null,
          cpf: cpfResponsavel || null,
          endereco: enderecoResponsavel || null,
          profissao: profissaoResponsavel || null,
          escolaId: escolaIdAction,
        },
      });

      responsavelIdFinal = novoResponsavel.id;
    }

    if (turmaId) {
      const turma = await prisma.turma.findFirst({
        where: { id: turmaId, escolaId: escolaIdAction },
        select: { id: true },
      });

      if (!turma) {
        throw new Error("Turma selecionada não foi encontrada.");
      }
    }

    const aluno = await prisma.aluno.create({
      data: {
        nome: nomeAluno,
        dataNascimento: new Date(`${dataNascimento}T00:00:00`),
        sexo: sexo || null,
        cpf: cpfAluno || null,
        certidaoNascimento: certidaoNascimento || null,
        alergias: alergias || null,
        observacoes: observacoes || null,
        escolaId: escolaIdAction,
        responsavelId: responsavelIdFinal,
        turmaId: turmaId || null,
      },
    });

    await prisma.matricula.create({
      data: {
        anoLetivo,
        status: "ATIVA",
        escolaId: escolaIdAction,
        alunoId: aluno.id,
      },
    });

    revalidatePath("/alunos");
    revalidatePath("/responsaveis");
    revalidatePath("/turmas");
    revalidatePath("/dashboard");
    revalidatePath("/matriculas");

    redirect(`/alunos/${aluno.id}`);
  }

  return (
    <AppLayout>
      <div className="mb-8">
        <Link
          href="/alunos"
          className="mb-5 inline-flex items-center gap-2 text-sm font-medium text-muted-foreground transition hover:text-foreground"
        >
          <ArrowLeft size={16} />
          Voltar para alunos
        </Link>

        <p className="text-sm font-medium text-muted-foreground">
          Cadastro direto
        </p>

        <h1 className="mt-2 text-3xl font-semibold tracking-tight text-foreground">
          Adicionar aluno já matriculado
        </h1>

        <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
          Use esta tela para cadastrar alunos que já estudam na escola, sem
          passar pelo fluxo de convite de matrícula digital. A matrícula é
          criada automaticamente com status ativa.
        </p>
      </div>

      <form
        action={cadastrarAlunoExistente}
        className="grid gap-6 xl:grid-cols-[1fr_360px]"
      >
        <div className="space-y-6">
          <section className="rounded-3xl border border-border bg-card p-6 shadow-sm">
            <div className="mb-6 flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-muted">
                <GraduationCap size={19} />
              </div>

              <div>
                <h2 className="font-semibold text-foreground">
                  Dados do aluno
                </h2>
                <p className="text-sm text-muted-foreground">
                  Informações escolares básicas.
                </p>
              </div>
            </div>

            <div className="grid gap-5 md:grid-cols-2">
              <div>
                <label className="mb-2 block text-sm font-medium text-foreground">
                  Nome completo *
                </label>
                <input
                  name="nomeAluno"
                  required
                  placeholder="Ex: Maria Eduarda Souza"
                  className="h-12 w-full rounded-2xl border border-border bg-background px-4 text-sm outline-none transition focus:border-primary"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-foreground">
                  Data de nascimento *
                </label>
                <input
                  name="dataNascimento"
                  type="date"
                  required
                  className="h-12 w-full rounded-2xl border border-border bg-background px-4 text-sm outline-none transition focus:border-primary"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-foreground">
                  Sexo
                </label>
                <select
                  name="sexo"
                  defaultValue=""
                  className="h-12 w-full rounded-2xl border border-border bg-background px-4 text-sm outline-none transition focus:border-primary"
                >
                  <option value="">Não informado</option>
                  <option value="Feminino">Feminino</option>
                  <option value="Masculino">Masculino</option>
                </select>
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-foreground">
                  Turma
                </label>
                <select
                  name="turmaId"
                  defaultValue=""
                  className="h-12 w-full rounded-2xl border border-border bg-background px-4 text-sm outline-none transition focus:border-primary"
                >
                  <option value="">Sem turma definida</option>
                  {turmas.map((turma) => (
                    <option key={turma.id} value={turma.id}>
                      {turma.nome} · {turma.turno}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-foreground">
                  CPF do aluno
                </label>
                <input
                  name="cpfAluno"
                  placeholder="Opcional"
                  className="h-12 w-full rounded-2xl border border-border bg-background px-4 text-sm outline-none transition focus:border-primary"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-foreground">
                  Certidão de nascimento
                </label>
                <input
                  name="certidaoNascimento"
                  placeholder="Opcional"
                  className="h-12 w-full rounded-2xl border border-border bg-background px-4 text-sm outline-none transition focus:border-primary"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-foreground">
                  Ano letivo da matrícula
                </label>
                <input
                  name="anoLetivo"
                  type="number"
                  defaultValue={anoAtual}
                  className="h-12 w-full rounded-2xl border border-border bg-background px-4 text-sm outline-none transition focus:border-primary"
                />
              </div>
            </div>

            <div className="mt-5">
              <label className="mb-2 block text-sm font-medium text-foreground">
                Alergias
              </label>
              <input
                name="alergias"
                placeholder="Opcional"
                className="h-12 w-full rounded-2xl border border-border bg-background px-4 text-sm outline-none transition focus:border-primary"
              />
            </div>

            <div className="mt-5">
              <label className="mb-2 block text-sm font-medium text-foreground">
                Observações
              </label>
              <textarea
                name="observacoes"
                rows={3}
                placeholder="Opcional"
                className="w-full resize-none rounded-2xl border border-border bg-background px-4 py-3 text-sm leading-6 outline-none transition focus:border-primary"
              />
            </div>
          </section>

          <section className="rounded-3xl border border-border bg-card p-6 shadow-sm">
            <div className="mb-6 flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-muted">
                <UserRound size={19} />
              </div>

              <div>
                <h2 className="font-semibold text-foreground">Responsável</h2>
                <p className="text-sm text-muted-foreground">
                  Selecione um responsável já cadastrado ou preencha os dados
                  de um novo.
                </p>
              </div>
            </div>

            <div className="mb-5">
              <label className="mb-2 block text-sm font-medium text-foreground">
                Responsável já cadastrado
              </label>
              <select
                name="responsavelId"
                defaultValue=""
                className="h-12 w-full rounded-2xl border border-border bg-background px-4 text-sm outline-none transition focus:border-primary"
              >
                <option value="">+ Cadastrar novo responsável</option>
                {responsaveis.map((responsavel) => (
                  <option key={responsavel.id} value={responsavel.id}>
                    {responsavel.nome} · {responsavel.telefone}
                  </option>
                ))}
              </select>
              <p className="mt-2 text-xs text-muted-foreground">
                Se escolher um responsável existente, os campos abaixo serão
                ignorados.
              </p>
            </div>

            <div className="grid gap-5 md:grid-cols-2">
              <div>
                <label className="mb-2 block text-sm font-medium text-foreground">
                  Nome do novo responsável
                </label>
                <input
                  name="nomeResponsavel"
                  placeholder="Ex: Ana Souza"
                  className="h-12 w-full rounded-2xl border border-border bg-background px-4 text-sm outline-none transition focus:border-primary"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-foreground">
                  Telefone
                </label>
                <input
                  name="telefoneResponsavel"
                  placeholder="(00) 00000-0000"
                  className="h-12 w-full rounded-2xl border border-border bg-background px-4 text-sm outline-none transition focus:border-primary"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-foreground">
                  E-mail
                </label>
                <input
                  name="emailResponsavel"
                  type="email"
                  placeholder="responsavel@email.com"
                  className="h-12 w-full rounded-2xl border border-border bg-background px-4 text-sm outline-none transition focus:border-primary"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-foreground">
                  CPF
                </label>
                <input
                  name="cpfResponsavel"
                  placeholder="Opcional"
                  className="h-12 w-full rounded-2xl border border-border bg-background px-4 text-sm outline-none transition focus:border-primary"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-foreground">
                  Profissão
                </label>
                <input
                  name="profissaoResponsavel"
                  placeholder="Opcional"
                  className="h-12 w-full rounded-2xl border border-border bg-background px-4 text-sm outline-none transition focus:border-primary"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-foreground">
                  Endereço
                </label>
                <input
                  name="enderecoResponsavel"
                  placeholder="Opcional"
                  className="h-12 w-full rounded-2xl border border-border bg-background px-4 text-sm outline-none transition focus:border-primary"
                />
              </div>
            </div>
          </section>

          <div className="flex flex-wrap justify-end gap-3">
            <Link
              href="/alunos"
              className="rounded-2xl border border-border px-5 py-3 text-sm font-semibold text-foreground transition hover:bg-muted"
            >
              Cancelar
            </Link>

            <button
              type="submit"
              className="inline-flex items-center gap-2 rounded-2xl bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground transition hover:opacity-90"
            >
              <Save size={18} />
              Cadastrar aluno
            </button>
          </div>
        </div>

        <aside>
          <section className="rounded-3xl border border-border bg-card p-6 shadow-sm">
            <div className="mb-5 flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-muted">
                <Sparkles size={19} />
              </div>

              <div>
                <h2 className="font-semibold text-foreground">
                  Quando usar esta tela
                </h2>
              </div>
            </div>

            <div className="space-y-3 text-sm leading-6 text-muted-foreground">
              <p>
                Use este cadastro direto para alunos que já estudam na escola
                e não precisam passar pelo processo de convite de matrícula
                digital com documentos e pagamento.
              </p>

              <p>
                Depois de cadastrar, você poderá adicionar foto e anexar
                documentos do aluno diretamente no prontuário dele.
              </p>

              <p>
                Para novas matrículas com convite, documentos e pagamento,
                use{" "}
                <Link href="/matriculas/novo" className="font-semibold text-primary">
                  Nova matrícula digital
                </Link>
                .
              </p>
            </div>
          </section>
        </aside>
      </form>
    </AppLayout>
  );
}
