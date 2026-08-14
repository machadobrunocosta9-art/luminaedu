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

  if (auth) {
    const escolaId = await resolveAuthSchoolId(auth);
    const escola = await prisma.escola.findUnique({
      where: { id: escolaId },
      select: { nome: true, logoUrl: true },
    });

    escolaNome = escola?.nome ?? null;
    escolaLogoUrl = escola?.logoUrl ?? null;
  }

  return (
    <AppLayoutClient
      canManageUsers={auth?.papel === "ADMINISTRADOR"}
      escolaNome={escolaNome}
      escolaLogoUrl={escolaLogoUrl}
    >
      {children}
    </AppLayoutClient>
  );
}
