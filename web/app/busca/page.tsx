import AppLayout from "@/components/layout/AppLayout";
import { requireAdmin, resolveAuthSchoolId } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { GraduationCap, Search, UserRound, UsersRound } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function BuscaPage({
  searchParams,
}: {
  searchParams?: Promise<{ q?: string }>;
}) {
  const auth = await requireAdmin("ACESSAR_PAINEL");
  const escolaId = await resolveAuthSchoolId(auth);
  const query = searchParams ? await searchParams : {};
  const termo = (query.q ?? "").trim();

  const busca = termo.length >= 2 ? termo : null;

  const [alunos, responsaveis, turmas] = busca
    ? await Promise.all([
        prisma.aluno.findMany({
          where: {
            escolaId,
            nome: { contains: busca, mode: "insensitive" },
          },
          select: {
            id: true,
            nome: true,
            turma: { select: { nome: true } },
            responsavel: { select: { nome: true } },
          },
          orderBy: { nome: "asc" },
          take: 20,
        }),
        prisma.responsavel.findMany({
          where: {
            escolaId,
            OR: [
              { nome: { contains: busca, mode: "insensitive" } },
              { email: { contains: busca, mode: "insensitive" } },
              { telefone: { contains: busca } },
            ],
          },
          select: {
            id: true,
            nome: true,
            email: true,
            telefone: true,
            _count: { select: { alunos: true } },
          },
          orderBy: { nome: "asc" },
          take: 20,
        }),
        prisma.turma.findMany({
          where: {
            escolaId,
            nome: { contains: busca, mode: "insensitive" },
          },
          select: {
            id: true,
            nome: true,
            segmento: true,
            turno: true,
            _count: { select: { alunos: true } },
          },
          orderBy: { nome: "asc" },
          take: 20,
        }),
      ])
    : [[], [], []];

  const total = alunos.length + responsaveis.length + turmas.length;

  return (
    <AppLayout>
      <div className="mb-6">
        <h1 className="text-3xl font-semibold tracking-tight text-foreground">
          Busca
        </h1>
        {busca && (
          <p className="mt-2 text-sm text-muted-foreground">
            {total} resultado(s) para “{busca}”.
          </p>
        )}
      </div>

      <form action="/busca" method="get" className="mb-8">
        <div className="flex h-13 items-center gap-3 rounded-2xl border border-border bg-card px-4 shadow-sm">
          <Search size={18} className="shrink-0 text-muted-foreground" />
          <input
            name="q"
            defaultValue={termo}
            autoFocus
            placeholder="Buscar aluno, responsável ou turma..."
            className="h-12 w-full bg-transparent text-sm outline-none placeholder:text-muted-foreground"
          />
        </div>
      </form>

      {!busca ? (
        <p className="rounded-3xl border border-dashed border-border p-8 text-center text-sm text-muted-foreground">
          Digite pelo menos 2 letras para buscar.
        </p>
      ) : total === 0 ? (
        <p className="rounded-3xl border border-dashed border-border p-8 text-center text-sm text-muted-foreground">
          Nenhum resultado encontrado para “{busca}”.
        </p>
      ) : (
        <div className="space-y-8">
          {alunos.length > 0 && (
            <section>
              <h2 className="mb-3 flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                <GraduationCap size={16} />
                Alunos ({alunos.length})
              </h2>
              <div className="space-y-2">
                {alunos.map((aluno) => (
                  <Link
                    key={aluno.id}
                    href={`/alunos/${aluno.id}`}
                    className="block rounded-2xl border border-border bg-card p-4 transition hover:border-primary/30"
                  >
                    <p className="font-semibold text-foreground">{aluno.nome}</p>
                    <p className="mt-1 text-sm text-muted-foreground">
                      {aluno.turma?.nome ?? "Sem turma"} ·{" "}
                      {aluno.responsavel?.nome ?? "Sem responsável"}
                    </p>
                  </Link>
                ))}
              </div>
            </section>
          )}

          {responsaveis.length > 0 && (
            <section>
              <h2 className="mb-3 flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                <UserRound size={16} />
                Responsáveis ({responsaveis.length})
              </h2>
              <div className="space-y-2">
                {responsaveis.map((responsavel) => (
                  <Link
                    key={responsavel.id}
                    href="/responsaveis"
                    className="block rounded-2xl border border-border bg-card p-4 transition hover:border-primary/30"
                  >
                    <p className="font-semibold text-foreground">
                      {responsavel.nome}
                    </p>
                    <p className="mt-1 text-sm text-muted-foreground">
                      {responsavel.telefone}
                      {responsavel.email ? ` · ${responsavel.email}` : ""} ·{" "}
                      {responsavel._count.alunos} aluno(s)
                    </p>
                  </Link>
                ))}
              </div>
            </section>
          )}

          {turmas.length > 0 && (
            <section>
              <h2 className="mb-3 flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                <UsersRound size={16} />
                Turmas ({turmas.length})
              </h2>
              <div className="space-y-2">
                {turmas.map((turma) => (
                  <Link
                    key={turma.id}
                    href="/turmas"
                    className="block rounded-2xl border border-border bg-card p-4 transition hover:border-primary/30"
                  >
                    <p className="font-semibold text-foreground">{turma.nome}</p>
                    <p className="mt-1 text-sm text-muted-foreground">
                      {turma.segmento} · {turma.turno} · {turma._count.alunos}{" "}
                      aluno(s)
                    </p>
                  </Link>
                ))}
              </div>
            </section>
          )}
        </div>
      )}
    </AppLayout>
  );
}
