export default function Topbar() {
  return (
    <header className="flex h-20 items-center justify-between border-b border-border bg-card px-8">
      <div className="w-full max-w-md rounded-2xl border border-border bg-muted px-4 py-3 text-sm text-muted-foreground">
        Buscar aluno, responsável, turma...
      </div>

      <div className="flex items-center gap-4">
        <button className="rounded-2xl border border-border bg-background px-4 py-3 text-sm font-semibold text-foreground">
          Notificações
        </button>

        <div className="text-right">
          <div className="text-sm font-bold text-foreground">
            Bruno Machado
          </div>
          <div className="text-xs text-muted-foreground">
            Administrador
          </div>
        </div>
      </div>
    </header>
  );
}