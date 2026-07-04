import AppLayout from "@/components/layout/AppLayout";
import { prisma } from "@/lib/prisma";
import Link from "next/link";

export const dynamic = "force-dynamic";

async function getAlunos() {
  const alunos = await prisma.aluno.findMany({
    orderBy: {
      criadoEm: "desc",
    },
    include: {
      responsavel: true,
      turma: true,
    },
  });

  return alunos;
}

export default async function AlunosPage() {
  const alunos = await getAlunos();

  return (
    <AppLayout>
      <div className="mb-8 flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-sm font-medium text-muted-foreground">
            Centro do Aluno
          </p>

          <h1 className="mt-2 text-4xl font-semibold tracking-tight text-foreground">
            Alunos
          </h1>

          <p className="mt-3 max-w-3xl text-base leading-7 text-muted-foreground">
            Consulte os alunos cadastrados, responsáveis vinculados e
            informações principais da vida escolar.
          </p>
        </div>

        <Link
          href="/alunos/novo"
          className="inline-flex items-center justify-center rounded-2xl bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground transition hover:opacity-90"
        >
          Novo aluno
        </Link>
      </div>

      <div className="rounded-3xl border border-border bg-card p-6 shadow-sm">
        <div className="mb-6">
          <h2 className="text-xl font-semibold text-foreground">
            Alunos cadastrados
          </h2>

          <p className="mt-1 text-sm text-muted-foreground">
            {alunos.length} aluno{alunos.length === 1 ? "" : "s"} encontrado
            {alunos.length === 1 ? "" : "s"}.
          </p>
        </div>

        {alunos.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-border bg-muted/40 p-8 text-center">
            <h3 className="font-semibold text-foreground">
              Nenhum aluno cadastrado ainda.
            </h3>

            <p className="mt-2 text-sm text-muted-foreground">
              Quando os alunos forem criados, eles aparecerão aqui.
            </p>
          </div>
        ) : (
          <div className="overflow-hidden rounded-2xl border border-border">
            <table className="w-full border-collapse bg-card text-left text-sm">
              <thead className="bg-muted/60">
                <tr>
                  <th className="px-5 py-4 font-semibold text-muted-foreground">
                    Aluno
                  </th>
                  <th className="px-5 py-4 font-semibold text-muted-foreground">
                    Responsável
                  </th>
                  <th className="px-5 py-4 font-semibold text-muted-foreground">
                    Turma
                  </th>
                  <th className="px-5 py-4 font-semibold text-muted-foreground">
                    Nascimento
                  </th>
                  <th className="px-5 py-4 font-semibold text-muted-foreground">
                    Cadastro
                  </th>
                </tr>
              </thead>

              <tbody>
                {alunos.map((aluno) => (
                  <tr
                    key={aluno.id}
                    className="border-t border-border transition hover:bg-muted/35"
                  >
                    <td className="px-5 py-4">
                      <div className="font-semibold text-foreground">
                        {aluno.nome}
                      </div>

                      <div className="mt-1 text-xs text-muted-foreground">
                        ID: {aluno.id.slice(0, 8)}
                      </div>
                    </td>

                    <td className="px-5 py-4 text-muted-foreground">
                      {aluno.responsavel.nome}
                    </td>

                    <td className="px-5 py-4 text-muted-foreground">
                      {aluno.turma ? aluno.turma.nome : "Sem turma"}
                    </td>

                    <td className="px-5 py-4 text-muted-foreground">
                      {aluno.dataNascimento.toLocaleDateString("pt-BR")}
                    </td>

                    <td className="px-5 py-4 text-muted-foreground">
                      {aluno.criadoEm.toLocaleDateString("pt-BR")}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </AppLayout>
  );
}