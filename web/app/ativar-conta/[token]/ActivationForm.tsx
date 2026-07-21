"use client";

import { useActionState } from "react";
import {
  activateAccountAction,
  type ActivationState,
} from "@/app/ativar-conta/[token]/actions";

const initialState: ActivationState = { error: null };

export function ActivationForm({ token }: { token: string }) {
  const [state, action, pending] = useActionState(
    activateAccountAction,
    initialState,
  );

  return (
    <form action={action} className="mt-6 space-y-4">
      <input type="hidden" name="token" value={token} />
      <div>
        <label className="mb-1 block text-sm font-medium" htmlFor="password">
          Crie sua senha
        </label>
        <input
          id="password"
          name="password"
          type="password"
          minLength={12}
          maxLength={128}
          autoComplete="new-password"
          required
          className="h-12 w-full rounded-xl border px-3 focus:border-primary focus:ring-2 focus:ring-primary/20"
        />
        <p className="mt-1 text-xs text-muted-foreground">
          Use entre 12 e 128 caracteres.
        </p>
      </div>
      <div>
        <label
          className="mb-1 block text-sm font-medium"
          htmlFor="passwordConfirmation"
        >
          Confirme sua senha
        </label>
        <input
          id="passwordConfirmation"
          name="passwordConfirmation"
          type="password"
          minLength={12}
          maxLength={128}
          autoComplete="new-password"
          required
          className="h-12 w-full rounded-xl border px-3 focus:border-primary focus:ring-2 focus:ring-primary/20"
        />
      </div>
      {state.error ? (
        <p role="alert" className="text-sm text-red-600">
          {state.error}
        </p>
      ) : null}
      <button
        type="submit"
        disabled={pending}
        className="h-12 w-full rounded-xl bg-primary font-medium text-white disabled:opacity-60"
      >
        {pending ? "Ativando..." : "Ativar minha conta"}
      </button>
    </form>
  );
}
