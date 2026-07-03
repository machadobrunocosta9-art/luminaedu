const groups = [
  {
    title: "Principal",
    items: ["Dashboard", "Matrículas", "Alunos", "Responsáveis", "Turmas"],
  },
  {
    title: "Operação",
    items: ["Acadêmico", "Financeiro", "Comunicação", "Documentos", "Relatórios"],
  },
  {
    title: "Inteligência",
    items: ["Lumi"],
  },
];

export default function Sidebar() {
  return (
    <aside className="flex min-h-screen w-72 flex-col border-r border-white/10 bg-[#21183F] px-5 py-6 text-white">
      <div className="mb-9">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/10 text-sm font-semibold text-white ring-1 ring-white/10">
            L
          </div>

          <div>
            <div className="text-lg font-semibold tracking-tight">Lumina</div>
            <div className="mt-0.5 text-xs text-white/45">
              Gestão escolar premium
            </div>
          </div>
        </div>
      </div>

      <nav className="flex-1 space-y-7">
        {groups.map((group) => (
          <div key={group.title}>
            <p className="mb-2 px-3 text-[11px] font-semibold uppercase tracking-[0.18em] text-white/30">
              {group.title}
            </p>

            <div className="space-y-1">
              {group.items.map((item) => {
                const active = item === "Dashboard";

                return (
                  <div
                    key={item}
                    className={[
                      "rounded-xl px-3 py-2.5 text-sm transition-all duration-200",
                      active
                        ? "bg-white/10 text-white shadow-sm ring-1 ring-white/10"
                        : "text-white/58 hover:bg-white/[0.06] hover:text-white",
                    ].join(" ")}
                  >
                    {item}
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-4">
        <div className="text-sm font-medium text-white">Lumi</div>
        <p className="mt-1 text-xs leading-5 text-white/45">
          Assistente inteligente para reduzir burocracias.
        </p>
      </div>
    </aside>
  );
}