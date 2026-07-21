import AppLayout from "@/components/layout/AppLayout";
import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import {
  ArrowLeft,
  Banknote,
  CalendarClock,
  CheckCircle2,
  CircleDollarSign,
  RotateCcw,
  WalletCards,
} from "lucide-react";
import { revalidatePath } from "next/cache";
import Link from "next/link";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

const FORMAS_PAGAMENTO = [
  "PIX",
  "CARTAO",
  "BOLETO",
  "DINHEIRO",
  "TRANSFERENCIA",
  "OUTRO",
] as const;

type FormaPagamento =
  (typeof FORMAS_PAGAMENTO)[number];

function getString(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value.trim() : "";
}

function converterValorCentavos(valor: string) {
  const normalizado = valor
    .replace(/\s/g, "")
    .replace(/R\$/gi, "")
    .replace(/\./g, "")
    .replace(",", ".");

  const numero = Number(normalizado);

  if (!Number.isFinite(numero) || numero <= 0) {
    return null;
  }

  return Math.round(numero * 100);
}

function converterData(data: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(data)) {
    return null;
  }

  const resultado = new Date(`${data}T12:00:00`);
  return Number.isNaN(resultado.getTime())
    ? null
    : resultado;
}

function isFormaPagamento(
  forma: string,
): forma is FormaPagamento {
  return FORMAS_PAGAMENTO.includes(
    forma as FormaPagamento,
  );
}

async function salvarCobranca(formData: FormData) {
  "use server";

  await requireAdmin("GERENCIAR_FINANCEIRO");

  const matriculaId = getString(formData, "matriculaId");
  const descricao = getString(formData, "descricao");
  const valorCentavos = converterValorCentavos(
    getString(formData, "valor"),
  );
  const vencimentoTexto = getString(
    formData,
    "vencimento",
  );
  const vencimento = vencimentoTexto
    ? converterData(vencimentoTexto)
    : null;

  if (
    !matriculaId ||
    !descricao ||
    !valorCentavos ||
    (vencimentoTexto && !vencimento)
  ) {
    throw new Error("Preencha corretamente os dados da cobrança.");
  }

  await prisma.$transaction(async (tx) => {
    const matricula = await tx.matricula.findUnique({
      where: { id: matriculaId },
      include: { pagamentoMatricula: true },
    });

    if (!matricula) {
      throw new Error("Matrícula não encontrada.");
    }

    if (
      matricula.status !== "AGUARDANDO_PAGAMENTO" &&
      !matricula.pagamentoMatricula
    ) {
      throw new Error(
        "Esta matrícula ainda não está na etapa financeira.",
      );
    }

    if (
      matricula.pagamentoMatricula?.status === "CONFIRMADO"
    ) {
      throw new Error(
        "Reabra o pagamento antes de alterar a cobrança.",
      );
    }

    await tx.pagamentoMatricula.upsert({
      where: { matriculaId },
      create: {
        descricao,
        valorCentavos,
        vencimento,
        escolaId: matricula.escolaId,
        matriculaId,
      },
      update: {
        descricao,
        valorCentavos,
        vencimento,
        status: "PENDENTE",
        canceladoEm: null,
      },
    });

    await tx.tarefa.updateMany({
      where: {
        matriculaId,
        setor: "Financeiro",
        status: { not: "CONCLUIDA" },
      },
      data: { status: "AGUARDANDO" },
    });
  });

  revalidarFinanceiro();
  redirect("/financeiro/matriculas");
}

async function confirmarPagamento(formData: FormData) {
  "use server";

  await requireAdmin("GERENCIAR_FINANCEIRO");

  const pagamentoId = getString(formData, "pagamentoId");
  const forma = getString(formData, "formaPagamento");
  const referencia = getString(formData, "referencia");
  const observacao = getString(formData, "observacao");
  const pagoEmTexto = getString(formData, "pagoEm");
  const pagoEm = pagoEmTexto
    ? converterData(pagoEmTexto)
    : new Date();

  if (
    !pagamentoId ||
    !isFormaPagamento(forma) ||
    !pagoEm
  ) {
    throw new Error("Informe os dados da confirmação.");
  }

  await prisma.$transaction(async (tx) => {
    const pagamento =
      await tx.pagamentoMatricula.findUnique({
        where: { id: pagamentoId },
      });

    if (!pagamento) {
      throw new Error("Pagamento não encontrado.");
    }

    await tx.pagamentoMatricula.update({
      where: { id: pagamento.id },
      data: {
        status: "CONFIRMADO",
        formaPagamento: forma,
        referencia: referencia || null,
        observacao: observacao || null,
        pagoEm,
        confirmadoEm: new Date(),
        canceladoEm: null,
      },
    });

    await tx.matricula.update({
      where: { id: pagamento.matriculaId },
      data: { status: "ATIVA" },
    });

    await tx.tarefa.updateMany({
      where: {
        matriculaId: pagamento.matriculaId,
        setor: "Financeiro",
      },
      data: { status: "CONCLUIDA" },
    });
  });

  revalidarFinanceiro();
  redirect("/financeiro/matriculas");
}

