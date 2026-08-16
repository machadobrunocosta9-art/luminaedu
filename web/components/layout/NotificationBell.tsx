"use client";

import Link from "next/link";
import { Bell, ChevronRight, LoaderCircle } from "lucide-react";
import { useEffect, useRef, useState } from "react";

type Notificacao = {
  id: string;
  titulo: string;
  descricao: string;
  href: string;
};

export default function NotificationBell() {
  const [aberto, setAberto] = useState(false);
  const [notificacoes, setNotificacoes] = useState<Notificacao[] | null>(null);
  const [carregando, setCarregando] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let ativo = true;

    async function carregar() {
      try {
        setCarregando(true);
        const response = await fetch("/api/notificacoes", {
          cache: "no-store",
        });

        if (!response.ok) return;

        const data = (await response.json()) as {
          notificacoes: Notificacao[];
        };

        if (ativo) {
          setNotificacoes(data.notificacoes);
        }
      } catch {
        // Silencioso: o sino apenas nao mostra contagem.
      } finally {
        if (ativo) setCarregando(false);
      }
    }

    carregar();

    return () => {
      ativo = false;
    };
  }, []);

  useEffect(() => {
    if (!aberto) return;

    function aoClicarFora(event: MouseEvent) {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setAberto(false);
      }
    }

    document.addEventListener("mousedown", aoClicarFora);
    return () => document.removeEventListener("mousedown", aoClicarFora);
  }, [aberto]);

  const total = notificacoes?.length ?? 0;

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        onClick={() => setAberto((valor) => !valor)}
        aria-label="Notificações"
        className="relative flex h-11 w-11 items-center justify-center rounded-2xl border border-border bg-card text-foreground shadow-sm transition hover:bg-primary/5"
      >
        <Bell size={19} />
        {total > 0 && (
          <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-primary px-1 text-[11px] font-bold text-primary-foreground">
            {total > 9 ? "9+" : total}
          </span>
        )}
      </button>

      {aberto && (
        <div className="absolute right-0 top-13 z-50 mt-2 w-80 overflow-hidden rounded-3xl border border-border bg-card shadow-xl">
          <div className="border-b border-border px-5 py-3.5">
            <p className="font-semibold text-foreground">Notificações</p>
          </div>

          {carregando && notificacoes === null ? (
            <div className="flex items-center justify-center gap-2 p-6 text-sm text-muted-foreground">
              <LoaderCircle size={16} className="animate-spin" />
              Carregando...
            </div>
          ) : total === 0 ? (
            <p className="p-6 text-center text-sm text-muted-foreground">
              Tudo em dia. Nenhuma pendência no momento.
            </p>
          ) : (
            <div className="max-h-[60vh] overflow-y-auto">
              {notificacoes?.map((notificacao, index) => (
                <Link
                  key={notificacao.id}
                  href={notificacao.href}
                  onClick={() => setAberto(false)}
                  className={`flex items-center gap-3 px-5 py-3.5 transition hover:bg-muted ${
                    index > 0 ? "border-t border-border" : ""
                  }`}
                >
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-foreground">
                      {notificacao.titulo}
                    </p>
                    <p className="mt-0.5 text-xs text-muted-foreground">
                      {notificacao.descricao}
                    </p>
                  </div>
                  <ChevronRight
                    size={16}
                    className="shrink-0 text-muted-foreground"
                  />
                </Link>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
