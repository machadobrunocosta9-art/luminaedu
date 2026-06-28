export default function Home() {
  return (
    <main className="min-h-screen bg-[#F6F4EF] text-[#201A14]">
      <div className="flex min-h-screen">
        <aside className="w-[280px] bg-[#241D16] text-white px-5 py-6">
          <div className="mb-10">
            <div className="text-2xl font-bold tracking-tight">Atlas</div>
            <div className="mt-1 text-sm text-white/55">
              Jardim Escola Girassol Encantado
            </div>
          </div>

          <nav className="space-y-1">
            {[
              "Hoje",
              "Alunos",
              "Responsáveis",
              "Turmas",
              "Acadêmico",
              "Comunicação",
              "Financeiro",
              "Documentos",
              "IA",
              "Configurações",
            ].map((item) => (
              <div
                key={item}
                className={`rounded-2xl px-4 py-3 text-sm font-medium transition ${
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

        <section className="flex-1">
          <header className="flex h-20 items-center justify-between border-b border-black/5 bg-white px-8">
            <div className="w-[420px] rounded-2xl border border-black/10 bg-[#F8F7F4] px-4 py-3 text-sm text-[#807568]">
              Buscar aluno, responsável, turma...
            </div>

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

          <div className="p-8">
            <div className="mb-8 flex items-center justify-between">
              <div>
                <p className="text-sm font-bold uppercase tracking-[0.18em] text-[#A17A00]">
                  Centro de Operações
                </p>
                <h1 className="mt-2 text-4xl font-bold tracking-tight">
                  Bom dia, Bruno
                </h1>
                <p className="mt-2 text-[#807568]">
                  Veja o que precisa da sua atenção hoje.
                </p>
              </div>

              <button className="rounded-2xl bg-[#F4B400] px-6 py-4 font-bold text-[#201A14] shadow-sm">
                Novo
              </button>
            </div>

            <div className="grid grid-cols-4 gap-5">
              {[
                ["Presença hoje", "112", "de 128 alunos"],
                ["Comunicados", "2", "pendentes de envio"],
                ["Documentos", "5", "alunos com pendências"],
                ["Financeiro", "8", "mensalidades em aberto"],
              ].map(([title, value, desc]) => (
                <div
                  key={title}
                  className="rounded-[28px] border border-black/5 bg-white p-6 shadow-sm"
                >
                  <div className="text-xs font-bold uppercase tracking-wide text-[#807568]">
                    {title}
                  </div>
                  <div className="mt-5 text-5xl font-bold">{value}</div>
                  <div className="mt-2 text-sm text-[#807568]">{desc}</div>
                  <div className="mt-6 text-sm font-bold text-[#A17A00]">
                    Ver detalhes →
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-6 grid grid-cols-[2fr_1fr] gap-6">
              <div className="rounded-[28px] border border-black/5 bg-white p-6 shadow-sm">
                <h2 className="text-xl font-bold">Prioridades de hoje</h2>

                <div className="mt-6 space-y-4">
                  {[
                    ["Alta", "Documentos pendentes", "5 alunos precisam entregar documentação", "Resolver"],
                    ["Média", "Comunicados", "2 comunicados aguardando envio", "Revisar"],
                    ["Alta", "Mensalidades", "8 mensalidades em aberto", "Cobrar"],
                  ].map(([nivel, title, desc, action]) => (
                    <div
                      key={title}
                      className="flex items-center justify-between rounded-3xl border border-black/5 bg-[#FAF9F6] p-5"
                    >
                      <div>
                        <span className="rounded-full bg-[#F4B400]/20 px-3 py-1 text-xs font-bold text-[#8A6500]">
                          {nivel}
                        </span>
                        <p className="mt-3 font-bold">{title}</p>
                        <p className="text-sm text-[#807568]">{desc}</p>
                      </div>

                      <button className="rounded-2xl border border-black/10 bg-white px-5 py-3 text-sm font-bold">
                        {action}
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              <div className="rounded-[28px] border border-black/5 bg-white p-6 shadow-sm">
                <h2 className="text-xl font-bold">Agenda</h2>

                <div className="mt-6 space-y-5">
                  {[
                    ["30 JUN", "Reunião de Pais", "19:00 • Escola"],
                    ["10 JUL", "Festa Julhina", "14:00 • Na escola"],
                    ["15 JUL", "Exposição da Taça", "09:00 • Escola"],
                  ].map(([date, title, desc]) => (
                    <div key={title} className="flex gap-4">
                      <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[#F6F4EF] text-xs font-bold">
                        {date}
                      </div>
                      <div>
                        <p className="font-bold">{title}</p>
                        <p className="text-sm text-[#807568]">{desc}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}