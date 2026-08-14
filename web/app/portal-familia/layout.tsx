import Link from "next/link";
import { logoutAction } from "@/app/login/actions";
import { requireFamily } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export default async function FamilyPortalLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const auth = await requireFamily();

  const [comunicadosPendentes, escola] = await Promise.all([
    prisma.destinatarioComunicado.count({
      where: {
        escolaId: auth.escolaId,
        responsavelId: auth.responsavelId,
        status: { not: "RESPONDIDO" },
        comunicado: { status: "ENVIADO" },
      },
    }),
    prisma.escola.findUnique({
      where: { id: auth.escolaId },
      select: { nome: true, logoUrl: true },
    }),
  ]);

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-white">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-4 sm:px-6">
          <Link
            href="/portal-familia"
            className="flex items-center gap-3 font-semibold text-primary"
          >
            {escola?.logoUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={escola.logoUrl}
                alt={escola.nome}
                className="h-9 w-9 rounded-xl object-cover"
              />
            ) : null}
            <span>{escola?.nome ?? "Lumina"} · Portal da Família</span>
          </Link>
          <nav className="flex items-center gap-4">
            <Link
              href="/portal-familia/comunicados"
              className="relative text-sm font-medium text-foreground transition hover:text-primary"
            >
              Comunicados
              {comunicadosPendentes > 0 && (
                <span className="ml-2 inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-primary px-1.5 text-xs font-semibold text-primary-foreground">
                  {comunicadosPendentes}
                </span>
              )}
            </Link>
            <span className="hidden text-sm text-muted-foreground sm:inline">
              {auth.nome}
            </span>
            <form action={logoutAction}>
              <button
                type="submit"
                className="rounded-lg border px-3 py-2 text-sm font-medium"
              >
                Sair
              </button>
            </form>
          </nav>
        </div>
      </header>
      {children}
    </div>
  );
}
