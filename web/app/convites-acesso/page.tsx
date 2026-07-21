import { CreateAccessInvitationForm } from "@/app/convites-acesso/CreateAccessInvitationForm";
import { cancelAccessInvitationAction } from "@/app/convites-acesso/actions";
import {
  requirePermission,
  resolveAuthSchoolId,
} from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export default async function AccessInvitationsPage() {
  const auth = await requirePermission("GERENCIAR_USUARIOS");
  const escolaId = await resolveAuthSchoolId(auth);
  const [responsaveis, invitations] = await Promise.all([
    prisma.responsavel.findMany({
      where: { escolaId },
      select: { id: true, nome: true },
      orderBy: { nome: "asc" },
    }),
    prisma.conviteAcesso.findMany({
      where: { escolaId },
      select: {
        id: true,
        status: true,
        expiraEm: true,
        criadoEm: true,
        responsavel: { select: { nome: true } },
      },
      orderBy: { criadoEm: "desc" },
      take: 50,
    }),
  ]);

  return (
    <main className="mx-auto w-full max-w-5xl space-y-6 p-4 sm:p-8">
      <header>
        <p className="text-sm font-medium text-primary">Acessos</p>
        <h1 className="text-3xl font-semibold tracking-tight">
          Convites do Portal da Família
        </h1>
        <p className="mt-2 text-muted-foreground">
          Tokens são exibidos uma única vez e armazenados apenas como hash.
        </p>
      </header>

      <div className="grid gap-6 lg:grid-cols-[360px_1fr]">
        <CreateAccessInvitationForm responsaveis={responsaveis} />
        <section className="rounded-2xl border bg-white p-5">
          <h2 className="font-semibold">Convites recentes</h2>
          <div className="mt-4 space-y-3">
            {invitations.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                Nenhum convite criado.
              </p>
            ) : (
              invitations.map((invitation) => (
                <article
                  key={invitation.id}
                  className="flex flex-col gap-3 rounded-xl border p-4 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div>
                    <p className="font-medium">{invitation.responsavel.nome}</p>
                    <p className="text-xs text-muted-foreground">
                      {invitation.status} · expira em{" "}
                      {invitation.expiraEm.toLocaleDateString("pt-BR")}
                    </p>
                  </div>
                  {invitation.status === "PENDENTE" ? (
                    <form action={cancelAccessInvitationAction}>
                      <input
                        type="hidden"
                        name="invitationId"
                        value={invitation.id}
                      />
                      <button
                        className="text-sm font-medium text-red-600"
                        type="submit"
                      >
                        Cancelar
                      </button>
                    </form>
                  ) : null}
                </article>
              ))
            )}
          </div>
        </section>
      </div>
    </main>
  );
}
