const menu = [
  "Hoje",
  "Alunos",
  "Responsáveis",
  "Turmas",
  "Comunicação",
  "Financeiro",
  "Documentos",
  "IA",
  "Configurações",
];

export default function Sidebar() {
  return (
    <aside className="w-72 min-h-screen bg-[#241D16] text-white px-5 py-6">
      <div className="mb-10">
        <div className="text-2xl font-bold tracking-tight">Lumina</div>
        <div className="mt-1 text-sm text-white/55">
          Jardim Escola Girassol Encantado
        </div>
      </div>

      <nav className="space-y-1">
        {menu.map((item) => (
          <div
            key={item}
            className={`rounded-2xl px-4 py-3 text-sm font-medium ${
              item === "Hoje"
                ? "bg-[#F4B400] text-[#201A14]"
                : "text-white/70 hover:bg-white/10 hover:text-white"
            }`}
          >
            {item}
          </div>
        ))}
      </nav>
    </aside>
  );
}