import Link from "next/link";
import { AppLayout } from "@/components/layout/AppLayout";
import { prisma } from "@/lib/prisma";

export default async function AlunosPage() {
  const alunos = await prisma.aluno.findMany({
    orderBy: {
      nome: "asc",
    },
  });

  return (
    <AppLayout>
      <div className="mb-8 flex items-center justify-between">
        <div>
          <p className="text-sm font-bold uppercase tracking-[0.18em] text-[#A17A00]">
            Pessoas
          </p>
          <h1 className="mt-2 text-4xl font-bold">Alunos</h1>
          <p className="mt-2 text-[#807568]">
            Gerencie os alunos cadastrados na escola.
          </p>
        </div>

        <button className="rounded-2xl bg-[#F4B400] px-6 py-4 font-bold text-[#201A14]">
          Novo aluno
        </button>
      </div>

      <div className="rounded-[28px] border border-black/5 bg-white p-6 shadow-sm">
        <div className="mb-6 flex gap-4">
          <input
            className="w-full rounded-2xl border border-black/10 px-4 py-3 outline-none focus:border-[#F4B400]"
            placeholder="Pesquisar aluno..."
          />

          <select className="rounded-2xl border border-black/10 px-4 py-3">
            <option>Todas as turmas</option>
            <option>Maternal</option>
            <option>1º Ano</option>
            <option>2º Ano</option>
            <option>4º Ano</option>
          </select>

          <select className="rounded-2xl border border-black/10 px-4 py-3">
            <option>Todos os status</option>
            <option>Ativo</option>
            <option>Pendente</option>
            <option>Inativo</option>
          </select>
        </div>

        <table className="w-full border-collapse">
          <thead>
            <tr className="border-b text-left text-sm text-[#807568]">
              <th className="py-4">Aluno</th>
              <th>Responsável</th>
              <th>Turma</th>
              <th>Telefone</th>
              <th>Status</th>
              <th></th>
            </tr>
          </thead>

          <tbody>
            {alunos.map((aluno) => (
              <tr key={aluno.id} className="border-b last:border-none">
                <td className="py-5">
                  <div className="flex items-center gap-3">
                    <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#F6F4EF] font-bold">
                      {aluno.nome[0]}
                    </div>
                    <div>
                      <p className="font-bold">{aluno.nome}</p>
                      <p className="text-sm text-[#807568]">Cadastro básico</p>
                    </div>
                  </div>
                </td>

                <td>{aluno.responsavel}</td>
                <td>{aluno.turma}</td>
                <td>{aluno.telefone}</td>

                <td>
                  <span
                    className={`rounded-full px-3 py-1 text-xs font-bold ${
                      aluno.status === "Ativo"
                        ? "bg-green-100 text-green-700"
                        : "bg-yellow-100 text-yellow-800"
                    }`}
                  >
                    {aluno.status}
                  </span>
                </td>

                <td className="text-right">
                  <Link
                    href={`/alunos/${aluno.id}`}
                    className="rounded-xl border border-black/10 px-4 py-2 text-sm font-bold"
                  >
                    Abrir
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </AppLayout>
  );
}