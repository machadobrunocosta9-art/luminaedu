import Link from "next/link";
import {
  BellRing,
  CheckCircle2,
  ChevronRight,
  MessageCircle,
  MessagesSquare,
} from "lucide-react";
import { requireFamily } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

function getSaudacao() {
  const hora = new Date().getHours();
  if (hora < 12) return "Bom dia";
  if (hora < 18) return "Boa tarde";
  return "Boa noite";
}

export default async function FamilyPortalPage() {
  const auth = await requireFamily();
  const primeiroNome = auth.nome.split(" ")[0];

  const children = await prisma.aluno.findMany({
    where: {
      escolaId: auth.escolaId,
      responsavelId: auth.responsavelId,
    },
    select: {
      id: true,
      nome: true,
      fotoUrl: true,
      turma: { select: { nome: true } },
      matriculas: {
        select: {
          anoLetivo: true,
          status: true,
          documentos: {
            select: { status: true, obrigatorio: true },
          },
        },
        orderBy: { anoLetivo: "desc" },
        take: 1,
      },
    },
    orderBy: { nome: "asc" },
  });

  const studentIds = children.map((student) => student.id);

  const [pendingComunicadosGroups, pendingOcorrenciasGroups] =
    studentIds.length === 0
      ? [[], []]
      : await Promise.all([
          prisma.destinatarioComunicado.groupBy({
            by: ["alunoId"],
            where: {
              escolaId: auth.escolaId,
              responsavelId: auth.responsavelId,
              alunoId: { in: studentIds },
              status: { not: "RESPONDIDO" },
              comunicado: { status: "ENVIADO" },
            },
            _count: { _all: true },
          }),
          prisma.ocorrenciaAluno.groupBy({
            by: ["alunoId"],
            where: {
              escolaId: auth.escolaId,
              alunoId: { in: studentIds },
              enviarParaResponsavel: true,
              cienciaConfirmada: false,
            },
            _count: { _all: true },
          }),
        ]);

  const pendingComunicadosByAluno = new Map(
    pendingComunicadosGroups.map((group) => [group.alunoId, group._count._all]),
  );
  const pendingOcorrenciasByAluno = new Map(
    pendingOcorrenciasGroups.map((group) => [group.alunoId, group._count._all]),
  );

  const totalComunicadosPendentes = pendingComunicadosGroups.reduce(
    (soma, grupo) => soma + grupo._count._all,
    0,
  );
  const totalCienciasPendentes = pendingOcorrenciasGroups.reduce(
    (soma, grupo) => soma + grupo._count._all,
    0,
  );
  const totalPendenciasGeral =
    totalComunicadosPendentes + totalCienciasPendentes;

  const atalhos = [
    {
      href: "/portal-familia/comunicados",
      label: "Comunicados",
      icon: MessageCircle,
      badge: totalComunicadosPendentes,
      cor: "bg-[#eef0ff] text-[#5b3fd6]",
    },
    {
      href: "/portal-familia/mensagens",
      label: "Falar com a escola",
      icon: MessagesSquare,
      badge: 0,
      cor: "bg-[#e8f7f0] text-[#0f9d63]",
    },
  ];

  return (
    <main className="mx-auto w-full max-w-md space-y-6 px-4 pt-6 sm:px-6">
      <header>
        <p className="text-[13px] font-medium uppercase tracking-wide text-[#8e8e93]">
          {getSaudacao()}
        </p>
        <h1 className="mt-0.5 text-[28px] font-semibold tracking-tight text-foreground">
          {primeiroNome}
        </h1>
      </header>

      {children.length > 0 && (
        <section
          className={`rounded-[22px] p-4 ${
            totalPendenciasGeral > 0
              ? "bg-primary text-primary-foreground"
              : "bg-white shadow-[0_1px_2px_rgba(0,0,0,0.04),0_1px_8px_rgba(0,0,0,0.04)]"
          }`}
        >
          <div className="flex items-center gap-3">
            <div
              className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-full ${
                totalPendenciasGeral > 0
                  ? "bg-white/20"
                  : "bg-emerald-50 text-emerald-600"
              }`}
            >
              {totalPendenciasGeral > 0 ? (
                <BellRing size={20} />
              ) : (
                <CheckCircle2 size={20} />
              )}
            </div>

            <div className="min-w-0 flex-1">
              <p className="text-[15px] font-semibold">
                {totalPendenciasGeral > 0
                  ? `${totalPendenciasGeral} item(ns) esperando você`
                  : "Tudo em dia"}
              </p>
              <p
                className={`mt-0.5 text-[12px] ${
                  totalPendenciasGeral > 0
                    ? "text-primary-foreground/80"
                    : "text-[#8e8e93]"
                }`}
              >
                {totalPendenciasGeral > 0
                  ? "Toque para ver o que a escola enviou."
                  : "Nenhuma pendência no momento."}
              </p>
            </div>

            {totalPendenciasGeral > 0 && (
              <Link
                href="/portal-familia/comunicados"
                className="shrink-0 rounded-full bg-white/20 px-4 py-2 text-[13px] font-semibold"
              >
                Ver
              </Link>
            )}
          </div>
        </section>
      )}

      <section className="grid grid-cols-2 gap-3">
        {atalhos.map((atalho) => {
          const Icon = atalho.icon;

          return (
            <Link
              key={atalho.href}
              href={atalho.href}
              className="relative rounded-[22px] bg-white p-4 shadow-[0_1px_2px_rgba(0,0,0,0.04),0_1px_8px_rgba(0,0,0,0.04)] transition active:scale-[0.98]"
            >
              <div
                className={`flex h-11 w-11 items-center justify-center rounded-full ${atalho.cor}`}
              >
                <Icon size={20} />
              </div>
              <p className="mt-3 text-[14px] font-semibold leading-tight text-foreground">
                {atalho.label}
              </p>

              {atalho.badge > 0 && (
                <span className="absolute right-3 top-3 flex h-5 min-w-5 items-center justify-center rounded-full bg-red-500 px-1.5 text-[11px] font-bold text-white">
                  {atalho.badge}
                </span>
              )}
            </Link>
          );
        })}
      </section>

      <section className="space-y-3">
        <h2 className="text-[13px] font-semibold uppercase tracking-wide text-[#8e8e93]">
          {children.length === 1 ? "Seu filho(a)" : "Seus filhos"}
        </h2>
        {children.length === 0 ? (
          <div className="rounded-[22px] bg-white p-6 text-center text-sm text-[#8e8e93] shadow-[0_1px_2px_rgba(0,0,0,0.04),0_1px_8px_rgba(0,0,0,0.04)]">
            Nenhum aluno está vinculado a esta conta. Entre em contato com a
            escola.
          </div>
        ) : (
          children.map((student) => {
            const enrollment = student.matriculas[0];
            const pendingDocuments =
              enrollment?.documentos.filter(
                (document) =>
                  document.obrigatorio &&
                  !["APROVADO", "CANCELADO"].includes(document.status),
              ).length ?? 0;
            const pendingComunicados =
              pendingComunicadosByAluno.get(student.id) ?? 0;
            const pendingOcorrencias =
              pendingOcorrenciasByAluno.get(student.id) ?? 0;
            const totalPendencias =
              pendingDocuments + pendingComunicados + pendingOcorrencias;

            const iniciais = student.nome
              .split(" ")
              .slice(0, 2)
              .map((parte) => parte[0])
              .join("")
              .toUpperCase();

            return (
              <Link
                key={student.id}
                href={`/portal-familia/filhos/${student.id}`}
                className="flex items-center gap-3.5 rounded-[22px] bg-white p-4 shadow-[0_1px_2px_rgba(0,0,0,0.04),0_1px_8px_rgba(0,0,0,0.04)] transition active:scale-[0.98] active:bg-black/[0.02]"
              >
                {student.fotoUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={student.fotoUrl}
                    alt={student.nome}
                    className="h-14 w-14 shrink-0 rounded-full object-cover"
                  />
                ) : (
                  <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-primary/10 text-base font-semibold text-primary">
                    {iniciais}
                  </div>
                )}

                <div className="min-w-0 flex-1">
                  <h2 className="truncate text-[17px] font-semibold text-foreground">
                    {student.nome}
                  </h2>
                  <p className="mt-0.5 text-[13px] text-[#8e8e93]">
                    {student.turma?.nome ?? "Turma ainda não definida"}
                  </p>

                  {totalPendencias > 0 ? (
                    <span className="mt-1.5 inline-flex items-center gap-1 text-[12px] font-medium text-primary">
                      <span className="h-1.5 w-1.5 rounded-full bg-primary" />
                      {totalPendencias} pendência(s)
                    </span>
                  ) : (
                    <span className="mt-1.5 inline-flex items-center gap-1 text-[12px] font-medium text-emerald-600">
                      <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                      Tudo em dia
                    </span>
                  )}
                </div>

                <ChevronRight size={18} className="shrink-0 text-[#c7c7cc]" />
              </Link>
            );
          })
        )}
      </section>
    </main>
  );
}
