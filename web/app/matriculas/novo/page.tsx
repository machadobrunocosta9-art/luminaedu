import AppLayout from "@/components/layout/AppLayout";
import PageHeader from "@/components/lumina/PageHeader";
import ProgressBar from "@/components/lumina/ProgressBar";
import SectionCard from "@/components/lumina/SectionCard";
import StatusBadge from "@/components/lumina/StatusBadge";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { redirect } from "next/navigation";
import {
  ArrowLeft,
  CheckCircle2,
  ClipboardList,
  FileCheck2,
  GraduationCap,
  Save,
  UserRound,
  UsersRound,
  WalletCards,
} from "lucide-react";

export const dynamic = "force-dynamic";

function getString(formData: FormData, key: string) {
  const value = formData.get(key);

  if (typeof value !== "string") {
    return "";
  }

  return value.trim();
}

async function criarMatricula(formData: FormData) {
  "use server";

  const nomeAluno = getString(formData, "nomeAluno");
  const dataNascimento = getString(formData, "dataNascimento");
  const sexo = getString(formData, "sexo");
  const turmaId = getString(formData, "turmaId");
  const alergias = getString(formData, "alergias");
  const observacoes = getString(formData, "observacoes");

  const nomeResponsavel = getString(
    formData,
    "nomeResponsavel",
  );

  const telefoneResponsavel = getString(
    formData,
    "telefoneResponsavel",
  );

  const emailResponsavel = getString(
    formData,
    "emailResponsavel",
  );

  const cpfResponsavel = getString(
    formData,
    "cpfResponsavel",
  );

  const profissaoResponsavel = getString(
    formData,
    "profissaoResponsavel",
  );

  const enderecoResponsavel = getString(
    formData,
    "enderecoResponsavel",
  );

  const anoLetivoTexto = getString(
    formData,
    "anoLetivo",
  );

  const anoLetivo = Number(anoLetivoTexto);

  if (
    !nomeAluno ||
    !dataNascimento ||
    !nomeResponsavel ||
    !telefoneResponsavel ||
    !turmaId ||
    !anoLetivoTexto ||
    Number.isNaN(anoLetivo)
  ) {
    throw new Error(
      "Preencha corretamente todos os campos obrigatórios.",
    );
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

  const turma = await prisma.turma.findFirst({
    where: {
      id: turmaId,
      escolaId: escola.id,
    },
  });

  if (!turma) {
    throw new Error(
      "A turma selecionada não foi encontrada.",
    );
  }

  if (turma.capacidade <= 0) {
    throw new Error(
      "A turma selecionada não possui capacidade definida.",
    );
  }

  const totalAlunosNaTurma = await prisma.aluno.count({
    where: {
      turmaId: turma.id,
    },
  });

  if (totalAlunosNaTurma >= turma.capacidade) {
    throw new Error(
      "A turma selecionada já atingiu sua capacidade máxima.",
    );
  }

  const responsavel = await prisma.responsavel.create({
    data: {
      nome: nomeResponsavel,
      telefone: telefoneResponsavel,
      email: emailResponsavel || null,
      cpf: cpfResponsavel || null,
      profissao: profissaoResponsavel || null,
      endereco: enderecoResponsavel || null,
      escolaId: escola.id,
    },
  });

  const aluno = await prisma.aluno.create({
    data: {
      nome: nomeAluno,
      dataNascimento: new Date(
        `${dataNascimento}T12:00:00`,
      ),
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
      anoLetivo,
      status: "PENDENTE",
      escolaId: escola.id,
      alunoId: aluno.id,
    },
  });

  await prisma.tarefa.createMany({
    data: [
      {
        titulo: "Analisar dados da matrícula",
        descricao: `Conferir os dados cadastrados na matrícula de ${aluno.nome}.`,
        setor: "Secretaria",
        prioridade: "ALTA",
        escolaId: escola.id,
        alunoId: aluno.id,
        matriculaId: matricula.id,
      },
      {
        titulo: "Conferir documentos da matrícula",
        descricao: `Conferir os documentos obrigatórios de ${aluno.nome}.`,
        setor: "Secretaria",
        prioridade: "ALTA",
        escolaId: escola.id,
        alunoId: aluno.id,
        matriculaId: matricula.id,
      },
      {
        titulo: "Confirmar pagamento da matrícula",
        descricao: `Verificar o pagamento inicial da matrícula de ${aluno.nome}.`,
        setor: "Financeiro",
        prioridade: "MEDIA",
        escolaId: escola.id,
        alunoId: aluno.id,
        matriculaId: matricula.id,
      },
    ],
  });

  redirect("/matriculas");
}

export default async function NovaMatriculaPage() {
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

  const turmas = await prisma.turma.findMany({
    where: {
      escolaId: escola.id,
    },
    orderBy: [
      {
        segmento: "asc",
      },
      {
        nome: "asc",
      },
    ],
    include: {
      _count: {
        select: {
          alunos: true,
        },
      },
    },
  });

  const anoAtual = new Date().getFullYear();

  return (
    <AppLayout>
      <PageHeader
        eyebrow="Centro de Matrículas"
        title="Nova matrícula"
        description="Cadastre o aluno, vincule o responsável e inicie automaticamente o acompanhamento do processo no Pulse."
        secondaryContent={
          <Link
            href="/matriculas"
            className="group inline-flex min-h-11 items-center justify-center gap-2 rounded-2xl border border-border bg-background px-4 py-2.5 text-sm font-semibold text-foreground transition-all duration-200 hover:-translate-y-0.5 hover:bg-muted hover:shadow-sm active:scale-[0.98]"
          >
            <ArrowLeft
              size={16}
              className="transition-transform duration-200 group-hover:-translate-x-1"
            />
            Voltar
          </Link>
        }
      />

      <section className="mb-7 rounded-[2rem] border border-primary/15 bg-primary/5 p-5 shadow-sm">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-start gap-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-3xl bg-primary text-primary-foreground shadow-sm shadow-primary/20">
              <ClipboardList size={21} />
            </div>

            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-primary">
                Processo guiado
              </p>

              <h2 className="mt-1 text-lg font-semibold text-foreground">
                Primeira etapa da matrícula digital
              </h2>

              <p className="mt-2 max-w-3xl text-sm leading-6 text-muted-foreground">
                Ao concluir, a matrícula será criada como pendente e o
                Pulse receberá tarefas automáticas para análise,
                documentos e pagamento.
              </p>
            </div>
          </div>

          <div className="min-w-[220px]">
            <div className="mb-2 flex items-center justify-between gap-3">
              <span className="text-xs font-medium text-muted-foreground">
                Cadastro inicial
              </span>

              <span className="text-xs font-semibold text-primary">
                Etapa 1 de 4
              </span>
            </div>

            <ProgressBar value={25} />
          </div>
        </div>
      </section>

      <form
        action={criarMatricula}
        className="mb-24 grid gap-6 xl:grid-cols-[1.35fr_0.9fr]"
      >
        <div className="space-y-6">
          <SectionCard
            title="Dados do aluno"
            description="Informações pessoais e escolares do novo aluno."
            action={
              <StatusBadge tone="primary">
                <span className="inline-flex items-center gap-1">
                  <GraduationCap size={13} />
                  Etapa obrigatória
                </span>
              </StatusBadge>
            }
          >
            <div className="grid gap-5 md:grid-cols-2">
              <div className="md:col-span-2">
                <label
                  htmlFor="nomeAluno"
                  className="text-sm font-medium text-foreground"
                >
                  Nome completo do aluno *
                </label>

                <input
                  id="nomeAluno"
                  name="nomeAluno"
                  required
                  autoComplete="name"
                  placeholder="Ex.: João Pedro Silva"
                  className="mt-2 h-12 w-full rounded-2xl border border-border bg-background px-4 text-sm text-foreground outline-none transition placeholder:text-muted-foreground focus:border-primary focus:ring-4 focus:ring-primary/10"
                />
              </div>

              <div>
                <label
                  htmlFor="dataNascimento"
                  className="text-sm font-medium text-foreground"
                >
                  Data de nascimento *
                </label>

                <input
                  id="dataNascimento"
                  name="dataNascimento"
                  required
                  type="date"
                  className="mt-2 h-12 w-full rounded-2xl border border-border bg-background px-4 text-sm text-foreground outline-none transition focus:border-primary focus:ring-4 focus:ring-primary/10"
                />
              </div>

              <div>
                <label
                  htmlFor="sexo"
                  className="text-sm font-medium text-foreground"
                >
                  Sexo
                </label>

                <select
                  id="sexo"
                  name="sexo"
                  className="mt-2 h-12 w-full rounded-2xl border border-border bg-background px-4 text-sm text-foreground outline-none transition focus:border-primary focus:ring-4 focus:ring-primary/10"
                >
                  <option value="">Não informado</option>
                  <option value="Feminino">Feminino</option>
                  <option value="Masculino">Masculino</option>
                </select>
              </div>

              <div>
                <label
                  htmlFor="anoLetivo"
                  className="text-sm font-medium text-foreground"
                >
                  Ano letivo *
                </label>

                <select
                  id="anoLetivo"
                  name="anoLetivo"
                  required
                  defaultValue={anoAtual}
                  className="mt-2 h-12 w-full rounded-2xl border border-border bg-background px-4 text-sm text-foreground outline-none transition focus:border-primary focus:ring-4 focus:ring-primary/10"
                >
                  <option value={anoAtual}>
                    {anoAtual}
                  </option>
                  <option value={anoAtual + 1}>
                    {anoAtual + 1}
                  </option>
                </select>
              </div>

              <div>
                <label
                  htmlFor="turmaId"
                  className="text-sm font-medium text-foreground"
                >
                  Turma *
                </label>

                <select
                  id="turmaId"
                  name="turmaId"
                  required
                  defaultValue=""
                  className="mt-2 h-12 w-full rounded-2xl border border-border bg-background px-4 text-sm text-foreground outline-none transition focus:border-primary focus:ring-4 focus:ring-primary/10"
                >
                  <option value="" disabled>
                    Selecione uma turma
                  </option>

                  {turmas.map((turma) => {
                    const vagasDisponiveis = Math.max(
                      0,
                      turma.capacidade -
                        turma._count.alunos,
                    );

                    const lotada =
                      vagasDisponiveis <= 0;

                    return (
                      <option
                        key={turma.id}
                        value={turma.id}
                        disabled={lotada}
                      >
                        {turma.nome} — {turma.turno} —{" "}
                        {lotada
                          ? "Lotada"
                          : `${vagasDisponiveis} vaga${
                              vagasDisponiveis === 1
                                ? ""
                                : "s"
                            }`}
                      </option>
                    );
                  })}
                </select>

                {turmas.length === 0 && (
                  <p className="mt-2 text-xs leading-5 text-red-600">
                    Nenhuma turma está cadastrada. Crie uma turma antes
                    de iniciar a matrícula.
                  </p>
                )}
              </div>

              <div className="md:col-span-2">
                <label
                  htmlFor="alergias"
                  className="text-sm font-medium text-foreground"
                >
                  Alergias ou restrições
                </label>

                <input
                  id="alergias"
                  name="alergias"
                  placeholder="Ex.: Lactose, dipirona, amendoim..."
                  className="mt-2 h-12 w-full rounded-2xl border border-border bg-background px-4 text-sm text-foreground outline-none transition placeholder:text-muted-foreground focus:border-primary focus:ring-4 focus:ring-primary/10"
                />
              </div>

              <div className="md:col-span-2">
                <label
                  htmlFor="observacoes"
                  className="text-sm font-medium text-foreground"
                >
                  Observações
                </label>

                <textarea
                  id="observacoes"
                  name="observacoes"
                  rows={4}
                  placeholder="Registre informações importantes sobre o aluno..."
                  className="mt-2 w-full resize-none rounded-2xl border border-border bg-background px-4 py-3 text-sm text-foreground outline-none transition placeholder:text-muted-foreground focus:border-primary focus:ring-4 focus:ring-primary/10"
                />
              </div>
            </div>
          </SectionCard>

          <SectionCard
            title="Responsável"
            description="Dados de contato da pessoa responsável pelo aluno."
            action={
              <StatusBadge tone="primary">
                <span className="inline-flex items-center gap-1">
                  <UserRound size={13} />
                  Contato principal
                </span>
              </StatusBadge>
            }
          >
            <div className="grid gap-5 md:grid-cols-2">
              <div className="md:col-span-2">
                <label
                  htmlFor="nomeResponsavel"
                  className="text-sm font-medium text-foreground"
                >
                  Nome completo do responsável *
                </label>

                <input
                  id="nomeResponsavel"
                  name="nomeResponsavel"
                  required
                  autoComplete="name"
                  placeholder="Ex.: Maria Silva"
                  className="mt-2 h-12 w-full rounded-2xl border border-border bg-background px-4 text-sm text-foreground outline-none transition placeholder:text-muted-foreground focus:border-primary focus:ring-4 focus:ring-primary/10"
                />
              </div>

              <div>
                <label
                  htmlFor="telefoneResponsavel"
                  className="text-sm font-medium text-foreground"
                >
                  Telefone *
                </label>

                <input
                  id="telefoneResponsavel"
                  name="telefoneResponsavel"
                  required
                  type="tel"
                  autoComplete="tel"
                  placeholder="Ex.: (21) 99999-0000"
                  className="mt-2 h-12 w-full rounded-2xl border border-border bg-background px-4 text-sm text-foreground outline-none transition placeholder:text-muted-foreground focus:border-primary focus:ring-4 focus:ring-primary/10"
                />
              </div>

              <div>
                <label
                  htmlFor="emailResponsavel"
                  className="text-sm font-medium text-foreground"
                >
                  E-mail
                </label>

                <input
                  id="emailResponsavel"
                  name="emailResponsavel"
                  type="email"
                  autoComplete="email"
                  placeholder="Ex.: responsavel@email.com"
                  className="mt-2 h-12 w-full rounded-2xl border border-border bg-background px-4 text-sm text-foreground outline-none transition placeholder:text-muted-foreground focus:border-primary focus:ring-4 focus:ring-primary/10"
                />
              </div>

              <div>
                <label
                  htmlFor="cpfResponsavel"
                  className="text-sm font-medium text-foreground"
                >
                  CPF
                </label>

                <input
                  id="cpfResponsavel"
                  name="cpfResponsavel"
                  inputMode="numeric"
                  placeholder="Ex.: 000.000.000-00"
                  className="mt-2 h-12 w-full rounded-2xl border border-border bg-background px-4 text-sm text-foreground outline-none transition placeholder:text-muted-foreground focus:border-primary focus:ring-4 focus:ring-primary/10"
                />
              </div>

              <div>
                <label
                  htmlFor="profissaoResponsavel"
                  className="text-sm font-medium text-foreground"
                >
                  Profissão
                </label>

                <input
                  id="profissaoResponsavel"
                  name="profissaoResponsavel"
                  placeholder="Ex.: Professora"
                  className="mt-2 h-12 w-full rounded-2xl border border-border bg-background px-4 text-sm text-foreground outline-none transition placeholder:text-muted-foreground focus:border-primary focus:ring-4 focus:ring-primary/10"
                />
              </div>

              <div className="md:col-span-2">
                <label
                  htmlFor="enderecoResponsavel"
                  className="text-sm font-medium text-foreground"
                >
                  Endereço
                </label>

                <input
                  id="enderecoResponsavel"
                  name="enderecoResponsavel"
                  autoComplete="street-address"
                  placeholder="Rua, número, complemento e bairro"
                  className="mt-2 h-12 w-full rounded-2xl border border-border bg-background px-4 text-sm text-foreground outline-none transition placeholder:text-muted-foreground focus:border-primary focus:ring-4 focus:ring-primary/10"
                />
              </div>
            </div>
          </SectionCard>
        </div>

        <div className="space-y-6">
          <SectionCard
            title="Resumo do processo"
            description="O que será criado ao concluir o cadastro."
          >
            <div className="space-y-3">
              <div className="flex items-start gap-3 rounded-2xl border border-border bg-background p-4">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                  <GraduationCap size={18} />
                </div>

                <div>
                  <p className="text-sm font-semibold text-foreground">
                    Aluno e responsável
                  </p>

                  <p className="mt-1 text-xs leading-5 text-muted-foreground">
                    Os dois cadastros serão vinculados automaticamente.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3 rounded-2xl border border-border bg-background p-4">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                  <UsersRound size={18} />
                </div>

                <div>
                  <p className="text-sm font-semibold text-foreground">
                    Vínculo com a turma
                  </p>

                  <p className="mt-1 text-xs leading-5 text-muted-foreground">
                    O aluno será inserido na turma escolhida.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3 rounded-2xl border border-border bg-background p-4">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                  <FileCheck2 size={18} />
                </div>

                <div>
                  <p className="text-sm font-semibold text-foreground">
                    Conferência documental
                  </p>

                  <p className="mt-1 text-xs leading-5 text-muted-foreground">
                    O Pulse criará uma tarefa para a Secretaria.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3 rounded-2xl border border-border bg-background p-4">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                  <WalletCards size={18} />
                </div>

                <div>
                  <p className="text-sm font-semibold text-foreground">
                    Confirmação financeira
                  </p>

                  <p className="mt-1 text-xs leading-5 text-muted-foreground">
                    O Financeiro receberá uma tarefa para confirmar o
                    pagamento.
                  </p>
                </div>
              </div>
            </div>
          </SectionCard>

          <SectionCard
            title="Situação inicial"
            description="A matrícula começará aguardando análise."
          >
            <div className="rounded-3xl border border-border bg-background p-4">
              <div className="flex items-center justify-between gap-4">
                <StatusBadge tone="warning">
                  Pendente
                </StatusBadge>

                <span className="text-sm font-semibold text-foreground">
                  15%
                </span>
              </div>

              <ProgressBar
                value={15}
                tone="warning"
                className="mt-4"
              />

              <p className="mt-3 text-xs leading-5 text-muted-foreground">
                Depois do cadastro, a Secretaria poderá analisar os dados
                e atualizar a etapa do processo.
              </p>
            </div>
          </SectionCard>

          <div className="sticky bottom-5 rounded-[2rem] border border-border bg-card/95 p-5 shadow-xl backdrop-blur">
            <div className="mb-4 flex items-start gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                <CheckCircle2 size={18} />
              </div>

              <div>
                <p className="text-sm font-semibold text-foreground">
                  Pronto para iniciar
                </p>

                <p className="mt-1 text-xs leading-5 text-muted-foreground">
                  Revise os campos obrigatórios antes de concluir.
                </p>
              </div>
            </div>

            <div className="flex flex-col gap-3">
              <button
                type="submit"
                disabled={turmas.length === 0}
                className="group inline-flex min-h-12 items-center justify-center gap-2 rounded-2xl bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground shadow-sm shadow-primary/20 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg hover:shadow-primary/25 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:translate-y-0 disabled:hover:shadow-sm"
              >
                <Save
                  size={17}
                  className="transition-transform duration-200 group-hover:scale-110"
                />
                Criar matrícula
              </button>

              <Link
                href="/matriculas"
                className="inline-flex min-h-12 items-center justify-center rounded-2xl border border-border bg-background px-5 py-3 text-sm font-semibold text-foreground transition-all duration-200 hover:bg-muted active:scale-[0.98]"
              >
                Cancelar
              </Link>
            </div>
          </div>
        </div>
      </form>
    </AppLayout>
  );
}