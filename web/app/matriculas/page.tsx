import AppLayout from "@/components/layout/AppLayout";
const matriculas = [
  {
    id: "1",
    aluno: "João Pedro",
    responsavel: "Responsável não informado",
    status: "Em andamento",
    progresso: 65,
    criadoEm: "Hoje",
  },
  {
    id: "2",
    aluno: "Maria Alice",
    responsavel: "Responsável não informado",
    status: "Pronta para aprovação",
    progresso: 100,
    criadoEm: "Ontem",
  },
];

export default function MatriculasPage() {
  return (
    <AppLayout>
      <div className="mb-8 flex items-center justify-between">
        <div>
          <p className="text-sm font-bold uppercase tracking-[0.18em] text-[#A17A00]">
            Secretaria
          </p>
          <h1 className="mt-2 text-4xl font-bold">Centro de Matrículas</h1>
          <p className="mt-2 text-[#807568]">
            Acompanhe novas matrículas, pendências e aprovações.
          </p>
        </div>

        <button className="rounded-2xl bg-[#F4B400] px-6 py-4 font-bold text-[#201A14]">
          Nova matrícula
        </button>
      </div>

      <div className="rounded-[28px] border border-black/5 bg-white p-6 shadow-sm">
        <div className="mb-6 flex gap-4">
          <input
            className="w-full rounded-2xl border border-black/10 px-4 py-3 outline-none focus:border-[#F4B400]"
            placeholder="Pesquisar matrícula..."
          />

          <select className="rounded-2xl border border-black/10 px-4 py-3">
            <option>Todos os status</option>
            <option>Em andamento</option>
            <option>Pronta para aprovação</option>
            <option>Aprovada</option>
            <option>Pendente</option>
          </select>
        </div>

        <div className="space-y-4">
          {matriculas.map((matricula) => {
            const largura = `${matricula.progresso}%`;

            return (
              <div
                key={matricula.id}
                className="flex items-center justify-between rounded-3xl border border-black/5 bg-[#FBFAF7] p-5"
              >
                <div>
                  <p className="text-lg font-bold">{matricula.aluno}</p>
                  <p className="text-sm text-[#807568]">
                    {matricula.responsavel} • Criada: {matricula.criadoEm}
                  </p>
                </div>

                <div className="w-64">
                  <div className="mb-2 flex justify-between text-sm font-bold">
                    <span>{matricula.status}</span>
                    <span>{matricula.progresso}%</span>
                  </div>

                  <div className="h-3 rounded-full bg-black/10">
                    <div
                      className="h-3 rounded-full bg-[#F4B400]"
                      style={{ width: largura }}
                    />
                  </div>
                </div>

                <button className="rounded-xl border border-black/10 px-4 py-2 text-sm font-bold">
                  Abrir
                </button>
              </div>
            );
          })}
        </div>
      </div>
    </AppLayout>
  );
}    