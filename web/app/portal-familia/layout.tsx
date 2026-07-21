import Link from "next/link";
import { logoutAction } from "@/app/login/actions";
import { requireFamily } from "@/lib/auth";

export default async function FamilyPortalLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const auth = await requireFamily();

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-white">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-4 sm:px-6">
          <Link href="/portal-familia" className="font-semibold text-primary">
            Lumina · Portal da Família
          </Link>
          <div className="flex items-center gap-3">
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
          </div>
        </div>
      </header>
      {children}
    </div>
  );
}
