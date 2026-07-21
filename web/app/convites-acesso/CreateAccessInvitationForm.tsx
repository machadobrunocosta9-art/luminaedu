"use client";

import { useActionState } from "react";
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

  return (
    <form action={action} className="space-y-4 rounded-2xl border bg-white p-5">
      <div>
        <label className="mb-1 block text-sm font-medium" htmlFor="responsavelId">
          Responsável
        </label>
        <select
          id="responsavelId"
          name="responsavelId"
          required
          className="h-11 w-full rounded-xl border bg-white px-3"
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
        <label className="mb-1 block text-sm font-medium" htmlFor="validityDays">
          Validade
        </label>
        <select
          id="validityDays"
          name="validityDays"
          defaultValue="7"
          className="h-11 w-full rounded-xl border bg-white px-3"
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
        <div className="rounded-xl bg-secondary p-3 text-sm">
          <p className="font-medium">Link criado. Copie-o agora:</p>
          <p className="mt-1 break-all text-muted-foreground">
            {state.activationUrl}
          </p>
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
        className="h-11 w-full rounded-xl bg-primary px-4 font-medium text-white disabled:opacity-60"
      >
        {pending ? "Gerando convite..." : "Gerar convite de acesso"}
      </button>
    </form>
  );
}
