import { ActivationForm } from "@/app/ativar-conta/[token]/ActivationForm";
import { getAccessInvitationAvailability } from "@/lib/access-invitations";
import { prisma } from "@/lib/prisma";
import { hashToken, maskEmail } from "@/lib/security/tokens";

export const runtime = "nodejs";

export default async function ActivateAccountPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  const invitation = await prisma.conviteAcesso.findUnique({
    where: { tokenHash: hashToken(token) },
    select: {
      status: true,
      expiraEm: true,
      utilizadoEm: true,
      canceladoEm: true,
      responsavel: {
        select: { nome: true, email: true },
      },
    },
  });
  const availability = invitation
    ? getAccessInvitationAvailability({
        status: invitation.status,
        expiresAt: invitation.expiraEm,
        usedAt: invitation.utilizadoEm,
        canceledAt: invitation.canceladoEm,
      })
    : null;

  return (
    <main className="flex min-h-screen items-center justify-center bg-secondary/50 p-4">
      <section className="w-full max-w-md rounded-3xl border bg-white p-7 shadow-sm">
        <p className="text-sm font-semibold text-primary">Portal da Família</p>
        <h1 className="mt-2 text-2xl font-semibold">Ative seu acesso</h1>
        {!invitation || availability !== "valid" ? (
          <div className="mt-5 rounded-xl bg-muted p-4 text-sm">
            {availability === "used"
              ? "Este convite já foi utilizado."
              : availability === "canceled"
                ? "Este convite foi cancelado."
                : availability === "expired"
                  ? "Este convite expirou."
                  : "Este convite não é válido."}
          </div>
        ) : (
          <>
            <p className="mt-3 text-sm leading-6 text-muted-foreground">
              Confirme seu acesso como <strong>{invitation.responsavel.nome}</strong>
              {invitation.responsavel.email
                ? ` (${maskEmail(invitation.responsavel.email)})`
                : ""}
              .
            </p>
            <ActivationForm token={token} />
          </>
        )}
      </section>
    </main>
  );
}
