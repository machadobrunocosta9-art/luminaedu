"use client";

import { MessageCircle, Sparkles, X } from "lucide-react";
import { useState } from "react";

export default function FloatingLumi() {
  const [open, setOpen] = useState(false);

  return (
    <div className="fixed bottom-6 right-6 z-50">
      {open && (
        <div className="mb-4 w-[340px] rounded-3xl border border-border bg-card p-5 shadow-xl">
          <div className="mb-4 flex items-start justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <div className="flex h-9 w-9 items-center justify-center rounded-2xl bg-primary text-primary-foreground">
                  <Sparkles size={18} />
                </div>

                <div>
                  <h3 className="font-semibold text-foreground">Lumi</h3>
                  <p className="text-xs text-muted-foreground">
                    Assistente operacional
                  </p>
                </div>
              </div>
            </div>

            <button
              onClick={() => setOpen(false)}
              className="rounded-full p-1 text-muted-foreground transition hover:bg-muted hover:text-foreground"
            >
              <X size={18} />
            </button>
          </div>

          <div className="rounded-2xl bg-muted p-4">
            <p className="text-sm leading-6 text-foreground">
              Olá, Bruno. Encontrei tarefas abertas no Pulse e uma pendência no
              financeiro. Quer que eu te ajude a organizar as próximas ações?
            </p>
          </div>

          <button className="mt-4 w-full rounded-2xl bg-primary px-4 py-3 text-sm font-semibold text-primary-foreground transition hover:opacity-90">
            Ver recomendações
          </button>
        </div>
      )}

      <button
        onClick={() => setOpen((value) => !value)}
        className="group flex h-16 w-16 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-xl shadow-primary/25 transition hover:-translate-y-1 hover:shadow-2xl"
      >
        {open ? <X size={26} /> : <MessageCircle size={26} />}
      </button>
    </div>
  );
}