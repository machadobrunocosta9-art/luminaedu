import AppLayout from "@/components/layout/AppLayout";
import { prisma } from "@/lib/prisma";
import Link from "next/link";

export const dynamic = "force-dynamic";

async function getResponsaveis() {
  const responsaveis = await prisma.responsavel.findMany({
    orderBy: {
      criadoEm: "desc",
    },
    include: {
      alunos: true,
    },
  });

  return responsaveis;
}

export default async function ResponsaveisPage() {
  const responsaveis = await getResponsaveis();

  const comEmail = responsaveis.filter((responsavel) => responsavel.email).length;

  const semEmail = responsaveis.filter(
    (responsavel) => !responsavel.email
  ).length;

  const alunosVinculados = responsaveis.reduce(
    (total, responsavel) => total + responsavel.alunos.length,
    0
  );

  return (
    <AppLayout>
      <div className="mb-8 flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-sm font-medium text-muted-foreground">
            Centro do Responsável
          </p>

          <h1 className="mt-2 text-4xl font-semibold tracking-tight text-foreground">
            Responsáveis
          </h1>

          <p className="mt-3 max-w-3xl text-base leading-7 text-muted-foreground">
            Consulte responsáveis cadastrados, contatos principais e alunos
            vinculados.
          </p>
        </div>

        <Link
          href="/alunos/novo"
          className="inline-flex items-center justify-center rounded-2xl bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground transition hover:opacity-90"
        >
          Novo cadastro
        </Link>
      </div>

      <div className="mb-6 grid grid-cols-1 gap-5 md:grid-cols-4">
        <div className="rounded-3xl border border-border bg-card p-6 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">
            Responsáveis
          </p>

          <div className="mt-4 text-4xl font-semibold text-foreground">
            {responsaveis.length}
          </div>

          <p className="mt-2 text-sm text-muted-foreground">
            cadastrados na escola
          </p>
        </div>

        <div className="rounded-3xl border border-border bg-card p-6 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">
            Alunos
          </p>

          <div className="mt-4 text-4xl font-semibold text-foreground">
            {alunosVinculados}
          </div>

          <p className="mt-2 text-sm text-muted-foreground">
            vinculados aos responsáveis
          </p>
        </div>

        <div className="rounded-3xl border border-border bg-card p-6 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">
            Com e-mail
          </p>

          <div className="mt-4 text-4xl font-semibold text-foreground">
            {comEmail}
          </div>

          <p className="mt-2 text-sm text-muted-foreground">
            contatos completos
          </p>
        </div>

        <div className="rounded-3xl border border-border bg-card p-6 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">
            Sem e-mail
          </p>

          <div className="mt-4 text-4xl font-semibold text-foreground">
            {semEmail}
          </div>

          <p className="mt-2 text-sm text-muted-foreground">
            precisam de atualização
          </p>
        </div>
      </div>

      <div className="rounded-3xl border border-border bg-card p-6 shadow-sm">
        <div className="mb-6">
          <h2 className="text-xl font-semibold text-foreground">
            Responsáveis cadastrados
          </h2>

          <p className="mt-1 text-sm text-muted-foreground">
            {responsaveis.length} responsável
            {responsaveis.length === 1 ? "" : "eis"} encontrado
            {responsaveis.length === 1 ? "" : "s"}.
          </p>
        </div>

        {responsaveis.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-border bg-muted/40 p-8 text-center">
            <h3 className="font-semibold text-foreground">
              Nenhum responsável cadastrado ainda.
            </h3>

            <p className="mt-2 text-sm text-muted-foreground">
              Quando um aluno for cadastrado com responsável, ele aparecerá
              aqui.
            </p>
          </div>
        ) : (
          <div className="overflow-hidden rounded-2xl border border-border">
            <table className="w-full border-collapse bg-card text-left text-sm">
              <thead className="bg-muted/60">
                <tr>
                  <th className="px-5 py-4 font-semibold text-muted-foreground">
                    Responsável
                  </th>

                  <th className="px-5 py-4 font-semibold text-muted-foreground">
                    Telefone
                  </th>

                  <th className="px-5 py-4 font-semibold text-muted-foreground">
                    E-mail
                  </th>

                  <th className="px-5 py-4 font-semibold text-muted-foreground">
                    Alunos vinculados
                  </th>

                  <th className="px-5 py-4 font-semibold text-muted-foreground">
                    Cadastro
                  </th>
                </tr>
              </thead>

              <tbody>
                {responsaveis.map((responsavel) => (
                  <tr
                    key={responsavel.id}
                    className="border-t border-border transition hover:bg-muted/35"
                  >
                    <td className="px-5 py-4">
                      <div className="font-semibold text-foreground">
                        {responsavel.nome}
                      </div>

                      <div className="mt-1 text-xs text-muted-foreground">
                        CPF: {responsavel.cpf || "Não informado"}
                      </div>
                    </td>

                    <td className="px-5 py-4 text-muted-foreground">
                      {responsavel.telefone}
                    </td>

                    <td className="px-5 py-4 text-muted-foreground">
                      {responsavel.email || "Sem e-mail"}
                    </td>

                    <td className="px-5 py-4">
                      {responsavel.alunos.length === 0 ? (
                        <span className="text-muted-foreground">
                          Nenhum aluno
                        </span>
                      ) : (
                        <div className="flex flex-col gap-1">
                          {responsavel.alunos.map((aluno) => (
                            <span
                              key={aluno.id}
                              className="font-medium text-foreground"
                            >
                              {aluno.nome}
                            </span>
                          ))}
                        </div>
                      )}
                    </td>

                    <td className="px-5 py-4 text-muted-foreground">
                      {responsavel.criadoEm.toLocaleDateString("pt-BR")}
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

