import AppLayout from "@/components/layout/AppLayout";
import InviteActions from "@/components/matriculas/InviteActions";
import PageHeader from "@/components/lumina/PageHeader";
import ProgressBar from "@/components/lumina/ProgressBar";
import SectionCard from "@/components/lumina/SectionCard";
import StatusBadge from "@/components/lumina/StatusBadge";
import { prisma } from "@/lib/prisma";
import {
  ArrowLeft,
  CalendarDays,
  CheckCircle2,
  Clock3,
  GraduationCap,
  Link2,
  Mail,
  Smartphone,
  UserRound,
  UsersRound,
} from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";

export const dynamic = "force-dynamic";

type PageProps = {
  params: Promise<{
    id: string;
  }>;
};

function getStatusInfo(status: string) {
  const statusMap = {
    AGUARDANDO_ENVIO: {
      label: "Aguardando envio",
      tone: "warning" as const,
      progress: 20,
    },
    AGUARDANDO_RESPONSAVEL: {
      label: "Aguardando responsável",
      tone: "warning" as const,
      progress: 30,
    },
    EM_PREENCHIMENTO: {
      label: "Em preenchimento",
      tone: "info" as const,
      progress: 45,
    },
    PREENCHIDO: {
      label: "Preenchido",
      tone: "primary" as const,
      progress: 65,
    },
    CONCLUIDO: {
      label: "Concluído",
      tone: "success" as const,
      progress: 100,
    },
    EXPIRADO: {
      label: "Expirado",
      tone: "danger" as const,
      progress: 0,
    },
    CANCELADO: {
      label: "Cancelado",
      tone: "danger" as const,
      progress: 0,
    },
  };

  return (
    statusMap[
      status as keyof typeof statusMap
    ] ?? {
      label: status,
      tone: "neutral" as const,
      progress: 0,
    }
  );
}

