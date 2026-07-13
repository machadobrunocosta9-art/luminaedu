import AppLayout from "@/components/layout/AppLayout";
import MetricCard from "@/components/lumina/MetricCard";
import PageHeader from "@/components/lumina/PageHeader";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import {
  AlertTriangle,
  ArrowRight,
  CheckCircle2,
  ClipboardList,
  GraduationCap,
  Plus,
  UserPlus,
  UsersRound,
} from "lucide-react";

export const dynamic = "force-dynamic";

type OccupancyStatus = {
  label: string;
  badgeClassName: string;
  progressClassName: string;
};

function getOccupancyStatus(
  occupancy: number,
  capacity: number,
): OccupancyStatus {
  if (capacity <= 0) {
    return {
      label: "Sem capacidade",
      badgeClassName:
        "border-border bg-muted text-muted-foreground",
      progressClassName: "bg-muted-foreground",
    };
  }

  const percentage = Math.round((occupancy / capacity) * 100);

  if (percentage >= 100) {
    return {
      label: "Lotada",
      badgeClassName:
        "border-red-500/20 bg-red-500/10 text-red-700 dark:text-red-300",
      progressClassName: "bg-red-500",
    };
  }

  if (percentage >= 80) {
    return {
      label: "Quase cheia",
      badgeClassName:
        "border-amber-500/20 bg-amber-500/10 text-amber-700 dark:text-amber-300",
      progressClassName: "bg-amber-500",
    };
  }

  return {
    label: "Com vagas",
    badgeClassName:
      "border-primary/20 bg-primary/10 text-primary",
    progressClassName: "bg-primary",
  };
}

