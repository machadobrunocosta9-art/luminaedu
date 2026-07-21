"use client";

import { useActionState } from "react";
import {
  resetPasswordAction,
  type PasswordResetState,
} from "@/app/recuperar-senha/[token]/actions";

const initialState: PasswordResetState = { error: null };

export function PasswordResetForm({ token }: { token: string }) {
  const [state, action, pending] = useActionState(
    resetPasswordAction,
    initialState,
  );

  return (
    <form action={action} className="mt-6 space-y-4">
      <input type="hidden" name="token" value={token} />
      <div>
        <label className="mb-1 block text-sm font-medium" htmlFor="password">
          Nova senha
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
      </div>
      <div>
        <label
          className="mb-1 block text-sm font-medium"
          htmlFor="passwordConfirmation"
        >
          Confirme a nova senha
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
        {pending ? "Salvando..." : "Definir nova senha"}
      </button>
    </form>
  );
}
