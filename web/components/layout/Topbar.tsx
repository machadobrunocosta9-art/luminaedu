export default function Topbar() {
  return (
    <header className="flex h-20 items-center justify-between border-b border-black/5 bg-white px-8">
      <input
        className="w-[420px] rounded-2xl border border-black/10 bg-[#F8F7F4] px-4 py-3 text-sm outline-none"
        placeholder="Buscar aluno, responsável, turma..."
      />

      <div className="flex items-center gap-4">
        <button className="rounded-2xl border border-black/10 px-4 py-3 text-sm font-semibold">
          Notificações
        </button>

        <div className="text-right">
          <div className="text-sm font-bold">Bruno Machado</div>
          <div className="text-xs text-[#807568]">Administrador</div>
        </div>
      </div>
    </header>
  );
}