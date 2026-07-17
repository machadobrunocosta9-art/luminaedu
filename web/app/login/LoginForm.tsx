"use client";

import { useActionState } from "react";
import { Eye, EyeOff, LoaderCircle, LockKeyhole, Mail } from "lucide-react";
import { useState } from "react";
import { loginAction, type LoginState } from "@/app/login/actions";
import LuminaButton from "@/components/ui/LuminaButton";
import { LuminaInput } from "@/components/ui/LuminaInput";

const initialState: LoginState = { error: null };

export function LoginForm({ nextPath }: { nextPath: string }) {
  const [state, formAction, pending] = useActionState(loginAction, initialState);
  const [showPassword, setShowPassword] = useState(false);

  return (
    <form
      action={formAction}
      aria-busy={pending}
      className="mt-7 space-y-4.5"
    >
      <input type="hidden" name="next" value={nextPath} />

      <div className="motion-safe:animate-in motion-safe:fade-in motion-safe:slide-in-from-bottom-2 motion-safe:duration-700 motion-safe:[animation-delay:320ms] motion-safe:[animation-fill-mode:both]">
        <LuminaInput
          id="email"
          name="email"
          type="email"
          label="E-mail"
          leadingIcon={<Mail size={18} strokeWidth={1.8} />}
          autoComplete="username"
          required
          placeholder="nome@escola.com"
        />
      </div>

      <div className="motion-safe:animate-in motion-safe:fade-in motion-safe:slide-in-from-bottom-2 motion-safe:duration-700 motion-safe:[animation-delay:410ms] motion-safe:[animation-fill-mode:both]">
        <LuminaInput
          id="password"
          name="password"
          type={showPassword ? "text" : "password"}
          label="Senha"
          leadingIcon={<LockKeyhole size={18} strokeWidth={1.8} />}
          trailingAction={
            <button
              type="button"
              onClick={() => setShowPassword((visible) => !visible)}
              className="flex h-9 w-9 items-center justify-center rounded-xl text-muted-foreground transition-all duration-200 hover:bg-secondary hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
              aria-label={showPassword ? "Ocultar senha" : "Mostrar senha"}
              aria-pressed={showPassword}
            >
              {showPassword ? (
                <EyeOff size={18} strokeWidth={1.8} />
              ) : (
                <Eye size={18} strokeWidth={1.8} />
              )}
            </button>
          }
          autoComplete="current-password"
          required
          placeholder="Digite sua senha"
        />
      </div>

      <div
        aria-live="polite"
        className="min-h-12 motion-safe:animate-in motion-safe:fade-in motion-safe:duration-500 motion-safe:[animation-delay:470ms] motion-safe:[animation-fill-mode:both]"
      >
        {state.error && (
          <p
            role="alert"
            className="rounded-2xl border border-red-200/80 bg-red-50/90 px-4 py-3 text-sm leading-5 text-red-700 shadow-sm"
          >
            {state.error}
          </p>
        )}
      </div>

      <LuminaButton
        type="submit"
        variant="premium"
        disabled={pending}
        className="h-13 w-full gap-2 rounded-2xl text-[15px] motion-safe:animate-in motion-safe:fade-in motion-safe:slide-in-from-bottom-2 motion-safe:duration-700 motion-safe:[animation-delay:520ms] motion-safe:[animation-fill-mode:both]"
      >
        {pending && <LoaderCircle size={18} className="animate-spin" />}
        {pending ? "Autenticando..." : "Entrar no painel"}
      </LuminaButton>
    </form>
  );
}
