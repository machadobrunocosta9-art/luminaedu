import AppLayout from "@/components/layout/AppLayout";
import { prisma } from "@/lib/prisma";
import {
  ArrowRight,
  GraduationCap,
  Plus,
  Search,
  UserRound,
  UsersRound,
} from "lucide-react";
import Link from "next/link";

function formatDate(date?: Date | null) {
  if (!date) return "Não informado";

  return new Intl.DateTimeFormat("pt-BR", {
    timeZone: "UTC",
  }).format(date);
}

export default async function AlunosPage() {
  const alunos = await prisma.aluno.findMany({
    orderBy: {
      criadoEm: "desc",
    },
    include: {
      responsavel: true,
      turma: true,
      matriculas: {
        orderBy: {
          criadoEm: "desc",
        },
        take: 1,
      },
      ocorrencias: true,
      tarefas: true,
    },
  });

  return (
    <AppLayout>
      <div className="mb-8 flex items-start justify-between gap-6">
        <div>
          <p className="text-sm font-medium text-muted-foreground">
            Centro do Aluno
          </p>

          <h1 className="mt-2 text-3xl font-semibold tracking-tight text-foreground">
            Alunos
          </h1>

          <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
            Acesse o prontuário digital de cada aluno, com responsáveis,
            matrícula, financeiro, documentos, ocorrências, comunicação e
            histórico escolar.
          </p>
        </div>

        <Link
          href="/alunos/novo"
          className="inline-flex items-center gap-2 rounded-2xl bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground transition hover:opacity-90"
        >
          <Plus size={18} />
          Novo aluno
        </Link>
      </div>

      <div className="mb-6 grid gap-4 md:grid-cols-4">
        <div className="rounded-3xl border border-border bg-card p-5 shadow-sm">
          <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-2xl bg-muted text-foreground">
            <UserRound size={20} />
          </div>

          <p className="text-sm text-muted-foreground">Total de alunos</p>
          <p className="mt-1 text-3xl font-semibold text-foreground">
            {alunos.length}
          </p>
        </div>

        <div className="rounded-3xl border border-border bg-card p-5 shadow-sm">
          <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-2xl bg-muted text-foreground">
            <GraduationCap size={20} />
          </div>

          <p className="text-sm text-muted-foreground">Com turma</p>
          <p className="mt-1 text-3xl font-semibold text-foreground">
            {alunos.filter((aluno) => aluno.turma).length}
          </p>
        </div>

        <div className="rounded-3xl border border-border bg-card p-5 shadow-sm">
          <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-2xl bg-muted text-foreground">
            <UsersRound size={20} />
          </div>

          <p className="text-sm text-muted-foreground">Responsáveis</p>
          <p className="mt-1 text-3xl font-semibold text-foreground">
            {new Set(alunos.map((aluno) => aluno.responsavelId)).size}
          </p>
        </div>

        <div className="rounded-3xl border border-border bg-card p-5 shadow-sm">
          <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-2xl bg-muted text-foreground">
            <Search size={20} />
          </div>

          <p className="text-sm text-muted-foreground">Prontuários</p>
          <p className="mt-1 text-3xl font-semibold text-foreground">
            {alunos.length}
          </p>
        </div>
      </div>

      <section className="rounded-3xl border border-border bg-card p-6 shadow-sm">
        <div className="mb-5 flex items-center justify-between gap-4">
          <div>
            <h2 className="font-semibold text-foreground">
              Lista de alunos
            </h2>

            <p className="mt-1 text-sm text-muted-foreground">
              Clique em um aluno para abrir o prontuário digital completo.
            </p>
          </div>
        </div>

        {alunos.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-border p-8 text-center">
            <p className="font-medium text-foreground">
              Nenhum aluno cadastrado ainda
            </p>

            <p className="mt-2 text-sm text-muted-foreground">
              Cadastre o primeiro aluno para iniciar o fluxo de matrícula.
            </p>

            <Link
              href="/alunos/novo"
              className="mt-5 inline-flex items-center gap-2 rounded-2xl bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground transition hover:opacity-90"
            >
              <Plus size={18} />
              Cadastrar aluno
            </Link>
          </div>
        ) : (
          <div className="space-y-3">
            {alunos.map((aluno) => {
              const matricula = aluno.matriculas[0];

              return (
                <Link
                  key={aluno.id}
                  href={`/alunos/${aluno.id}`}
                  className="group block rounded-2xl border border-border bg-background p-5 transition hover:-translate-y-0.5 hover:shadow-md"
                >
                  <div className="flex items-center justify-between gap-5">
                    <div className="flex min-w-0 items-center gap-4">
                      <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-muted text-foreground">
                        <UserRound size={22} />
                      </div>

                      <div className="min-w-0">
                        <h3 className="truncate font-semibold text-foreground">
                          {aluno.nome}
                        </h3>

                        <p className="mt-1 text-sm text-muted-foreground">
                          {aluno.turma?.nome ?? "Sem turma"} · Responsável:{" "}
                          {aluno.responsavel.nome}
                        </p>
                      </div>
                    </div>

                    <div className="hidden items-center gap-3 md:flex">
                      <div className="rounded-2xl bg-muted px-4 py-3 text-right">
                        <p className="text-xs font-medium uppercase tracking-[0.16em] text-muted-foreground">
                          Matrícula
                        </p>

                        <p className="mt-1 text-sm font-medium text-foreground">
                          {matricula ? matricula.status : "Sem matrícula"}
                        </p>
                      </div>

                      <div className="rounded-2xl bg-muted px-4 py-3 text-right">
                        <p className="text-xs font-medium uppercase tracking-[0.16em] text-muted-foreground">
                          Nascimento
                        </p>

                        <p className="mt-1 text-sm font-medium text-foreground">
                          {formatDate(aluno.dataNascimento)}
                        </p>
                      </div>

                      <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-muted text-muted-foreground transition group-hover:bg-primary group-hover:text-primary-foreground">
                        <ArrowRight size={18} />
                      </div>
                    </div>
                  </div>

                  <div className="mt-4 grid gap-3 md:grid-cols-3">
                    <div className="rounded-2xl bg-muted p-3">
                      <p className="text-xs text-muted-foreground">
                        Ocorrências
                      </p>
                      <p className="mt-1 font-semibold text-foreground">
                        {aluno.ocorrencias.length}
                      </p>
                    </div>

                    <div className="rounded-2xl bg-muted p-3">
                      <p className="text-xs text-muted-foreground">
                        Pulse vinculado
                      </p>
                      <p className="mt-1 font-semibold text-foreground">
                        {aluno.tarefas.length}
                      </p>
                    </div>

                    <div className="rounded-2xl bg-muted p-3">
                      <p className="text-xs text-muted-foreground">
                        E-mail do responsável
                      </p>
                      <p className="mt-1 truncate font-semibold text-foreground">
                        {aluno.responsavel.email || "Não informado"}
                      </p>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </section>
    </AppLayout>
  );
}
