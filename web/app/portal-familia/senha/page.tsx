import Link from "next/link";
import { ChevronLeft } from "lucide-react";
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
    <main className="mx-auto w-full max-w-md space-y-6 px-4 pt-4 sm:px-6">
      <Link
        href="/portal-familia/perfil"
        className="inline-flex items-center gap-1 text-[15px] font-medium text-primary"
      >
        <ChevronLeft size={18} />
        Perfil
      </Link>

      <header>
        <h1 className="text-[26px] font-semibold tracking-tight text-foreground">
          Trocar senha
        </h1>
        <p className="mt-1 text-[14px] text-[#8e8e93]">
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
        className="space-y-4 rounded-[22px] bg-white p-5 shadow-[0_1px_2px_rgba(0,0,0,0.04),0_1px_8px_rgba(0,0,0,0.04)]"
      >
        <div>
          <label className="mb-2 block text-[13px] font-medium text-[#8e8e93]">
            Senha atual
          </label>
          <input
            type="password"
            name="senhaAtual"
            required
            className="h-12 w-full rounded-xl bg-[#f5f5f7] px-4 text-[15px] outline-none focus:ring-2 focus:ring-primary/30"
          />
        </div>

        <div>
          <label className="mb-2 block text-[13px] font-medium text-[#8e8e93]">
            Nova senha
          </label>
          <input
            type="password"
            name="novaSenha"
            required
            minLength={12}
            className="h-12 w-full rounded-xl bg-[#f5f5f7] px-4 text-[15px] outline-none focus:ring-2 focus:ring-primary/30"
          />
          <p className="mt-1 text-[12px] text-[#8e8e93]">Mínimo de 12 caracteres.</p>
        </div>

        <div>
          <label className="mb-2 block text-[13px] font-medium text-[#8e8e93]">
            Confirmar nova senha
          </label>
          <input
            type="password"
            name="confirmarSenha"
            required
            minLength={12}
            className="h-12 w-full rounded-xl bg-[#f5f5f7] px-4 text-[15px] outline-none focus:ring-2 focus:ring-primary/30"
          />
        </div>

        <button
          type="submit"
          className="w-full rounded-xl bg-primary px-5 py-3.5 text-[15px] font-semibold text-primary-foreground transition active:opacity-80"
        >
          Salvar nova senha
        </button>
      </form>
    </main>
  );
}