async function reabrirPagamento(formData: FormData) {
  "use server";

  await requireAdmin("GERENCIAR_FINANCEIRO");

  const pagamentoId = getString(formData, "pagamentoId");

  if (!pagamentoId) {
    throw new Error("Pagamento inválido.");
  }

  await prisma.$transaction(async (tx) => {
    const pagamento =
      await tx.pagamentoMatricula.findUnique({
        where: { id: pagamentoId },
      });

    if (!pagamento) {
      throw new Error("Pagamento não encontrado.");
    }

    await tx.pagamentoMatricula.update({
      where: { id: pagamento.id },
      data: {
        status: "EM_ANALISE",
        confirmadoEm: null,
      },
    });

    await tx.matricula.update({
      where: { id: pagamento.matriculaId },
      data: { status: "AGUARDANDO_PAGAMENTO" },
    });

    await tx.tarefa.updateMany({
      where: {
        matriculaId: pagamento.matriculaId,
        setor: "Financeiro",
      },
      data: { status: "EM_ANDAMENTO" },
    });
  });

  revalidarFinanceiro();
  redirect("/financeiro/matriculas");
}

function revalidarFinanceiro() {
  revalidatePath("/financeiro/matriculas");
  revalidatePath("/financeiro");
  revalidatePath("/matriculas");
  revalidatePath("/alunos");
  revalidatePath("/dashboard");
  revalidatePath("/pulse");
  revalidatePath("/relatorios");
}

function formatarMoeda(valorCentavos: number) {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(valorCentavos / 100);
}

function formatarData(data: Date | null) {
  if (!data) return "Não informado";
  return new Intl.DateTimeFormat("pt-BR").format(data);
}

function formaLabel(forma: string | null) {
  const labels: Record<string, string> = {
    PIX: "Pix",
    CARTAO: "Cartão",
    BOLETO: "Boleto",
    DINHEIRO: "Dinheiro",
    TRANSFERENCIA: "Transferência",
    OUTRO: "Outro",
  };
  return forma ? labels[forma] ?? forma : "Não informada";
}

