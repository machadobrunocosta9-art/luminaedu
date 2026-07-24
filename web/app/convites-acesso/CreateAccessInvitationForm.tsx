"use client";

import { useActionState, useState } from "react";
import { Check, Copy } from "lucide-react";
import {
  createAccessInvitationAction,
  type CreateAccessInvitationState,
} from "@/app/convites-acesso/actions";

type ResponsibleOption = {
  id: string;
  nome: string;
};

const initialState: CreateAccessInvitationState = {
  error: null,
  activationUrl: null,
  emailStatus: null,
};

export function CreateAccessInvitationForm({
  responsaveis,
}: {
  responsaveis: ResponsibleOption[];
}) {
  const [state, action, pending] = useActionState(
    createAccessInvitationAction,
    initialState,
  );
  const [copiedUrl, setCopiedUrl] = useState<string | null>(null);
  const [copyError, setCopyError] = useState(false);

  async function copyActivationLink() {
    if (!state.activationUrl) return;

    try {
      await navigator.clipboard.writeText(state.activationUrl);
      setCopiedUrl(state.activationUrl);
      setCopyError(false);
    } catch {
      setCopiedUrl(null);
      setCopyError(true);
    }
  }

  return (
    <form
      action={action}
      className="space-y-4 rounded-3xl border border-border bg-card p-6 shadow-sm"
    >
      <div>
        <h2 className="text-xl font-semibold text-foreground">
          Gerar convite
        </h2>
        <p className="mt-1 text-sm leading-6 text-muted-foreground">
          O link será exibido uma única vez após a criação.
        </p>
      </div>

      <div>
        <label
          className="mb-2 block text-sm font-medium text-foreground"
          htmlFor="responsavelId"
        >
          Responsável
        </label>
        <select
          id="responsavelId"
          name="responsavelId"
          required
          className="h-11 w-full rounded-xl border border-border bg-background px-3 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/10"
        >
          <option value="">Selecione</option>
          {responsaveis.map((responsavel) => (
            <option key={responsavel.id} value={responsavel.id}>
              {responsavel.nome}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label
          className="mb-2 block text-sm font-medium text-foreground"
          htmlFor="validityDays"
        >
          Validade
        </label>
        <select
          id="validityDays"
          name="validityDays"
          defaultValue="7"
          className="h-11 w-full rounded-xl border border-border bg-background px-3 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/10"
        >
          <option value="1">1 dia</option>
          <option value="3">3 dias</option>
          <option value="7">7 dias</option>
          <option value="14">14 dias</option>
          <option value="30">30 dias</option>
        </select>
      </div>

      {state.error ? (
        <p role="alert" className="text-sm text-red-600">
          {state.error}
        </p>
      ) : null}

      {state.activationUrl ? (
        <div className="rounded-2xl border border-primary/10 bg-primary/5 p-4 text-sm">
          <p className="font-medium">Link criado. Copie-o agora:</p>
          <p className="mt-1 break-all text-muted-foreground">
            {state.activationUrl}
          </p>
          <button
            type="button"
            onClick={copyActivationLink}
            className="mt-3 inline-flex h-9 items-center gap-2 rounded-xl border border-primary/20 bg-background px-3 text-sm font-semibold text-primary transition hover:bg-primary/5"
          >
            {copiedUrl === state.activationUrl ? (
              <>
                <Check size={16} />
                Link copiado
              </>
            ) : (
              <>
                <Copy size={16} />
                Copiar link
              </>
            )}
          </button>
          {copyError ? (
            <p role="alert" className="mt-2 text-xs text-red-600">
              Não foi possível copiar automaticamente. Selecione o link acima.
            </p>
          ) : null}
          <p className="mt-2 text-xs text-muted-foreground">
            {state.emailStatus === "sent"
              ? "E-mail enviado."
              : state.emailStatus === "not_configured"
                ? "E-mail não enviado: provedor ainda não configurado."
                : "O e-mail não pôde ser enviado."}
          </p>
        </div>
      ) : null}

      <button
        type="submit"
        disabled={pending}
        className="h-11 w-full rounded-xl bg-primary px-4 font-medium text-primary-foreground transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {pending ? "Gerando convite..." : "Gerar convite de acesso"}
      </button>
    </form>
  );
}
