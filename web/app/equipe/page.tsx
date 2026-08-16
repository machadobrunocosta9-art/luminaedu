import AppLayout from "@/components/layout/AppLayout";
import { requireAdmin, resolveAuthSchoolId } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { Plus, UserRound } from "lucide-react";

export const dynamic = "force-dynamic";

const PAPEL_LABELS: Record<string, string> = {
  ADMINISTRADOR: "Administrador(a)",
  SECRETARIA: "Secretaria",
  COORDENACAO: "Coordenação",
  FINANCEIRO: "Financeiro",
  PROFESSOR: "Professor(a)",
  RESPONSAVEL: "Responsável",
};

const STATUS_CLASSES: Record<string, string> = {
  ATIVO: "bg-emerald-50 text-emerald-700",
  PENDENTE: "bg-amber-50 text-amber-700",
  BLOQUEADO: "bg-red-50 text-red-700",
};

export default async function EquipePage() {
  const auth = await requireAdmin("ADMINISTRAR_SISTEMA");
  const escolaId = await resolveAuthSchoolId(auth);

  const equipe = await prisma.usuario.findMany({
    where: { escolaId, papel: { not: "RESPONSAVEL" } },
    include: {
      atribuicoes: {
        include: { turma: true, disciplina: true },
      },
    },
    orderBy: [{ papel: "asc" }, { nome: "asc" }],
  });

  return (
    <AppLayout>
      <div className="mb-8 flex flex-wrap items-start justify-between gap-6">
        <div>
          <p className="text-sm font-medium text-muted-foreground">
            Configurações
          </p>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight text-foreground">
            Equipe
          </h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
            Contas de professores(as) e demais funcionários com login próprio
            no sistema.
          </p>
        </div>

        <Link
          href="/equipe/novo"
          className="inline-flex items-center gap-2 rounded-2xl bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground transition hover:opacity-90"
        >
          <Plus size={18} />
          Adicionar pessoa
        </Link>
      </div>

      {equipe.length === 0 ? (
        <div className="rounded-3xl border border-dashed border-border p-8 text-center text-sm text-muted-foreground">
          Nenhuma conta de equipe cadastrada ainda.
        </div>
      ) : (
        <div className="space-y-3">
          {equipe.map((pessoa) => (
            <div
              key={pessoa.id}
              className="flex flex-wrap items-center justify-between gap-4 rounded-3xl border border-border bg-card p-5 shadow-sm"
            >
              <div className="flex items-center gap-3">
                {pessoa.fotoUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={pessoa.fotoUrl}
                    alt={pessoa.nome}
                    className="h-11 w-11 rounded-full object-cover"
                  />
                ) : (
                  <div className="flex h-11 w-11 items-center justify-center rounded-full bg-primary/10 text-primary">
                    <UserRound size={18} />
                  </div>
                )}
                <div>
                  <p className="font-semibold text-foreground">{pessoa.nome}</p>
                  <p className="text-sm text-muted-foreground">{pessoa.email}</p>
                  {pessoa.papel === "PROFESSOR" && (
                    <p className="mt-1 text-xs text-muted-foreground">
                      {pessoa.atribuicoes.length === 0
                        ? "Sem turmas atribuídas"
                        : pessoa.atribuicoes
                            .map(
                              (atribuicao) =>
                                `${atribuicao.turma.nome} · ${atribuicao.disciplina.nome}`,
                            )
                            .join(", ")}
                    </p>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-3">
                <span
                  className={`rounded-full px-3 py-1 text-xs font-semibold ${
                    STATUS_CLASSES[pessoa.status] ?? ""
                  }`}
                >
                  {pessoa.status}
                </span>
                <span className="rounded-full bg-muted px-3 py-1 text-xs font-semibold text-foreground">
                  {PAPEL_LABELS[pessoa.papel] ?? pessoa.papel}
                </span>
                {pessoa.papel === "PROFESSOR" && (
                  <Link
                    href={`/equipe/${pessoa.id}`}
                    className="text-sm font-semibold text-primary"
                  >
                    Turmas
                  </Link>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </AppLayout>
  );
}
