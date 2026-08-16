import Link from "next/link";
import { ChevronRight, KeyRound, LogOut, Mail, Phone } from "lucide-react";
import { logoutAction } from "@/app/login/actions";
import { requireFamily } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export default async function PerfilPage() {
  const auth = await requireFamily();

  const responsavel = await prisma.responsavel.findFirst({
    where: { id: auth.responsavelId, escolaId: auth.escolaId },
    select: { nome: true, email: true, telefone: true },
  });

  const iniciais = (responsavel?.nome ?? auth.nome)
    .split(" ")
    .slice(0, 2)
    .map((parte) => parte[0])
    .join("")
    .toUpperCase();

  return (
    <main className="mx-auto w-full max-w-md space-y-6 px-4 pb-8 pt-6 sm:px-6">
      <header className="flex flex-col items-center gap-3 pt-2 text-center">
        <div className="flex h-20 w-20 items-center justify-center rounded-full bg-primary text-2xl font-semibold text-primary-foreground shadow-sm">
          {iniciais}
        </div>
        <div>
          <h1 className="text-xl font-semibold tracking-tight text-foreground">
            {responsavel?.nome ?? auth.nome}
          </h1>
          <p className="mt-0.5 text-sm text-[#8e8e93]">Responsável</p>
        </div>
      </header>

      <section className="overflow-hidden rounded-[22px] bg-white shadow-[0_1px_2px_rgba(0,0,0,0.04),0_1px_8px_rgba(0,0,0,0.04)]">
        {responsavel?.email && (
          <div className="flex items-center gap-3 border-b border-black/5 px-4 py-3.5">
            <Mail size={18} className="shrink-0 text-[#8e8e93]" />
            <span className="min-w-0 flex-1 truncate text-[15px] text-foreground">
              {responsavel.email}
            </span>
          </div>
        )}
        {responsavel?.telefone && (
          <div className="flex items-center gap-3 px-4 py-3.5">
            <Phone size={18} className="shrink-0 text-[#8e8e93]" />
            <span className="text-[15px] text-foreground">
              {responsavel.telefone}
            </span>
          </div>
        )}
      </section>

      <section className="overflow-hidden rounded-[22px] bg-white shadow-[0_1px_2px_rgba(0,0,0,0.04),0_1px_8px_rgba(0,0,0,0.04)]">
        <Link
          href="/portal-familia/senha"
          className="flex items-center gap-3 px-4 py-3.5 active:bg-black/[0.03]"
        >
          <KeyRound size={18} className="shrink-0 text-[#8e8e93]" />
          <span className="flex-1 text-[15px] text-foreground">
            Trocar senha
          </span>
          <ChevronRight size={18} className="shrink-0 text-[#c7c7cc]" />
        </Link>
      </section>

      <form action={logoutAction}>
        <button
          type="submit"
          className="flex w-full items-center justify-center gap-2 rounded-[18px] bg-white px-4 py-3.5 text-[15px] font-medium text-red-500 shadow-[0_1px_2px_rgba(0,0,0,0.04),0_1px_8px_rgba(0,0,0,0.04)] active:bg-black/[0.03]"
        >
          <LogOut size={18} />
          Sair da conta
        </button>
      </form>
    </main>
  );
}
