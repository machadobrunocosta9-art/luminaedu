export function StudentProfile() {
  return (
    <div className="space-y-8">
      <div className="rounded-3xl bg-white p-8 shadow-sm">
        <div className="flex items-center gap-6">
          <div className="flex h-24 w-24 items-center justify-center rounded-full bg-[#F4B400] text-3xl font-bold text-[#201A14]">
            D
          </div>

          <div className="flex-1">
            <h1 className="text-4xl font-bold">Dominic</h1>
            <p className="mt-2 text-[#807568]">
              2º Ano • Matrícula 2026001 • Ativo
            </p>
          </div>

          <button className="rounded-2xl bg-[#F4B400] px-6 py-3 font-semibold">
            Editar aluno
          </button>
        </div>
      </div>

      <div className="grid grid-cols-4 gap-6">
        <div className="rounded-3xl bg-white p-6 shadow-sm">
          <p className="text-sm text-[#807568]">Frequência</p>
          <p className="mt-2 text-3xl font-bold">97%</p>
        </div>

        <div className="rounded-3xl bg-white p-6 shadow-sm">
          <p className="text-sm text-[#807568]">Financeiro</p>
          <p className="mt-2 text-3xl font-bold text-green-600">Em dia</p>
        </div>

        <div className="rounded-3xl bg-white p-6 shadow-sm">
          <p className="text-sm text-[#807568]">Documentos</p>
          <p className="mt-2 text-3xl font-bold">8/8</p>
        </div>

        <div className="rounded-3xl bg-white p-6 shadow-sm">
          <p className="text-sm text-[#807568]">IA Atlas</p>
          <button className="mt-4 w-full rounded-2xl bg-[#241D16] py-3 text-white">
            Gerar relatório
          </button>
        </div>
      </div>
    </div>
  );
}