export default async function TurmasPage() {
  const turmas = await prisma.turma.findMany({
    orderBy: {
      nome: "asc",
    },
    include: {
      alunos: {
        orderBy: {
          nome: "asc",
        },
        select: {
          id: true,
          nome: true,
        },
      },
    },
  });

  const capacidadeTotal = turmas.reduce(
    (total, turma) => total + turma.capacidade,
    0,
  );

  const alunosAlocados = turmas.reduce(
    (total, turma) => total + turma.alunos.length,
    0,
  );

  const vagasDisponiveis = Math.max(
    0,
    capacidadeTotal - alunosAlocados,
  );

  const ocupacaoMedia =
    capacidadeTotal > 0
      ? Math.round((alunosAlocados / capacidadeTotal) * 100)
      : 0;

  const turmasEmAtencao = turmas.filter((turma) => {
    if (turma.capacidade <= 0) {
      return true;
    }

    const percentage =
      (turma.alunos.length / turma.capacidade) * 100;

    return percentage >= 80;
  }).length;

  return (
    <AppLayout>
      <PageHeader
        eyebrow="Organização Escolar"
        title="Turmas"
        description="Acompanhe capacidade, ocupação, alunos vinculados, turnos e vagas disponíveis em cada turma."
        action={{
          label: "Nova turma",
          href: "/turmas/novo",
          icon: Plus,
        }}
      />

      <section className="mb-7 grid gap-4 md:grid-cols-2 xl:grid-cols-5">
        <MetricCard
          label="Turmas"
          value={turmas.length}
          description="Cadastradas na escola"
          icon={GraduationCap}
        />

        <MetricCard
          label="Alunos"
          value={alunosAlocados}
          description="Vinculados às turmas"
          icon={UsersRound}
        />

        <MetricCard
          label="Capacidade"
          value={capacidadeTotal}
          description="Vagas totais"
          icon={ClipboardList}
        />

        <MetricCard
          label="Vagas livres"
          value={vagasDisponiveis}
          description="Ainda disponíveis"
          icon={CheckCircle2}
          tone="success"
        />

        <MetricCard
          label="Ocupação"
          value={`${ocupacaoMedia}%`}
          description={`${turmasEmAtencao} turma${
            turmasEmAtencao === 1 ? "" : "s"
          } em atenção`}
          icon={AlertTriangle}
          tone={turmasEmAtencao > 0 ? "warning" : "primary"}
        />
      </section>

      <section className="mb-24 rounded-[2rem] border border-border bg-card p-5 shadow-sm">
        <div className="mb-5 flex flex-wrap items-center justify-between gap-4">
          <div>
            <h2 className="font-semibold text-foreground">
              Turmas cadastradas
            </h2>

            <p className="text-sm text-muted-foreground">
              Visualize ocupação, alunos e ações rápidas.
            </p>
          </div>

          <p className="rounded-full bg-muted px-4 py-2 text-sm font-medium text-muted-foreground">
            Gerenciando {turmas.length} turma
            {turmas.length === 1 ? "" : "s"}
          </p>
        </div>

        {turmas.length === 0 ? (
          <div className="rounded-3xl border border-dashed border-border p-10 text-center">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-3xl bg-primary/10 text-primary">
              <GraduationCap size={27} />
            </div>

            <h3 className="mt-4 font-semibold text-foreground">
              Nenhuma turma cadastrada
            </h3>

            <p className="mt-2 text-sm text-muted-foreground">
              Crie a primeira turma para começar a organizar os alunos.
            </p>

            <Link
              href="/turmas/novo"
              className="mt-5 inline-flex items-center gap-2 rounded-2xl bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground shadow-sm shadow-primary/20 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md active:scale-[0.98]"
            >
              <Plus size={16} />
              Criar primeira turma
            </Link>
          </div>
        ) : (
          <div className="grid gap-4 xl:grid-cols-2">
            {turmas.map((turma) => {
              const occupancy = turma.alunos.length;

              const availablePlaces = Math.max(
                0,
                turma.capacidade - occupancy,
              );

              const occupancyPercentage =
                turma.capacidade > 0
                  ? Math.round(
                      (occupancy / turma.capacidade) * 100,
                    )
                  : 0;

              const progressPercentage = Math.min(
                100,
                Math.max(0, occupancyPercentage),
              );

              const status = getOccupancyStatus(
                occupancy,
                turma.capacidade,
              );

              const visibleStudents = turma.alunos.slice(0, 4);

              const remainingStudents = Math.max(
                0,
                turma.alunos.length - visibleStudents.length,
              );

              return (
                <article
                  key={turma.id}
                  className="group flex min-h-[330px] flex-col rounded-3xl border border-border bg-card p-6 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:border-primary/25 hover:shadow-md"
                >
                  <div className="mb-5 flex items-start justify-between gap-4">
                    <div className="flex min-w-0 items-start gap-3">
                      <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-primary transition-transform duration-200 group-hover:scale-105">
                        <GraduationCap size={23} />
                      </div>

                      <div className="min-w-0">
                        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">
                          {turma.segmento}
                        </p>

                        <h3 className="mt-1 truncate text-xl font-semibold tracking-tight text-foreground">
                          {turma.nome}
                        </h3>

                        <p className="mt-1 text-sm text-muted-foreground">
                          Turno {turma.turno}
                        </p>
                      </div>
                    </div>

                    <span
                      className={`shrink-0 rounded-full border px-3 py-1 text-xs font-semibold ${status.badgeClassName}`}
                    >
                      {status.label}
                    </span>
                  </div>

                  <div className="mb-5 rounded-3xl border border-border bg-background p-4">
                    <div className="mb-3 flex items-center justify-between gap-4">
                      <div>
                        <p className="text-xs font-medium text-muted-foreground">
                          Ocupação da turma
                        </p>

                        <p className="mt-1 text-lg font-semibold text-foreground">
                          {occupancy} de {turma.capacidade} alunos
                        </p>
                      </div>

                      <p className="text-2xl font-semibold tracking-tight text-foreground">
                        {occupancyPercentage}%
                      </p>
                    </div>

                    <div className="h-2 overflow-hidden rounded-full bg-muted">
                      <div
                        className={`h-full rounded-full transition-all duration-500 ${status.progressClassName}`}
                        style={{
                          width: `${progressPercentage}%`,
                        }}
                      />
                    </div>
                  </div>

                  <div className="mb-5 grid grid-cols-3 gap-3">
                    <div className="rounded-2xl border border-border bg-background p-3">
                      <p className="text-xs text-muted-foreground">
                        Capacidade
                      </p>

                      <p className="mt-1 text-xl font-semibold text-foreground">
                        {turma.capacidade}
                      </p>
                    </div>

                    <div className="rounded-2xl border border-border bg-background p-3">
                      <p className="text-xs text-muted-foreground">
                        Alunos
                      </p>

                      <p className="mt-1 text-xl font-semibold text-foreground">
                        {occupancy}
                      </p>
                    </div>

                    <div className="rounded-2xl border border-border bg-background p-3">
                      <p className="text-xs text-muted-foreground">
                        Vagas
                      </p>

                      <p className="mt-1 text-xl font-semibold text-foreground">
                        {availablePlaces}
                      </p>
                    </div>
                  </div>

                  <div className="mb-5">
                    <div className="flex items-center justify-between gap-4">
                      <p className="text-sm font-semibold text-foreground">
                        Alunos vinculados
                      </p>

                      <Link
                        href={`/alunos?turma=${turma.id}`}
                        className="group/action inline-flex items-center gap-1 text-xs font-semibold text-primary"
                      >
                        Ver todos

                        <ArrowRight
                          size={14}
                          className="transition-transform duration-200 group-hover/action:translate-x-1"
                        />
                      </Link>
                    </div>

                    {turma.alunos.length === 0 ? (
                      <div className="mt-3 rounded-2xl border border-dashed border-border p-4">
                        <p className="text-sm text-muted-foreground">
                          Nenhum aluno vinculado a esta turma.
                        </p>
                      </div>
                    ) : (
                      <div className="mt-3 flex flex-wrap gap-2">
                        {visibleStudents.map((student) => (
                          <Link
                            key={student.id}
                            href={`/alunos/${student.id}`}
                            className="rounded-full border border-border bg-background px-3 py-1.5 text-xs font-medium text-foreground transition-all duration-200 hover:border-primary/20 hover:bg-primary/5 hover:text-primary"
                          >
                            {student.nome}
                          </Link>
                        ))}

                        {remainingStudents > 0 && (
                          <span className="rounded-full bg-muted px-3 py-1.5 text-xs font-semibold text-muted-foreground">
                            +{remainingStudents}
                          </span>
                        )}
                      </div>
                    )}
                  </div>

                  <div className="mt-auto flex flex-wrap gap-3 border-t border-border pt-4">
                    <Link
                      href={`/alunos?turma=${turma.id}`}
                      className="group/action inline-flex items-center justify-center gap-2 rounded-2xl border border-border bg-background px-4 py-2.5 text-sm font-semibold text-foreground transition-all duration-200 hover:-translate-y-0.5 hover:bg-muted hover:shadow-sm active:scale-[0.98]"
                    >
                      <UsersRound size={16} />
                      Ver alunos

                      <ArrowRight
                        size={16}
                        className="transition-transform duration-200 group-hover/action:translate-x-1"
                      />
                    </Link>

                    <Link
                      href="/alunos/novo"
                      className="group/action inline-flex items-center justify-center gap-2 rounded-2xl bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground shadow-sm shadow-primary/20 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg hover:shadow-primary/25 active:scale-[0.98]"
                    >
                      <UserPlus
                        size={16}
                        className="transition-transform duration-200 group-hover/action:scale-110"
                      />
                      Novo aluno
                    </Link>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </section>
    </AppLayout>
  );
}