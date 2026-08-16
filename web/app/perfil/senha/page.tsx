import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import AppLayout from "@/components/layout/AppLayout";
import ProfessorTabBar from "@/components/professor/ProfessorTabBar";
import { redirect } from "next/navigation";
import { getAuthContext } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import {
  hashPassword,
  validateNewPassword,
  verifyPassword,
} from "@/lib/security/password";

export const dynamic = "force-dynamic";

async function trocarSenha(formData: FormData) {
  "use server";

  const auth = await getAuthContext();

  if (!auth || auth.kind !== "user") {
    redirect("/login?next=/perfil/senha");
  }

  const senhaAtual = String(formData.get("senhaAtual") || "");
  const novaSenha = String(formData.get("novaSenha") || "");
  const confirmarSenha = String(formData.get("confirmarSenha") || "");

  if (!senhaAtual || !novaSenha || !confirmarSenha) {
    redirect("/perfil/senha?erro=campos");
  }

  const usuario = await prisma.usuario.findUnique({
    where: { id: auth.usuarioId! },
    select: { senhaHash: true },
  });

  if (!usuario || !(await verifyPassword(senhaAtual, usuario.senhaHash))) {
    redirect("/perfil/senha?erro=atual");
  }

  if (novaSenha !== confirmarSenha) {
    redirect("/perfil/senha?erro=confirmacao");
  }

  const erroValidacao = validateNewPassword(novaSenha);

  if (erroValidacao) {
    redirect("/perfil/senha?erro=fraca");
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

  redirect("/login?senhaAlterada=1");
}

const ERROS: Record<string, string> = {
  campos: "Preencha todos os campos.",
  atual: "Senha atual incorreta.",
  confirmacao: "A nova senha e a confirmação não coincidem.",
  fraca: "A nova senha deve ter entre 12 e 128 caracteres.",
};

export default async function TrocarSenhaEquipePage({
  searchParams,
}: {
  searchParams?: Promise<{ erro?: string }>;
}) {
  const auth = await getAuthContext();

  if (!auth || auth.kind !== "user" || auth.papel === "RESPONSAVEL") {
    redirect("/login?next=/perfil/senha");
  }

  const query = searchParams ? await searchParams : {};
  const erro = query.erro ? ERROS[query.erro] : null;

  const conteudo = (
    <main className="mx-auto w-full max-w-md space-y-6 px-4 pt-6 sm:px-6">
      <Link
        href="/perfil"
        className="inline-flex items-center gap-1 text-sm font-medium text-primary"
      >
        <ChevronLeft size={18} />
        Perfil
      </Link>

      <header>
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">
          Trocar senha
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Depois de trocar, você será desconectado e precisará entrar de novo
          com a nova senha.
        </p>
      </header>

      {erro && (
        <div className="rounded-2xl bg-red-50 p-4 text-sm font-medium text-red-600">
          {erro}
        </div>
      )}

      <form
        action={trocarSenha}
        className="space-y-4 rounded-3xl border border-border bg-card p-5 shadow-sm"
      >
        <div>
          <label className="mb-2 block text-sm font-medium text-foreground">
            Senha atual
          </label>
          <input
            type="password"
            name="senhaAtual"
            required
            className="h-12 w-full rounded-2xl border border-border bg-background px-4 text-sm outline-none focus:border-primary"
          />
        </div>

        <div>
          <label className="mb-2 block text-sm font-medium text-foreground">
            Nova senha
          </label>
          <input
            type="password"
            name="novaSenha"
            required
            minLength={12}
            className="h-12 w-full rounded-2xl border border-border bg-background px-4 text-sm outline-none focus:border-primary"
          />
          <p className="mt-1 text-xs text-muted-foreground">
            Mínimo de 12 caracteres.
          </p>
        </div>

        <div>
          <label className="mb-2 block text-sm font-medium text-foreground">
            Confirmar nova senha
          </label>
          <input
            type="password"
            name="confirmarSenha"
            required
            minLength={12}
            className="h-12 w-full rounded-2xl border border-border bg-background px-4 text-sm outline-none focus:border-primary"
          />
        </div>

        <button
          type="submit"
          className="w-full rounded-2xl bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground transition hover:opacity-90"
        >
          Salvar nova senha
        </button>
      </form>
    </main>
  );

  if (auth.papel === "PROFESSOR") {
    return (
      <div className="min-h-screen bg-[#f5f5f7] pb-24">
        {conteudo}
        <ProfessorTabBar />
      </div>
    );
  }

  return <AppLayout>{conteudo}</AppLayout>;
}
