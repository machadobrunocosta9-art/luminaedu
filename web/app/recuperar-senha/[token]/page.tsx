import { PasswordResetForm } from "@/app/recuperar-senha/[token]/PasswordResetForm";
import { prisma } from "@/lib/prisma";
import { hashToken } from "@/lib/security/tokens";

export const runtime = "nodejs";

export default async function PasswordResetPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  const recovery = await prisma.recuperacaoSenha.findUnique({
    where: { tokenHash: hashToken(token) },
    select: {
      expiraEm: true,
      utilizadoEm: true,
      revogadoEm: true,
      usuario: { select: { status: true } },
    },
  });
  const available = Boolean(
    recovery &&
      recovery.usuario.status === "ATIVO" &&
      !recovery.utilizadoEm &&
      !recovery.revogadoEm &&
      recovery.expiraEm > new Date(),
  );

  return (
    <main className="flex min-h-screen items-center justify-center bg-secondary/50 p-4">
      <section className="w-full max-w-md rounded-3xl border bg-white p-7 shadow-sm">
        <p className="text-sm font-semibold text-primary">Acesso seguro</p>
        <h1 className="mt-2 text-2xl font-semibold">Definir nova senha</h1>
        {available ? (
          <PasswordResetForm token={token} />
        ) : (
          <p className="mt-5 rounded-xl bg-muted p-4 text-sm">
            Este link é inválido ou não está mais disponível.
          </p>
        )}
      </section>
    </main>
  );
}
