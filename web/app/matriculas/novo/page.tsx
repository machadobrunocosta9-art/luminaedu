import AppLayout from "@/components/layout/AppLayout";
import PageHeader from "@/components/lumina/PageHeader";
import ProgressBar from "@/components/lumina/ProgressBar";
import SectionCard from "@/components/lumina/SectionCard";
import StatusBadge from "@/components/lumina/StatusBadge";
import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { randomBytes } from "crypto";
import {
  ArrowLeft,
  CalendarDays,
  CheckCircle2,
  ClipboardList,
  GraduationCap,
  Link2,
  Mail,
  Save,
  Send,
  Smartphone,
  UserRound,
  UsersRound,
} from "lucide-react";
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

function gerarTokenSeguro() {
  return randomBytes(32).toString("hex");
}

async function criarConviteMatricula(formData: FormData) {
  "use server";

  await requireAdmin();

  const nomeAluno = getString(formData, "nomeAluno");
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
  const turmaId = getString(formData, "turmaId");
  const anoLetivoTexto = getString(
    formData,
    "anoLetivo",
  );

  const anoLetivo = Number(anoLetivoTexto);

  if (
    !nomeAluno ||
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

  const [alunosNaTurma, convitesEmAndamento] =
    await Promise.all([
      prisma.aluno.count({
        where: {
          turmaId: turma.id,
        },
      }),

      prisma.conviteMatricula.count({
        where: {
          turmaId: turma.id,
          status: {
            in: [
              "AGUARDANDO_ENVIO",
              "AGUARDANDO_RESPONSAVEL",
              "EM_PREENCHIMENTO",
              "PREENCHIDO",
            ],
          },
          expiraEm: {
            gt: new Date(),
          },
        },
      }),
    ]);

  const ocupacaoProjetada =
    alunosNaTurma + convitesEmAndamento;

  if (ocupacaoProjetada >= turma.capacidade) {
    throw new Error(
      "A turma selecionada não possui vagas disponíveis.",
    );
  }

  let token = gerarTokenSeguro();

  while (
    await prisma.conviteMatricula.findUnique({
      where: {
        token,
      },
      select: {
        id: true,
      },
    })
  ) {
    token = gerarTokenSeguro();
  }

  const expiraEm = new Date();
  expiraEm.setDate(expiraEm.getDate() + 7);

  const convite = await prisma.conviteMatricula.create({
    data: {
      token,
      status: "AGUARDANDO_ENVIO",
      nomeAluno,
      nomeResponsavel,
      telefoneResponsavel,
      emailResponsavel: emailResponsavel || null,
      anoLetivo,
      expiraEm,
      escolaId: escola.id,
      turmaId: turma.id,
    },
  });

  redirect(`/matriculas/convites/${convite.id}`);
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
          convitesMatricula: {
            where: {
              status: {
                in: [
                  "AGUARDANDO_ENVIO",
                  "AGUARDANDO_RESPONSAVEL",
                  "EM_PREENCHIMENTO",
                  "PREENCHIDO",
                ],
              },
              expiraEm: {
                gt: new Date(),
              },
            },
          },
        },
      },
    },
  });

  const anoAtual = new Date().getFullYear();

  const possuiTurmaComVaga = turmas.some((turma) => {
    const ocupacaoProjetada =
      turma._count.alunos +
      turma._count.convitesMatricula;

    return ocupacaoProjetada < turma.capacidade;
  });

  return (
    <AppLayout>
      <PageHeader
        eyebrow="Centro de Matrículas"
        title="Iniciar matrícula"
        description="Informe apenas os dados básicos. A Lumina gerará um link seguro para o responsável completar o processo."
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
                Início pela secretaria
              </p>

              <h2 className="mt-1 text-lg font-semibold text-foreground">
                A escola inicia. A família completa.
              </h2>

              <p className="mt-2 max-w-3xl text-sm leading-6 text-muted-foreground">
                Depois de gerar o convite, envie o link ao responsável.
                Nenhum cadastro definitivo será criado antes da conclusão
                do formulário público.
              </p>
            </div>
          </div>

          <div className="min-w-[220px]">
            <div className="mb-2 flex items-center justify-between gap-3">
              <span className="text-xs font-medium text-muted-foreground">
                Início do processo
              </span>

              <span className="text-xs font-semibold text-primary">
                Etapa 1 de 5
              </span>
            </div>

            <ProgressBar value={20} />
          </div>
        </div>
      </section>

      <form
        action={criarConviteMatricula}
        className="mb-24 grid gap-6 xl:grid-cols-[1.25fr_0.75fr]"
      >
        <div className="space-y-6">
          <SectionCard
            title="Informações básicas"
            description="Dados necessários para identificar e enviar o convite."
            action={
              <StatusBadge tone="primary">
                <span className="inline-flex items-center gap-1">
                  <GraduationCap size={13} />
                  Secretaria
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
                  Nome do aluno *
                </label>

                <input
                  id="nomeAluno"
                  name="nomeAluno"
                  required
                  autoComplete="off"
                  placeholder="Ex.: João Pedro Silva"
                  className="mt-2 h-12 w-full rounded-2xl border border-border bg-background px-4 text-sm text-foreground outline-none transition placeholder:text-muted-foreground focus:border-primary focus:ring-4 focus:ring-primary/10"
                />
              </div>

              <div className="md:col-span-2">
                <label
                  htmlFor="nomeResponsavel"
                  className="text-sm font-medium text-foreground"
                >
                  Nome do responsável *
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
                  WhatsApp do responsável *
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
                  Turma pretendida *
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
                    const ocupacaoProjetada =
                      turma._count.alunos +
                      turma._count.convitesMatricula;

                    const vagasDisponiveis = Math.max(
                      0,
                      turma.capacidade - ocupacaoProjetada,
                    );

                    const lotada = vagasDisponiveis <= 0;

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
                              vagasDisponiveis === 1 ? "" : "s"
                            }`}
                      </option>
                    );
                  })}
                </select>
              </div>
            </div>

            {!possuiTurmaComVaga && (
              <div className="mt-5 rounded-2xl border border-red-500/20 bg-red-500/10 p-4">
                <p className="text-sm font-semibold text-red-700 dark:text-red-300">
                  Nenhuma turma possui vaga disponível.
                </p>

                <p className="mt-1 text-xs leading-5 text-red-700/80 dark:text-red-300/80">
                  Crie uma nova turma ou ajuste a capacidade antes de
                  iniciar outro convite.
                </p>
              </div>
            )}
          </SectionCard>

          <SectionCard
            title="Como funcionará"
            description="Após a criação, o processo seguirá estas etapas."
          >
            <div className="grid gap-3 md:grid-cols-2">
              <div className="flex items-start gap-3 rounded-2xl border border-border bg-background p-4">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                  <Link2 size={18} />
                </div>

                <div>
                  <p className="text-sm font-semibold text-foreground">
                    Link seguro
                  </p>

                  <p className="mt-1 text-xs leading-5 text-muted-foreground">
                    A Lumina gera um convite exclusivo com validade de
                    sete dias.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3 rounded-2xl border border-border bg-background p-4">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                  <UserRound size={18} />
                </div>

                <div>
                  <p className="text-sm font-semibold text-foreground">
                    Família preenche
                  </p>

                  <p className="mt-1 text-xs leading-5 text-muted-foreground">
                    O responsável completará os dados pessoais e
                    escolares.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3 rounded-2xl border border-border bg-background p-4">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                  <UsersRound size={18} />
                </div>

                <div>
                  <p className="text-sm font-semibold text-foreground">
                    Cadastro definitivo
                  </p>

                  <p className="mt-1 text-xs leading-5 text-muted-foreground">
                    Aluno e responsável só serão criados após a
                    conclusão.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3 rounded-2xl border border-border bg-background p-4">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                  <CheckCircle2 size={18} />
                </div>

                <div>
                  <p className="text-sm font-semibold text-foreground">
                    Análise da escola
                  </p>

                  <p className="mt-1 text-xs leading-5 text-muted-foreground">
                    A Secretaria receberá o processo para conferência.
                  </p>
                </div>
              </div>
            </div>
          </SectionCard>
        </div>

        <div className="space-y-6">
          <SectionCard
            title="Resumo do convite"
            description="O que será gerado ao concluir esta etapa."
          >
            <div className="space-y-3">
              <div className="flex items-start gap-3 rounded-2xl border border-border bg-background p-4">
                <Smartphone
                  size={18}
                  className="mt-0.5 shrink-0 text-primary"
                />

                <div>
                  <p className="text-sm font-semibold text-foreground">
                    Envio por WhatsApp
                  </p>

                  <p className="mt-1 text-xs leading-5 text-muted-foreground">
                    O link poderá ser enviado diretamente ao número
                    informado.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3 rounded-2xl border border-border bg-background p-4">
                <Mail
                  size={18}
                  className="mt-0.5 shrink-0 text-primary"
                />

                <div>
                  <p className="text-sm font-semibold text-foreground">
                    Envio por e-mail
                  </p>

                  <p className="mt-1 text-xs leading-5 text-muted-foreground">
                    O e-mail será opcional nesta primeira versão.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3 rounded-2xl border border-border bg-background p-4">
                <CalendarDays
                  size={18}
                  className="mt-0.5 shrink-0 text-primary"
                />

                <div>
                  <p className="text-sm font-semibold text-foreground">
                    Validade de sete dias
                  </p>

                  <p className="mt-1 text-xs leading-5 text-muted-foreground">
                    Convites vencidos não poderão ser utilizados.
                  </p>
                </div>
              </div>
            </div>
          </SectionCard>

          <SectionCard
            title="Situação inicial"
            description="O convite começará aguardando envio."
          >
            <div className="rounded-3xl border border-border bg-background p-4">
              <div className="flex items-center justify-between gap-4">
                <StatusBadge tone="warning">
                  Aguardando envio
                </StatusBadge>

                <span className="text-sm font-semibold text-foreground">
                  20%
                </span>
              </div>

              <ProgressBar
                value={20}
                tone="warning"
                className="mt-4"
              />

              <p className="mt-3 text-xs leading-5 text-muted-foreground">
                Depois de gerar o link, envie-o ao responsável para
                continuar o processo.
              </p>
            </div>
          </SectionCard>

          <div className="sticky bottom-5 rounded-[2rem] border border-border bg-card/95 p-5 shadow-xl backdrop-blur">
            <div className="mb-4 flex items-start gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                <Send size={18} />
              </div>

              <div>
                <p className="text-sm font-semibold text-foreground">
                  Gerar convite
                </p>

                <p className="mt-1 text-xs leading-5 text-muted-foreground">
                  Confira o telefone antes de continuar.
                </p>
              </div>
            </div>

            <div className="flex flex-col gap-3">
              <button
                type="submit"
                disabled={!possuiTurmaComVaga}
                className="group inline-flex min-h-12 items-center justify-center gap-2 rounded-2xl bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground shadow-sm shadow-primary/20 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg hover:shadow-primary/25 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:translate-y-0 disabled:hover:shadow-sm"
              >
                <Save
                  size={17}
                  className="transition-transform duration-200 group-hover:scale-110"
                />
                Gerar link da matrícula
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
