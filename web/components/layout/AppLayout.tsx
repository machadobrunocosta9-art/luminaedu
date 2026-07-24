import type { ReactNode } from "react";
import AppLayoutClient from "@/components/layout/AppLayoutClient";
import { getAuthContext } from "@/lib/auth";

type AppLayoutProps = {
  children: ReactNode;
};

export default async function AppLayout({ children }: AppLayoutProps) {
  const auth = await getAuthContext();

  return (
    <AppLayoutClient canManageUsers={auth?.papel === "ADMINISTRADOR"}>
      {children}
    </AppLayoutClient>
  );
}
