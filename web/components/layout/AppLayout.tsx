import type { ReactNode } from "react";
import AppLayoutClient from "@/components/layout/AppLayoutClient";
import { getAuthContext, resolveAuthSchoolId } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

type AppLayoutProps = {
  children: ReactNode;
};

export default async function AppLayout({ children }: AppLayoutProps) {
  const auth = await getAuthContext();

  let escolaNome: string | null = null;
  let escolaLogoUrl: string | null = null;
  let userNome: string | null = null;
  let userFotoUrl: string | null = null;

  if (auth) {
    const escolaId = await resolveAuthSchoolId(auth);
    const escola = await prisma.escola.findUnique({
      where: { id: escolaId },
      select: { nome: true, logoUrl: true },
    });

    escolaNome = escola?.nome ?? null;
    escolaLogoUrl = escola?.logoUrl ?? null;

    if (auth.kind === "user" && auth.usuarioId) {
      const usuario = await prisma.usuario.findUnique({
        where: { id: auth.usuarioId },
        select: { fotoUrl: true },
      });

      userFotoUrl = usuario?.fotoUrl ?? null;
    }

    userNome = auth.nome;
  }

  return (
    <AppLayoutClient
      escolaNome={escolaNome}
      escolaLogoUrl={escolaLogoUrl}
      userNome={userNome}
      userFotoUrl={userFotoUrl}
    >
      {children}
    </AppLayoutClient>
  );
}
