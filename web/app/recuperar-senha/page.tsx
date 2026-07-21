import Link from "next/link";
import { PasswordRecoveryRequestForm } from "@/app/recuperar-senha/PasswordRecoveryRequestForm";

export const runtime = "nodejs";

export default function PasswordRecoveryPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-secondary/50 p-4">
      <section className="w-full max-w-md rounded-3xl border bg-white p-7 shadow-sm">
        <p className="text-sm font-semibold text-primary">Acesso seguro</p>
        <h1 className="mt-2 text-2xl font-semibold">Recuperar senha</h1>
        <p className="mt-2 text-sm leading-6 text-muted-foreground">
          Informe seu e-mail. A resposta não revelará se existe uma conta.
        </p>
        <PasswordRecoveryRequestForm />
        <Link
          href="/login"
          className="mt-5 block text-center text-sm font-medium text-primary"
        >
          Voltar ao login
        </Link>
      </section>
    </main>
  );
}
