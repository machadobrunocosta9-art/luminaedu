import Link from "next/link";
import { redirect } from "next/navigation";
import { requireFamily } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import {
  hashPassword,
  validateNewPassword,
  verifyPassword,
} from "@/lib/security/password";

export const dynamic = "force-dynamic";

async function trocarSenha(formData: FormData) {
  "use server";

  const auth = await requireFamily();

  const senhaAtual = String(formData.get("senhaAtual") || "");
  const novaSenha = String(formData.get("novaSenha") || "");
  const confirmarSenha = String(formData.get("confirmarSenha") || "");

  if (!senhaAtual || !novaSenha || !confirmarSenha) {
    redirect("/portal-familia/senha?erro=campos");
  }

  const usuario = await prisma.usuario.findUnique({
    where: { id: auth.usuarioId! },
    select: { senhaHash: true },
  });

  if (!usuario || !(await verifyPassword(senhaAtual, usuario.senhaHash))) {
    redirect("/portal-familia/senha?erro=atual");
  }

  if (novaSenha !== confirmarSenha) {
    redirect("/portal-familia/senha?erro=confirmacao");
  }

  const erroValidacao = validateNewPassword(novaSenha);

  if (erroValidacao) {
    redirect("/portal-familia/senha?erro=fraca");
  }

  const novoHash = await hashPassword(novaSenha);

  await prisma.usuario.update({
    where: { id: auth.usuarioId! },
    data: { senhaHash: novoHash },
  });

  await prisma.sessaoUsuario.updateMany({
    where: { usuarioId: auth.usuarioId!, revogadaEm: null },
    data: { revogadaEm: new Date() },
  });

  redirect("/login?next=/portal-familia&senhaAlterada=1");
}

const ERROS: Record<string, string> = {
  campos: "Preencha todos os campos.",
  atual: "Senha atual incorreta.",
  confirmacao: "A nova senha e a confirmação não coincidem.",
  fraca: "A nova senha deve ter entre 12 e 128 caracteres.",
};

export default async function TrocarSenhaPage({
  searchParams,
}: {
  searchParams?: Promise<{ erro?: string }>;
}) {
  await requireFamily();
  const query = searchParams ? await searchParams : {};
  const erro = query.erro ? ERROS[query.erro] : null;

  return (
    <main className="mx-auto w-full max-w-lg space-y-6 p-4 sm:p-6">
      <Link href="/portal-familia" className="text-sm font-medium text-primary">
        ← Voltar
      </Link>

      <header>
        <h1 className="text-3xl font-semibold tracking-tight">Trocar senha</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Depois de trocar, você será desconectado e precisará entrar de novo
          com a nova senha.
        </p>
      </header>

      {erro && (
        <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm font-medium text-red-700">
          {erro}
        </div>
      )}

      <form action={trocarSenha} className="space-y-4 rounded-2xl border bg-white p-5">
        <div>
          <label className="mb-2 block text-sm font-medium">Senha atual</label>
          <input
            type="password"
            name="senhaAtual"
            required
            className="h-12 w-full rounded-xl border bg-background px-4 text-sm outline-none focus:border-primary"
          />
        </div>

        <div>
          <label className="mb-2 block text-sm font-medium">Nova senha</label>
          <input
            type="password"
            name="novaSenha"
            required
            minLength={12}
            className="h-12 w-full rounded-xl border bg-background px-4 text-sm outline-none focus:border-primary"
          />
          <p className="mt-1 text-xs text-muted-foreground">Mínimo de 12 caracteres.</p>
        </div>

        <div>
          <label className="mb-2 block text-sm font-medium">
            Confirmar nova senha
          </label>
          <input
            type="password"
            name="confirmarSenha"
            required
            minLength={12}
            className="h-12 w-full rounded-xl border bg-background px-4 text-sm outline-none focus:border-primary"
          />
        </div>

        <button
          type="submit"
          className="w-full rounded-xl bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground transition hover:opacity-90"
        >
          Salvar nova senha
        </button>
      </form>
    </main>
  );
}