export default async function PagamentosMatriculaPage() {
  const matriculas = await prisma.matricula.findMany({
    where: {
      OR: [
        { status: "AGUARDANDO_PAGAMENTO" },
        { pagamentoMatricula: { isNot: null } },
      ],
    },
    orderBy: { atualizadoEm: "desc" },
    include: {
      aluno: {
        include: {
          responsavel: true,
          turma: true,
        },
      },
      pagamentoMatricula: true,
    },
  });

  const aguardandoCobranca = matriculas.filter(
    (matricula) => !matricula.pagamentoMatricula,
  ).length;
  const pendentes = matriculas.filter((matricula) =>
    ["PENDENTE", "EM_ANALISE"].includes(
      matricula.pagamentoMatricula?.status ?? "",
    ),
  ).length;
  const confirmados = matriculas.filter(
    (matricula) =>
      matricula.pagamentoMatricula?.status === "CONFIRMADO",
  ).length;

  return (
    <AppLayout>
      <div className="mb-8">
        <Link
          href="/financeiro"
          className="inline-flex items-center gap-2 text-sm font-semibold text-muted-foreground transition hover:text-foreground"
        >
          <ArrowLeft size={16} />
          Voltar para o Financeiro
        </Link>

        <p className="mt-8 text-sm font-medium text-muted-foreground">
          Matrículas
        </p>
        <h1 className="mt-2 text-4xl font-semibold tracking-tight text-foreground">
          Pagamentos de matrícula
        </h1>
        <p className="mt-3 max-w-3xl leading-7 text-muted-foreground">
          Gere a cobrança inicial, registre o recebimento e
          ative a matrícula com segurança.
        </p>
      </div>

      <div className="mb-7 grid gap-5 md:grid-cols-3">
        <Resumo
          titulo="Sem cobrança"
          valor={aguardandoCobranca}
          descricao="aguardando configuração"
          icon={<CalendarClock size={22} />}
        />
        <Resumo
          titulo="Pendentes"
          valor={pendentes}
          descricao="aguardando confirmação"
          icon={<WalletCards size={22} />}
        />
        <Resumo
          titulo="Confirmados"
          valor={confirmados}
          descricao="matrículas ativadas"
          icon={<CheckCircle2 size={22} />}
        />
      </div>

      {matriculas.length === 0 ? (
        <div className="rounded-3xl border border-dashed border-border bg-card p-10 text-center">
          <CircleDollarSign
            size={34}
            className="mx-auto text-muted-foreground"
          />
          <h2 className="mt-4 font-semibold text-foreground">
            Nenhuma matrícula na etapa financeira
          </h2>
          <p className="mt-2 text-sm text-muted-foreground">
            As matrículas aparecerão aqui depois da aprovação
            de todos os documentos obrigatórios.
          </p>
        </div>
      ) : (
        <div className="space-y-5">
          {matriculas.map((matricula) => {
            const pagamento = matricula.pagamentoMatricula;

            return (
              <article
                key={matricula.id}
                className="rounded-3xl border border-border bg-card p-6 shadow-sm"
              >
                <div className="flex flex-col gap-6 xl:flex-row xl:items-start xl:justify-between">
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-3">
                      <h2 className="text-xl font-semibold text-foreground">
                        {matricula.aluno.nome}
                      </h2>
                      <StatusBadge
                        status={pagamento?.status ?? "SEM_COBRANCA"}
                      />
                    </div>

                    <div className="mt-4 grid gap-2 text-sm text-muted-foreground sm:grid-cols-2">
                      <p>
                        Responsável: <strong className="text-foreground">{matricula.aluno.responsavel.nome}</strong>
                      </p>
                      <p>
                        Turma: <strong className="text-foreground">{matricula.aluno.turma?.nome ?? "A definir"}</strong>
                      </p>
                      <p>
                        Ano letivo: <strong className="text-foreground">{matricula.anoLetivo}</strong>
                      </p>
                      <p>
                        Situação: <strong className="text-foreground">{matricula.status === "ATIVA" ? "Matrícula ativa" : "Aguardando pagamento"}</strong>
                      </p>
                    </div>

                    {pagamento && (
                      <div className="mt-5 grid gap-4 rounded-2xl bg-muted/50 p-5 sm:grid-cols-2 lg:grid-cols-4">
                        <Info label="Cobrança" value={pagamento.descricao} />
                        <Info label="Valor" value={formatarMoeda(pagamento.valorCentavos)} />
                        <Info label="Vencimento" value={formatarData(pagamento.vencimento)} />
                        <Info label="Forma" value={formaLabel(pagamento.formaPagamento)} />
                      </div>
                    )}
                  </div>

                  <div className="shrink-0 xl:w-[380px]">
                    {!pagamento || pagamento.status !== "CONFIRMADO" ? (
                      <div className="space-y-4">
                        <details
                          open={!pagamento}
                          className="rounded-2xl border border-border bg-background p-4"
                        >
                          <summary className="cursor-pointer list-none font-semibold text-foreground">
                            {pagamento ? "Editar cobrança" : "Criar cobrança"}
                          </summary>
                          <form action={salvarCobranca} className="mt-4 grid gap-3">
                            <input type="hidden" name="matriculaId" value={matricula.id} />
                            <input
                              name="descricao"
                              required
                              defaultValue={pagamento?.descricao ?? "Taxa de matrícula"}
                              placeholder="Descrição"
                              className="rounded-xl border border-border bg-card px-3 py-2.5 text-sm outline-none focus:border-primary"
                            />
                            <div className="grid grid-cols-2 gap-3">
                              <input
                                name="valor"
                                required
                                inputMode="decimal"
                                defaultValue={pagamento ? (pagamento.valorCentavos / 100).toFixed(2).replace(".", ",") : ""}
                                placeholder="Valor: 250,00"
                                className="min-w-0 rounded-xl border border-border bg-card px-3 py-2.5 text-sm outline-none focus:border-primary"
                              />
                              <input
                                type="date"
                                name="vencimento"
                                defaultValue={pagamento?.vencimento?.toISOString().slice(0, 10) ?? ""}
                                className="min-w-0 rounded-xl border border-border bg-card px-3 py-2.5 text-sm outline-none focus:border-primary"
                              />
                            </div>
                            <button
                              type="submit"
                              className="rounded-xl border border-primary px-4 py-2.5 text-sm font-semibold text-primary transition hover:bg-primary/5"
                            >
                              Salvar cobrança
                            </button>
                          </form>
                        </details>

                        {pagamento && (
                          <details className="rounded-2xl border border-emerald-200 bg-emerald-50/60 p-4">
                            <summary className="cursor-pointer list-none font-semibold text-emerald-800">
                              Confirmar recebimento
                            </summary>
                            <form action={confirmarPagamento} className="mt-4 grid gap-3">
                              <input type="hidden" name="pagamentoId" value={pagamento.id} />
                              <select
                                name="formaPagamento"
                                required
                                defaultValue=""
                                className="rounded-xl border border-emerald-200 bg-white px-3 py-2.5 text-sm outline-none"
                              >
                                <option value="" disabled>Forma de pagamento</option>
                                <option value="PIX">Pix</option>
                                <option value="CARTAO">Cartão</option>
                                <option value="BOLETO">Boleto</option>
                                <option value="DINHEIRO">Dinheiro</option>
                                <option value="TRANSFERENCIA">Transferência</option>
                                <option value="OUTRO">Outro</option>
                              </select>
                              <input
                                type="date"
                                name="pagoEm"
                                className="rounded-xl border border-emerald-200 bg-white px-3 py-2.5 text-sm outline-none"
                              />
                              <input
                                name="referencia"
                                placeholder="Referência ou comprovante"
                                className="rounded-xl border border-emerald-200 bg-white px-3 py-2.5 text-sm outline-none"
                              />
                              <textarea
                                name="observacao"
                                rows={2}
                                placeholder="Observação opcional"
                                className="resize-none rounded-xl border border-emerald-200 bg-white px-3 py-2.5 text-sm outline-none"
                              />
                              <button
                                type="submit"
                                className="rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-emerald-700"
                              >
                                Confirmar e ativar matrícula
                              </button>
                            </form>
                          </details>
                        )}
                      </div>
                    ) : (
                      <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-5">
                        <CheckCircle2 size={23} className="text-emerald-700" />
                        <p className="mt-3 font-semibold text-emerald-900">
                          Pagamento confirmado
                        </p>
                        <p className="mt-1 text-sm text-emerald-800">
                          Recebido em {formatarData(pagamento.pagoEm)}.
                        </p>
                        {pagamento.referencia && (
                          <p className="mt-1 break-all text-xs text-emerald-800">
                            Referência: {pagamento.referencia}
                          </p>
                        )}
                        <form action={reabrirPagamento} className="mt-4">
                          <input type="hidden" name="pagamentoId" value={pagamento.id} />
                          <button
                            type="submit"
                            className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-emerald-300 bg-white px-4 py-2.5 text-sm font-semibold text-emerald-800"
                          >
                            <RotateCcw size={15} />
                            Reabrir conferência
                          </button>
                        </form>
                      </div>
                    )}
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </AppLayout>
  );
}

function Resumo({
  titulo,
  valor,
  descricao,
  icon,
}: {
  titulo: string;
  valor: number;
  descricao: string;
  icon: React.ReactNode;
}) {
  return (
    <div className="rounded-3xl border border-border bg-card p-6 shadow-sm">
      <div className="text-primary">{icon}</div>
      <p className="mt-4 text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">
        {titulo}
      </p>
      <p className="mt-2 text-4xl font-semibold text-foreground">
        {valor}
      </p>
      <p className="mt-1 text-sm text-muted-foreground">
        {descricao}
      </p>
    </div>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="mt-1 break-words text-sm font-semibold text-foreground">
        {value}
      </p>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const mapa: Record<
    string,
    { label: string; className: string }
  > = {
    SEM_COBRANCA: {
      label: "Sem cobrança",
      className: "bg-slate-50 text-slate-700 ring-slate-200",
    },
    PENDENTE: {
      label: "Pendente",
      className: "bg-amber-50 text-amber-700 ring-amber-200",
    },
    EM_ANALISE: {
      label: "Em conferência",
      className: "bg-blue-50 text-blue-700 ring-blue-200",
    },
    CONFIRMADO: {
      label: "Confirmado",
      className: "bg-emerald-50 text-emerald-700 ring-emerald-200",
    },
    CANCELADO: {
      label: "Cancelado",
      className: "bg-red-50 text-red-700 ring-red-200",
    },
  };

  const info = mapa[status] ?? mapa.SEM_COBRANCA;

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold ring-1 ${info.className}`}
    >
      <Banknote size={13} />
      {info.label}
    </span>
  );
}
