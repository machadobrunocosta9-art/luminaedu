"use client";

import { Bell, BellOff, LoaderCircle } from "lucide-react";
import { useEffect, useState } from "react";

type Estado =
  | "carregando"
  | "nao-suportado"
  | "bloqueado"
  | "desativado"
  | "ativado";

function base64ParaUint8Array(base64: string) {
  const padding = "=".repeat((4 - (base64.length % 4)) % 4);
  const base64Normalizado = (base64 + padding)
    .replace(/-/g, "+")
    .replace(/_/g, "/");

  const raw = window.atob(base64Normalizado);
  const saida = new Uint8Array(raw.length);

  for (let i = 0; i < raw.length; i += 1) {
    saida[i] = raw.charCodeAt(i);
  }

  return saida;
}

export default function PushToggle({
  chavePublica,
}: {
  chavePublica: string | null;
}) {
  const [estado, setEstado] = useState<Estado>("carregando");
  const [ocupado, setOcupado] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  useEffect(() => {
    let ativo = true;

    async function verificar() {
      if (
        !chavePublica ||
        typeof window === "undefined" ||
        !("serviceWorker" in navigator) ||
        !("PushManager" in window) ||
        !("Notification" in window)
      ) {
        if (ativo) setEstado("nao-suportado");
        return;
      }

      if (Notification.permission === "denied") {
        if (ativo) setEstado("bloqueado");
        return;
      }

      try {
        const registro = await navigator.serviceWorker.register("/sw.js");
        const inscricao = await registro.pushManager.getSubscription();

        if (ativo) {
          setEstado(inscricao ? "ativado" : "desativado");
        }
      } catch {
        if (ativo) setEstado("nao-suportado");
      }
    }

    verificar();

    return () => {
      ativo = false;
    };
  }, [chavePublica]);

  async function ativar() {
    if (!chavePublica) return;

    try {
      setOcupado(true);
      setErro(null);

      const permissao = await Notification.requestPermission();

      if (permissao !== "granted") {
        setEstado(permissao === "denied" ? "bloqueado" : "desativado");
        return;
      }

      const registro = await navigator.serviceWorker.register("/sw.js");
      await navigator.serviceWorker.ready;

      const inscricao = await registro.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: base64ParaUint8Array(chavePublica),
      });

      const response = await fetch("/api/push/inscrever", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(inscricao.toJSON()),
      });

      if (!response.ok) {
        throw new Error("Não foi possível ativar as notificações.");
      }

      setEstado("ativado");
    } catch (error) {
      setErro(
        error instanceof Error
          ? error.message
          : "Não foi possível ativar as notificações.",
      );
    } finally {
      setOcupado(false);
    }
  }

  async function desativar() {
    try {
      setOcupado(true);
      setErro(null);

      const registro = await navigator.serviceWorker.getRegistration("/sw.js");
      const inscricao = await registro?.pushManager.getSubscription();

      if (inscricao) {
        await fetch("/api/push/cancelar", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ endpoint: inscricao.endpoint }),
        });

        await inscricao.unsubscribe();
      }

      setEstado("desativado");
    } catch {
      setErro("Não foi possível desativar as notificações.");
    } finally {
      setOcupado(false);
    }
  }

  if (estado === "carregando") {
    return null;
  }

  if (estado === "nao-suportado") {
    return (
      <div className="rounded-[22px] bg-white p-4 text-[13px] text-[#8e8e93] shadow-[0_1px_2px_rgba(0,0,0,0.04),0_1px_8px_rgba(0,0,0,0.04)]">
        Para receber avisos no celular, adicione o Lumina à tela de início e
        abra por lá.
      </div>
    );
  }

  if (estado === "bloqueado") {
    return (
      <div className="rounded-[22px] bg-white p-4 text-[13px] text-[#8e8e93] shadow-[0_1px_2px_rgba(0,0,0,0.04),0_1px_8px_rgba(0,0,0,0.04)]">
        As notificações estão bloqueadas nas configurações do seu navegador.
        Libere para receber avisos da escola.
      </div>
    );
  }

  const ativado = estado === "ativado";

  return (
    <div className="rounded-[22px] bg-white p-4 shadow-[0_1px_2px_rgba(0,0,0,0.04),0_1px_8px_rgba(0,0,0,0.04)]">
      <div className="flex items-center gap-3">
        <div
          className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${
            ativado ? "bg-primary/10 text-primary" : "bg-[#f5f5f7] text-[#8e8e93]"
          }`}
        >
          {ativado ? <Bell size={18} /> : <BellOff size={18} />}
        </div>

        <div className="min-w-0 flex-1">
          <p className="text-[15px] font-semibold text-foreground">
            Avisos no celular
          </p>
          <p className="mt-0.5 text-[12px] text-[#8e8e93]">
            {ativado
              ? "Você recebe avisos de novos comunicados e mensagens."
              : "Ative para saber na hora quando a escola enviar algo."}
          </p>
        </div>

        <button
          type="button"
          onClick={ativado ? desativar : ativar}
          disabled={ocupado}
          className={`shrink-0 rounded-full px-4 py-2 text-[13px] font-semibold transition disabled:opacity-50 ${
            ativado
              ? "bg-[#f5f5f7] text-foreground"
              : "bg-primary text-primary-foreground"
          }`}
        >
          {ocupado ? (
            <LoaderCircle size={14} className="animate-spin" />
          ) : ativado ? (
            "Desativar"
          ) : (
            "Ativar"
          )}
        </button>
      </div>

      {erro && <p className="mt-3 text-[12px] text-red-600">{erro}</p>}
    </div>
  );
}
