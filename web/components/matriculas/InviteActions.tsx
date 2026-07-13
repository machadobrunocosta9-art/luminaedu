"use client";

import {
  Check,
  Copy,
  MessageCircle,
} from "lucide-react";
import { useMemo, useState } from "react";

type InviteActionsProps = {
  token: string;
  nomeAluno: string;
  nomeResponsavel: string;
  telefoneResponsavel: string;
};

function normalizarTelefoneWhatsApp(telefone: string) {
  const numeros = telefone.replace(/\D/g, "");

  if (numeros.startsWith("55")) {
    return numeros;
  }

  return `55${numeros}`;
}

export default function InviteActions({
  token,
  nomeAluno,
  nomeResponsavel,
  telefoneResponsavel,
}: InviteActionsProps) {
  const [copiado, setCopiado] = useState(false);

  const linkPublico = useMemo(() => {
    if (typeof window === "undefined") {
      return `/matricula/convite/${token}`;
    }

    return `${window.location.origin}/matricula/convite/${token}`;
  }, [token]);

  const mensagemWhatsApp = useMemo(() => {
    return [
      `Olá, ${nomeResponsavel}!`,
      "",
      `A matrícula de ${nomeAluno} foi iniciada pela escola.`,
      "Acesse o link abaixo para completar os dados:",
      "",
      linkPublico,
      "",
      "Este convite é pessoal e possui prazo de validade.",
    ].join("\n");
  }, [linkPublico, nomeAluno, nomeResponsavel]);

  const whatsappUrl = useMemo(() => {
    const telefone =
      normalizarTelefoneWhatsApp(
        telefoneResponsavel,
      );

    return `https://wa.me/${telefone}?text=${encodeURIComponent(
      mensagemWhatsApp,
    )}`;
  }, [mensagemWhatsApp, telefoneResponsavel]);

  async function copiarLink() {
    try {
      const linkCompleto = `${window.location.origin}/matricula/convite/${token}`;

      await navigator.clipboard.writeText(
        linkCompleto,
      );

      setCopiado(true);

      window.setTimeout(() => {
        setCopiado(false);
      }, 2500);
    } catch {
      setCopiado(false);
    }
  }

  return (
    <div className="space-y-4">
      <div className="rounded-2xl border border-border bg-background p-4">
        <p className="text-xs font-medium text-muted-foreground">
          Link público da matrícula
        </p>

        <p className="mt-2 break-all text-sm font-medium text-foreground">
          /matricula/convite/{token}
        </p>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <button
          type="button"
          onClick={copiarLink}
          className="group inline-flex min-h-12 items-center justify-center gap-2 rounded-2xl border border-border bg-background px-5 py-3 text-sm font-semibold text-foreground transition-all duration-200 hover:-translate-y-0.5 hover:border-primary/20 hover:bg-muted hover:shadow-sm active:scale-[0.98]"
        >
          {copiado ? (
            <Check size={17} className="text-primary" />
          ) : (
            <Copy size={17} />
          )}

          {copiado ? "Link copiado" : "Copiar link"}
        </button>

        <a
          href={whatsappUrl}
          target="_blank"
          rel="noreferrer"
          className="group inline-flex min-h-12 items-center justify-center gap-2 rounded-2xl bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground shadow-sm shadow-primary/20 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg hover:shadow-primary/25 active:scale-[0.98]"
        >
          <MessageCircle
            size={17}
            className="transition-transform duration-200 group-hover:scale-110"
          />
          Enviar pelo WhatsApp
        </a>
      </div>
    </div>
  );
}