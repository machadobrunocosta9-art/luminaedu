import Link from "next/link";
import { redirect } from "next/navigation";
import { ChevronRight, KeyRound, LogOut, Mail } from "lucide-react";
import { getAuthContext, resolveAuthSchoolId } from "@/lib/auth";
import { logoutAction } from "@/app/login/actions";
import { prisma } from "@/lib/prisma";
import ImageUploadField from "@/components/ui/ImageUploadField";

export const dynamic = "force-dynamic";

const PAPEL_LABELS: Record<string, string> = {
  ADMINISTRADOR: "Administrador(a)",
  SECRETARIA: "Secretaria",
  COORDENACAO: "Coordenação",
  FINANCEIRO: "Financeiro",
  PROFESSOR: "Professor(a)",
};

export default async function PerfilEquipePage() {
  const auth = await getAuthContext();

  if (!auth || auth.kind !== "user" || auth.papel === "RESPONSAVEL") {
    redirect("/login?next=/perfil");
  }

  const escolaId = await resolveAuthSchoolId(auth);

  const usuario = await prisma.usuario.findFirst({
    where: { id: auth.usuarioId!, escolaId },
    select: { id: true, nome: true, email: true, papel: true, fotoUrl: true },
  });

  if (!usuario) {
    redirect("/login?next=/perfil");
  }

  async function atualizarFoto(url: string) {
    "use server";

    const authAction = await getAuthContext();

    if (!authAction || authAction.kind !== "user") {
      throw new Error("Não autorizado.");
    }

    await prisma.usuario.update({
      where: { id: authAction.usuarioId! },
      data: { fotoUrl: url },
    });
  }

  const iniciais = usuario.nome
    .split(" ")
    .slice(0, 2)
    .map((parte) => parte[0])
    .join("")
    .toUpperCase();

  return (
    <main className="mx-auto w-full max-w-md space-y-6 px-4 pb-8 pt-6 sm:px-6">
      <header className="flex flex-col items-center gap-3 pt-2 text-center">
        <ImageUploadField
          label="Alterar foto"
          pathPrefix={`usuarios/${usuario.id}/foto/`}
          clientPayload={{ kind: "foto-usuario", usuarioId: usuario.id }}
          currentUrl={usuario.fotoUrl}
          onUploaded={atualizarFoto}
        />
        <div>
          <h1 className="text-xl font-semibold tracking-tight text-foreground">
            {usuario.nome}
          </h1>
          <p className="mt-0.5 text-sm text-muted-foreground">
            {PAPEL_LABELS[usuario.papel] ?? usuario.papel}
          </p>
        </div>
        {!usuario.fotoUrl && (
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 text-lg font-semibold text-primary">
            {iniciais}
          </div>
        )}
      </header>

      <section className="overflow-hidden rounded-3xl border border-border bg-card shadow-sm">
        <div className="flex items-center gap-3 border-b border-border px-4 py-3.5">
          <Mail size={18} className="shrink-0 text-muted-foreground" />
          <span className="min-w-0 flex-1 truncate text-[15px] text-foreground">
            {usuario.email}
          </span>
        </div>
        <Link
          href="/perfil/senha"
          className="flex items-center gap-3 px-4 py-3.5 transition hover:bg-muted"
        >
          <KeyRound size={18} className="shrink-0 text-muted-foreground" />
          <span className="flex-1 text-[15px] text-foreground">
            Trocar senha
          </span>
          <ChevronRight size={18} className="shrink-0 text-muted-foreground" />
        </Link>
      </section>

      <form action={logoutAction}>
        <button
          type="submit"
          className="flex w-full items-center justify-center gap-2 rounded-2xl border border-border bg-card px-4 py-3.5 text-[15px] font-medium text-red-600 transition hover:bg-red-50"
        >
          <LogOut size={18} />
          Sair da conta
        </button>
      </form>
    </main>
  );
}
