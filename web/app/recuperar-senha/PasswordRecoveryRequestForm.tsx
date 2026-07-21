"use client";

import { useActionState } from "react";
import {
  requestPasswordRecoveryAction,
  type PasswordRecoveryRequestState,
} from "@/app/recuperar-senha/actions";

const initialState: PasswordRecoveryRequestState = { message: null };

export function PasswordRecoveryRequestForm() {
  const [state, action, pending] = useActionState(
    requestPasswordRecoveryAction,
    initialState,
  );

  return (
    <form action={action} className="mt-6 space-y-4">
      <div>
        <label className="mb-1 block text-sm font-medium" htmlFor="email">
          E-mail
        </label>
        <input
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          required
          className="h-12 w-full rounded-xl border px-3 focus:border-primary focus:ring-2 focus:ring-primary/20"
        />
      </div>
      {state.message ? (
        <p role="status" className="rounded-xl bg-secondary p-3 text-sm">
          {state.message}
        </p>
      ) : null}
      <button
        type="submit"
        disabled={pending}
        className="h-12 w-full rounded-xl bg-primary font-medium text-white disabled:opacity-60"
      >
        {pending ? "Solicitando..." : "Solicitar recuperação"}
      </button>
    </form>
  );
}
