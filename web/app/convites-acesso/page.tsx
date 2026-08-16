import { CreateAccessInvitationForm } from "@/app/convites-acesso/CreateAccessInvitationForm";
import {
  cancelAccessInvitationAction,
  deleteUserAccessAction,
} from "@/app/convites-acesso/actions";
import AppLayout from "@/components/layout/AppLayout";
import {
  requirePermission,
  resolveAuthSchoolId,
} from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

const roleLabels = {
  ADMINISTRADOR: "Administrador",
  SECRETARIA: "Secretaria",
  COORDENACAO: "Coordenação",
  FINANCEIRO: "Financeiro",
  PROFESSOR: "Professor(a)",
  RESPONSAVEL: "Responsável",
} as const;

const userStatusStyles = {
  ATIVO: "bg-emerald-50 text-emerald-700",
  PENDENTE: "bg-amber-50 text-amber-700",
  BLOQUEADO: "bg-red-50 text-red-700",
} as const;

const invitationStatusStyles = {
  PENDENTE: "bg-amber-50 text-amber-700",
  UTILIZADO: "bg-emerald-50 text-emerald-700",
  CANCELADO: "bg-slate-100 text-slate-600",
  EXPIRADO: "bg-red-50 text-red-700",
} as const;

export default async function AccessInvitationsPage() {
  const auth = await requirePermission("GERENCIAR_USUARIOS");
  const escolaId = await resolveAuthSchoolId(auth);
  const [responsaveis, invitations, users] = await Promise.all([
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
    prisma.usuario.findMany({
      where: { escolaId },
      select: {
        id: true,
        nome: true,
        email: true,
        papel: true,
        status: true,
        ultimoAcessoEm: true,
        responsavel: {
          select: {
            nome: true,
          },
        },
      },
      orderBy: [{ papel: "asc" }, { nome: "asc" }],
    }),
  ]);

  const now = new Date();
  const pendingInvitations = invitations.filter(
    (invitation) =>
      invitation.status === "PENDENTE" && invitation.expiraEm > now,
  ).length;

  return (
    <AppLayout>
      <div className="mx-auto w-full max-w-6xl space-y-6">
        <header>
          <p className="text-sm font-medium text-muted-foreground">
            Configurações
          </p>
          <h1 className="mt-2 text-4xl font-semibold tracking-tight text-foreground">
            Usuários e acessos
          </h1>
          <p className="mt-3 max-w-3xl text-base leading-7 text-muted-foreground">
            Gerencie contas e convites seguros para o Portal da Família.
            Tokens são armazenados somente como hash.
          </p>
        </header>

        <div className="grid gap-4 sm:grid-cols-3">
          <div className="rounded-3xl border border-border bg-card p-5 shadow-sm">
            <p className="text-sm text-muted-foreground">Usuários</p>
            <p className="mt-2 text-3xl font-semibold text-foreground">
              {users.length}
            </p>
          </div>
          <div className="rounded-3xl border border-border bg-card p-5 shadow-sm">
            <p className="text-sm text-muted-foreground">Contas ativas</p>
            <p className="mt-2 text-3xl font-semibold text-foreground">
              {users.filter((user) => user.status === "ATIVO").length}
            </p>
          </div>
          <div className="rounded-3xl border border-border bg-card p-5 shadow-sm">
            <p className="text-sm text-muted-foreground">Convites pendentes</p>
            <p className="mt-2 text-3xl font-semibold text-foreground">
              {pendingInvitations}
            </p>
          </div>
        </div>

        <section className="overflow-hidden rounded-3xl border border-border bg-card shadow-sm">
          <div className="border-b border-border p-6">
            <h2 className="text-xl font-semibold text-foreground">Usuários</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Contas vinculadas a esta escola.
            </p>
          </div>
          {users.length === 0 ? (
            <p className="p-6 text-sm text-muted-foreground">
              Nenhum usuário cadastrado.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[720px] text-left text-sm">
                <thead className="bg-muted/40 text-xs uppercase tracking-wide text-muted-foreground">
                  <tr>
                    <th className="px-6 py-3 font-medium">Usuário</th>
                    <th className="px-6 py-3 font-medium">Papel</th>
                    <th className="px-6 py-3 font-medium">Status</th>
                    <th className="px-6 py-3 font-medium">
                      Responsável vinculado
                    </th>
                    <th className="px-6 py-3 font-medium">Último acesso</th>
                    <th className="px-6 py-3 font-medium">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {users.map((user) => (
                    <tr key={user.id}>
                      <td className="px-6 py-4">
                        <p className="font-medium text-foreground">{user.nome}</p>
                        <p className="mt-1 text-xs text-muted-foreground">
                          {user.email}
                        </p>
                      </td>
                      <td className="px-6 py-4 text-muted-foreground">
                        {roleLabels[user.papel]}
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${userStatusStyles[user.status]}`}
                        >
                          {user.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-muted-foreground">
                        {user.responsavel?.nome ?? "—"}
                      </td>
                      <td className="px-6 py-4 text-muted-foreground">
                        {user.ultimoAcessoEm
                          ? user.ultimoAcessoEm.toLocaleString("pt-BR")
                          : "Ainda não acessou"}
                      </td>
                      <td className="px-6 py-4">
                        <form action={deleteUserAccessAction}>
                          <input type="hidden" name="userId" value={user.id} />
                          <button
                            type="submit"
                            className="rounded-xl px-3 py-2 text-xs font-semibold text-red-600 transition hover:bg-red-50"
                          >
                            Excluir acesso
                          </button>
                        </form>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>

        <div className="grid gap-6 xl:grid-cols-[380px_1fr]">
          <CreateAccessInvitationForm responsaveis={responsaveis} />
          <section className="rounded-3xl border border-border bg-card p-6 shadow-sm">
            <h2 className="text-xl font-semibold text-foreground">
              Convites recentes
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Links só podem ser copiados no momento em que são gerados.
            </p>
            <div className="mt-5 space-y-3">
              {invitations.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  Nenhum convite criado.
                </p>
              ) : (
                invitations.map((invitation) => {
                  const displayStatus =
                    invitation.status === "PENDENTE" &&
                    invitation.expiraEm <= now
                      ? "EXPIRADO"
                      : invitation.status;

                  return (
                    <article
                      key={invitation.id}
                      className="flex flex-col gap-3 rounded-2xl border border-border p-4 sm:flex-row sm:items-center sm:justify-between"
                    >
                      <div>
                        <p className="font-medium text-foreground">
                          {invitation.responsavel.nome}
                        </p>
                        <div className="mt-2 flex flex-wrap items-center gap-2">
                          <span
                            className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${invitationStatusStyles[displayStatus]}`}
                          >
                            {displayStatus}
                          </span>
                          <span className="text-xs text-muted-foreground">
                            Expira em{" "}
                            {invitation.expiraEm.toLocaleDateString("pt-BR")}
                          </span>
                        </div>
                      </div>
                      {displayStatus === "PENDENTE" ? (
                        <form action={cancelAccessInvitationAction}>
                          <input
                            type="hidden"
                            name="invitationId"
                            value={invitation.id}
                          />
                          <button
                            className="rounded-xl px-3 py-2 text-sm font-semibold text-red-600 transition hover:bg-red-50"
                            type="submit"
                          >
                            Revogar convite
                          </button>
                        </form>
                      ) : null}
                    </article>
                  );
                })
              )}
            </div>
          </section>
        </div>
      </div>
    </AppLayout>
  );
}
