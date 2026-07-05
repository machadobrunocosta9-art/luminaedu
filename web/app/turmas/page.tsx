import AppLayout from "@/components/layout/AppLayout";
import { prisma } from "@/lib/prisma";
import Link from "next/link";

export const dynamic = "force-dynamic";

async function getTurmas() {
  const turmas = await prisma.turma.findMany({
    orderBy: {
      criadoEm: "desc",
    },
    include: {
      alunos: true,
    },
  });

  return turmas;
}

export default async function TurmasPage() {
  const turmas = await getTurmas();

  const capacidadeTotal = turmas.reduce(
    (total, turma) => total + turma.capacidade,
    0
  );

  const alunosAlocados = turmas.reduce(
    (total, turma) => total + turma.alunos.length,
    0
  );

  const vagasDisponiveis = capacidadeTotal - alunosAlocados;

  return (
    <AppLayout>
      <div className="mb-8 flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-sm font-medium text-muted-foreground">
            Organização Escolar
          </p>

          <h1 className="mt-2 text-4xl font-semibold tracking-tight text-foreground">
            Turmas
          </h1>

          <p className="mt-3 max-w-3xl text-base leading-7 text-muted-foreground">
            Gerencie turmas, turnos, capacidade e alunos vinculados.
          </p>
        </div>

        <Link
          href="/turmas/novo"
          className="inline-flex items-center justify-center rounded-2xl bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground transition hover:opacity-90"
        >
          Nova turma
        </Link>
      </div>

      <div className="mb-6 grid grid-cols-1 gap-5 md:grid-cols-4">
        <div className="rounded-3xl border border-border bg-card p-6 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">
            Turmas
          </p>

          <div className="mt-4 text-4xl font-semibold text-foreground">
            {turmas.length}
          </div>

          <p className="mt-2 text-sm text-muted-foreground">
            cadastradas na escola
          </p>
        </div>

        <div className="rounded-3xl border border-border bg-card p-6 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">
            Capacidade
          </p>

          <div className="mt-4 text-4xl font-semibold text-foreground">
            {capacidadeTotal}
          </div>

          <p className="mt-2 text-sm text-muted-foreground">
            vagas totais disponíveis
          </p>
        </div>

        <div className="rounded-3xl border border-border bg-card p-6 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">
            Alunos
          </p>

          <div className="mt-4 text-4xl font-semibold text-foreground">
            {alunosAlocados}
          </div>

          <p className="mt-2 text-sm text-muted-foreground">
            vinculados às turmas
          </p>
        </div>

        <div className="rounded-3xl border border-border bg-card p-6 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">
            Vagas livres
          </p>

          <div className="mt-4 text-4xl font-semibold text-foreground">
            {vagasDisponiveis}
          </div>

          <p className="mt-2 text-sm text-muted-foreground">
            ainda disponíveis
          </p>
        </div>
      </div>

      <div className="rounded-3xl border border-border bg-card p-6 shadow-sm">
        <div className="mb-6">
          <h2 className="text-xl font-semibold text-foreground">
            Turmas cadastradas
          </h2>

          <p className="mt-1 text-sm text-muted-foreground">
            {turmas.length} turma{turmas.length === 1 ? "" : "s"} encontrada
            {turmas.length === 1 ? "" : "s"}.
          </p>
        </div>

        {turmas.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-border bg-muted/40 p-8 text-center">
            <h3 className="font-semibold text-foreground">
              Nenhuma turma cadastrada ainda.
            </h3>

            <p className="mt-2 text-sm text-muted-foreground">
              Crie a primeira turma para organizar os alunos.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
            {turmas.map((turma) => {
              const ocupacao = turma.alunos.length;
              const vagas = turma.capacidade - ocupacao;

              return (
                <div
                  key={turma.id}
                  className="rounded-3xl border border-border bg-background p-5 transition hover:border-primary/30 hover:bg-primary/5"
                >
                  <div className="mb-4 flex items-start justify-between gap-4">
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                        {turma.segmento}
                      </p>

                      <h3 className="mt-1 text-lg font-semibold text-foreground">
                        {turma.nome}
                      </h3>
                    </div>

                    <span className="rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
                      {turma.turno}
                    </span>
                  </div>

                  <div className="grid grid-cols-3 gap-3">
                    <div className="rounded-2xl bg-muted/50 p-4">
                      <p className="text-xs text-muted-foreground">
                        Capacidade
                      </p>

                      <p className="mt-1 text-xl font-semibold text-foreground">
                        {turma.capacidade}
                      </p>
                    </div>

                    <div className="rounded-2xl bg-muted/50 p-4">
                      <p className="text-xs text-muted-foreground">Alunos</p>

                      <p className="mt-1 text-xl font-semibold text-foreground">
                        {ocupacao}
                      </p>
                    </div>

                    <div className="rounded-2xl bg-muted/50 p-4">
                      <p className="text-xs text-muted-foreground">Vagas</p>

                      <p className="mt-1 text-xl font-semibold text-foreground">
                        {vagas}
                      </p>
                    </div>
                  </div>

                  <div className="mt-5">
                    <p className="text-sm font-medium text-foreground">
                      Alunos vinculados
                    </p>

                    {turma.alunos.length === 0 ? (
                      <p className="mt-2 text-sm text-muted-foreground">
                        Nenhum aluno vinculado a esta turma.
                      </p>
                    ) : (
                      <div className="mt-3 flex flex-wrap gap-2">
                        {turma.alunos.map((aluno) => (
                          <span
                            key={aluno.id}
                            className="rounded-full bg-muted px-3 py-1 text-xs font-medium text-muted-foreground"
                          >
                            {aluno.nome}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </AppLayout>
  );
}

