"use client";

import { Eye, EyeOff } from "lucide-react";
import { useState } from "react";

export default function CampoSenhaApp({
  obrigatorio,
}: {
  obrigatorio: boolean;
}) {
  const [valor, setValor] = useState("");
  const [visivel, setVisivel] = useState(false);

  const semEspacos = valor.replace(/\s+/g, "");
  const quantidade = semEspacos.length;

  return (
    <div>
      <label className="mb-2 block text-sm font-medium text-foreground">
        Senha de app {obrigatorio ? "*" : "(opcional)"}
      </label>

      <div className="relative">
        <input
          name="senha"
          type={visivel ? "text" : "password"}
          required={obrigatorio}
          value={valor}
          onChange={(event) => setValor(event.target.value)}
          // Evita que o navegador preencha a senha normal da conta.
          autoComplete="off"
          autoCorrect="off"
          autoCapitalize="off"
          spellCheck={false}
          data-form-type="other"
          placeholder={
            obrigatorio ? "16 letras do Google" : "Deixe vazio para manter a atual"
          }
          className="h-12 w-full rounded-2xl border border-border bg-background px-4 pr-12 text-sm outline-none focus:border-primary"
        />

        <button
          type="button"
          onClick={() => setVisivel((v) => !v)}
          aria-label={visivel ? "Ocultar senha" : "Mostrar senha"}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground transition hover:text-foreground"
        >
          {visivel ? <EyeOff size={18} /> : <Eye size={18} />}
        </button>
      </div>

      {quantidade > 0 && (
        <p
          className={`mt-2 text-xs font-medium ${
            quantidade === 16 ? "text-emerald-600" : "text-amber-600"
          }`}
        >
          {quantidade === 16
            ? "16 caracteres — parece uma senha de app válida."
            : `${quantidade} caracteres. A senha de app do Google tem exatamente 16 letras — confira se o navegador não preencheu a senha normal da conta.`}
        </p>
      )}

      <p className="mt-2 text-xs leading-5 text-muted-foreground">
        Não é a senha normal do e-mail. Gere em{" "}
        <span className="font-medium">myaccount.google.com/apppasswords</span>{" "}
        (precisa da verificação em duas etapas ativa). Pode colar com espaços,
        que a gente remove.
      </p>
    </div>
  );
}
