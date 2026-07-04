import { Bell, Search } from "lucide-react";

export default function Topbar() {
  return (
    <header className="sticky top-0 z-30 border-b border-border/60 bg-background/90 backdrop-blur-xl">
      <div className="flex h-14 items-center justify-between px-8">
        <div className="flex w-full max-w-xl items-center gap-3 rounded-full border border-border bg-card px-4 py-2 shadow-sm">
          <Search size={17} className="text-muted-foreground" />

          <input
            placeholder="Pesquisar alunos, responsáveis, turmas..."
            className="w-full bg-transparent text-sm text-foreground outline-none placeholder:text-muted-foreground"
          />
        </div>

        <div className="ml-8 flex items-center gap-5">
          <button className="relative rounded-full p-2 text-foreground transition hover:bg-muted">
            <Bell size={19} />
            <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-red-500 ring-2 ring-background" />
          </button>

          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary text-xs font-semibold text-primary-foreground">
              BM
            </div>

            <div className="leading-tight">
              <p className="text-sm font-semibold text-foreground">
                Bruno Machado
              </p>
              <p className="text-xs text-muted-foreground">Administrador</p>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}