export default async function ConviteMatriculaPage({
  params,
}: PageProps) {
  const { id } = await params;

  const convite =
    await prisma.conviteMatricula.findUnique({
      where: {
        id,
      },
      include: {
        escola: true,
        turma: true,
        matricula: {
          include: {
            aluno: true,
          },
        },
      },
    });

  if (!convite) {
    notFound();
  }

  const agora = new Date();

  if (
    convite.expiraEm <= agora &&
    ![
      "CONCLUIDO",
      "CANCELADO",
      "EXPIRADO",
    ].includes(convite.status)
  ) {
    await prisma.conviteMatricula.update({
      where: {
        id: convite.id,
      },
      data: {
        status: "EXPIRADO",
      },
    });

    convite.status = "EXPIRADO";
  }

  const statusInfo = getStatusInfo(
    convite.status,
  );

  return (
    <AppLayout>
      <PageHeader
        eyebrow="Centro de Matrículas"
        title="Convite de matrícula"
        description="Acompanhe o convite e envie o link seguro ao responsável."
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
              <Link2 size={21} />
            </div>

            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-primary">
                Convite criado
              </p>

              <h2 className="mt-1 text-lg font-semibold text-foreground">
                O link da matrícula está pronto.
              </h2>

              <p className="mt-2 max-w-3xl text-sm leading-6 text-muted-foreground">
                Envie o convite ao responsável para que ele complete
                os dados da família e do aluno.
              </p>
            </div>
          </div>

          <div className="min-w-[220px]">
            <div className="mb-2 flex items-center justify-between gap-3">
              <StatusBadge tone={statusInfo.tone}>
                {statusInfo.label}
              </StatusBadge>

              <span className="text-xs font-semibold text-primary">
                {statusInfo.progress}%
              </span>
            </div>

            <ProgressBar
              value={statusInfo.progress}
              tone={
                convite.status === "CONCLUIDO"
                  ? "success"
                  : convite.status === "EXPIRADO" ||
                      convite.status === "CANCELADO"
                    ? "danger"
                    : "warning"
              }
            />
          </div>
        </div>
      </section>

      <div className="mb-24 grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
        <div className="space-y-6">
          <SectionCard
            title="Enviar convite"
            description="Copie o link ou abra uma mensagem pronta no WhatsApp."
          >
            {convite.status === "EXPIRADO" ? (
              <div className="rounded-3xl border border-red-500/20 bg-red-500/10 p-5">
                <p className="font-semibold text-red-700 dark:text-red-300">
                  Este convite expirou.
                </p>

                <p className="mt-2 text-sm leading-6 text-red-700/80 dark:text-red-300/80">
                  Crie um novo convite para que o responsável continue
                  o processo.
                </p>
              </div>
            ) : convite.status === "CANCELADO" ? (
              <div className="rounded-3xl border border-red-500/20 bg-red-500/10 p-5">
                <p className="font-semibold text-red-700 dark:text-red-300">
                  Este convite foi cancelado.
                </p>
              </div>
            ) : (
              <InviteActions
                token={convite.token}
                nomeAluno={convite.nomeAluno}
                nomeResponsavel={
                  convite.nomeResponsavel
                }
                telefoneResponsavel={
                  convite.telefoneResponsavel
                }
              />
            )}
          </SectionCard>

          <SectionCard
            title="Dados informados pela escola"
            description="Informações utilizadas para iniciar o processo."
          >
            <div className="grid gap-3 md:grid-cols-2">
              <div className="rounded-2xl border border-border bg-background p-4">
                <GraduationCap
                  size={18}
                  className="text-primary"
                />

                <p className="mt-3 text-xs text-muted-foreground">
                  Aluno
                </p>

                <p className="mt-1 font-semibold text-foreground">
                  {convite.nomeAluno}
                </p>
              </div>

              <div className="rounded-2xl border border-border bg-background p-4">
                <UserRound
                  size={18}
                  className="text-primary"
                />

                <p className="mt-3 text-xs text-muted-foreground">
                  Responsável
                </p>

                <p className="mt-1 font-semibold text-foreground">
                  {convite.nomeResponsavel}
                </p>
              </div>

              <div className="rounded-2xl border border-border bg-background p-4">
                <UsersRound
                  size={18}
                  className="text-primary"
                />

                <p className="mt-3 text-xs text-muted-foreground">
                  Turma pretendida
                </p>

                <p className="mt-1 font-semibold text-foreground">
                  {convite.turma?.nome ??
                    "Não informada"}
                </p>
              </div>

              <div className="rounded-2xl border border-border bg-background p-4">
                <CalendarDays
                  size={18}
                  className="text-primary"
                />

                <p className="mt-3 text-xs text-muted-foreground">
                  Ano letivo
                </p>

                <p className="mt-1 font-semibold text-foreground">
                  {convite.anoLetivo}
                </p>
              </div>
            </div>
          </SectionCard>
        </div>

        <div className="space-y-6">
          <SectionCard
            title="Contato do responsável"
            description="Confira antes de enviar o convite."
          >
            <div className="space-y-3">
              <div className="flex items-start gap-3 rounded-2xl border border-border bg-background p-4">
                <Smartphone
                  size={18}
                  className="mt-0.5 shrink-0 text-primary"
                />

                <div>
                  <p className="text-xs text-muted-foreground">
                    WhatsApp
                  </p>

                  <p className="mt-1 font-semibold text-foreground">
                    {convite.telefoneResponsavel}
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3 rounded-2xl border border-border bg-background p-4">
                <Mail
                  size={18}
                  className="mt-0.5 shrink-0 text-primary"
                />

                <div>
                  <p className="text-xs text-muted-foreground">
                    E-mail
                  </p>

                  <p className="mt-1 break-all font-semibold text-foreground">
                    {convite.emailResponsavel ||
                      "Não informado"}
                  </p>
                </div>
              </div>
            </div>
          </SectionCard>

          <SectionCard
            title="Validade"
            description="Prazo disponível para a família preencher."
          >
            <div className="rounded-3xl border border-border bg-background p-5">
              <div className="flex items-start gap-3">
                <Clock3
                  size={20}
                  className="mt-0.5 shrink-0 text-primary"
                />

                <div>
                  <p className="text-sm font-semibold text-foreground">
                    Válido até{" "}
                    {convite.expiraEm.toLocaleDateString(
                      "pt-BR",
                    )}
                  </p>

                  <p className="mt-2 text-xs leading-5 text-muted-foreground">
                    Após essa data, o link será bloqueado e será
                    necessário gerar um novo convite.
                  </p>
                </div>
              </div>
            </div>
          </SectionCard>

          <SectionCard
            title="Próxima etapa"
            description="O que acontecerá após o envio."
          >
            <div className="rounded-3xl border border-primary/15 bg-primary/5 p-5">
              <CheckCircle2
                size={22}
                className="text-primary"
              />

              <p className="mt-3 font-semibold text-foreground">
                Aguardando o responsável
              </p>

              <p className="mt-2 text-sm leading-6 text-muted-foreground">
                Quando o link público for aberto, a Lumina registrará
                a visualização e iniciará o preenchimento.
              </p>
            </div>
          </SectionCard>
        </div>
      </div>
    </AppLayout>
  );
}