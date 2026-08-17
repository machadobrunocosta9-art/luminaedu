import Link from "next/link";
import { requireProfessor } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import ProfessorTabBar from "@/components/professor/ProfessorTabBar";

export default async function ProfessorLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const auth = await requireProfessor();

  const escola = await prisma.escola.findUnique({
    where: { id: auth.escolaId ?? undefined },
    select: { nome: true, logoUrl: true },
  });

  return (
    <div className="min-h-screen bg-[#f5f5f7]">
      <header className="sticky top-0 z-30 border-b border-black/5 bg-[#f5f5f7]/85 backdrop-blur-xl">
        <div className="mx-auto flex max-w-md items-center gap-2.5 px-4 py-3 sm:px-6">
          <Link href="/professor" className="flex min-w-0 items-center gap-2.5">
            {escola?.logoUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={escola.logoUrl}
                alt={escola.nome}
                className="h-8 w-8 shrink-0 rounded-[10px] object-cover"
              />
            ) : (
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-[10px] bg-primary text-xs font-semibold text-primary-foreground">
                {(escola?.nome ?? "L").slice(0, 1)}
              </div>
            )}
            <span className="truncate text-[14px] font-semibold text-foreground">
              {escola?.nome ?? "Portal do Professor"}
            </span>
          </Link>
        </div>
      </header>

      <div className="pb-24">{children}</div>

      <ProfessorTabBar />
    </div>
  );
}
