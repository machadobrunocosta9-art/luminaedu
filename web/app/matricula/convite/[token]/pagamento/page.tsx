import { prisma } from "@/lib/prisma";
import {
  AlertTriangle,
  ArrowLeft,
  CalendarDays,
  CheckCircle2,
  Clock3,
  CreditCard,
  FileCheck2,
  GraduationCap,
  LockKeyhole,
  ShieldCheck,
} from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";

export const dynamic = "force-dynamic";

type PageProps = {
  params: Promise<{ token: string }>;
};

function formatarMoeda(valorCentavos: number) {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(valorCentavos / 100);
}

function formatarData(data: Date | null) {
  return data
    ? new Intl.DateTimeFormat("pt-BR", {
        dateStyle: "long",
      }).format(data)
    : "A definir";
}

function formaLabel(forma: string | null) {
  const labels: Record<string, string> = {
    PIX: "Pix",
    CARTAO: "Cartão",
    BOLETO: "Boleto",
    DINHEIRO: "Dinheiro",
    TRANSFERENCIA: "Transferência",
    OUTRO: "Outra forma",
  };
  return forma ? labels[forma] ?? forma : "A confirmar";
}

export default async function PagamentoConvitePage({
  params,
}: PageProps) {
  const { token } = await params;
  const convite = await prisma.conviteMatricula.findUnique({
    where: { token },
    include: {
      escola: true,
      turma: true,
      matricula: {
        include: {
          aluno: true,
          pagamentoMatricula: true,
        },
      },
    },
  });

  if (!convite) notFound();

  const bloqueado =
    convite.status === "CANCELADO" ||
    convite.status === "EXPIRADO";
  const matricula = convite.matricula;
  const pagamento = matricula?.pagamentoMatricula;
  const confirmado =
    pagamento?.status === "CONFIRMADO" &&
    matricula?.status === "ATIVA";
  const liberado = Boolean(
    matricula &&
      ["AGUARDANDO_PAGAMENTO", "ATIVA"].includes(
        matricula.status,
      ),
  );

  return (
    <main className="min-h-screen bg-[#fafafc] text-[#1f2937]">
      <header className="border-b border-[#e6e7ee] bg-white">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-5 py-5">
          <Link
            href={`/matricula/convite/${token}`}
            className="flex items-center gap-3"
          >
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#5b3fd6] font-bold text-white">
              L
            </div>
            <div>
              <p className="font-semibold">Lumina</p>
              <p className="text-xs text-[#6b7280]">
                Pagamento da matrícula
              </p>
            </div>
          </Link>
          <div className="hidden items-center gap-2 text-sm text-[#6b7280] sm:flex">
            <LockKeyhole size={16} />
            Acesso pelo convite
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-6xl px-5 py-8 lg:py-12">
        <Link
          href={`/matricula/convite/${token}`}
          className="mb-7 inline-flex items-center gap-2 text-sm font-semibold text-[#5b3fd6]"
        >
          <ArrowLeft size={16} />
          Voltar à matrícula
        </Link>

        {bloqueado ? (
          <Estado
            icon={<AlertTriangle size={30} />}
            titulo="Convite indisponível"
            texto="Este convite foi cancelado ou expirou. Entre em contato com a escola para receber orientações."
            tom="red"
          />
        ) : !matricula ? (
          <Estado
            icon={<Clock3 size={30} />}
            titulo="Conclua os dados da matrícula"
            texto="A etapa de pagamento será liberada depois do envio inicial dos dados do aluno e do responsável."
          />
        ) : (
          <div className="grid gap-7 lg:grid-cols-[1fr_320px]">
            {confirmado && pagamento ? (
              <section className="rounded-[2rem] border border-emerald-200 bg-white p-7 shadow-sm lg:p-10">
                <Icone cor="green">
                  <CheckCircle2 size={31} />
                </Icone>
                <p className="mt-6 text-xs font-semibold uppercase tracking-[0.16em] text-emerald-700">
                  Pagamento confirmado
                </p>
                <h1 className="mt-3 text-3xl font-semibold">
                  Matrícula ativa
                </h1>
                <p className="mt-4 text-sm leading-7 text-[#6b7280]">
                  O pagamento da matrícula de{" "}
                  <strong className="text-[#1f2937]">
                    {matricula.aluno.nome}
                  </strong>{" "}
                  foi confirmado pela escola.
                </p>
                <div className="mt-7 grid gap-4 rounded-3xl bg-[#fafafc] p-5 sm:grid-cols-3">
                  <Info
                    label="Valor recebido"
                    value={formatarMoeda(
                      pagamento.valorCentavos,
                    )}
                  />
                  <Info
                    label="Data"
                    value={formatarData(pagamento.pagoEm)}
                  />
                  <Info
                    label="Forma"
                    value={formaLabel(
                      pagamento.formaPagamento,
                    )}
                  />
                </div>
              </section>
            ) : liberado && pagamento ? (
              <section className="rounded-[2rem] border border-[#dcd8fb] bg-white p-7 shadow-sm lg:p-10">
                <Icone>
                  <CreditCard size={30} />
                </Icone>
                <p className="mt-6 text-xs font-semibold uppercase tracking-[0.16em] text-[#5b3fd6]">
                  Cobrança da matrícula
                </p>
                <h1 className="mt-3 text-3xl font-semibold">
                  Pagamento pendente
                </h1>
                <p className="mt-4 text-sm leading-7 text-[#6b7280]">
                  Siga as orientações recebidas pela Secretaria
                  para efetuar o pagamento.
                </p>
                <div className="mt-7 rounded-3xl border border-[#e6e7ee] bg-[#fafafc] p-6">
                  <p className="text-sm text-[#6b7280]">
                    {pagamento.descricao}
                  </p>
                  <p className="mt-2 text-4xl font-semibold">
                    {formatarMoeda(pagamento.valorCentavos)}
                  </p>
                  <p className="mt-5 flex items-center gap-2 text-sm text-[#6b7280]">
                    <CalendarDays size={17} />
                    Vencimento: {formatarData(pagamento.vencimento)}
                  </p>
                </div>
                <div className="mt-5 flex items-start gap-3 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm leading-6 text-amber-800">
                  <Clock3 size={19} className="mt-0.5 shrink-0" />
                  A confirmação pode levar algum tempo. Esta
                  página será atualizada pela escola.
                </div>
              </section>
            ) : (
              <section className="rounded-[2rem] border border-[#e6e7ee] bg-white p-7 shadow-sm lg:p-10">
                <Icone cor="blue">
                  <FileCheck2 size={30} />
                </Icone>
                <p className="mt-6 text-xs font-semibold uppercase tracking-[0.16em] text-blue-700">
                  Etapa anterior em andamento
                </p>
                <h1 className="mt-3 text-3xl font-semibold">
                  Pagamento ainda não liberado
                </h1>
                <p className="mt-4 text-sm leading-7 text-[#6b7280]">
                  A Secretaria ainda está analisando os documentos ou
                  preparando a cobrança. Volte depois para acompanhar.
                </p>
                <Link
                  href={`/matricula/convite/${token}/documentos`}
                  className="mt-7 inline-flex min-h-12 items-center gap-2 rounded-2xl bg-[#5b3fd6] px-6 py-3 text-sm font-semibold text-white"
                >
                  <FileCheck2 size={17} />
                  Ver documentos
                </Link>
              </section>
            )}

            <aside className="space-y-5">
              <section className="rounded-[2rem] border border-[#e6e7ee] bg-white p-6 shadow-sm">
                <GraduationCap
                  size={23}
                  className="text-[#5b3fd6]"
                />
                <h2 className="mt-4 font-semibold">
                  Escola responsável
                </h2>
                <p className="mt-2 text-sm text-[#6b7280]">
                  {convite.escola.nome}
                </p>
                <p className="mt-4 text-xs text-[#6b7280]">
                  Turma
                </p>
                <p className="mt-1 text-sm font-semibold">
                  {convite.turma?.nome ?? "A definir"}
                </p>
              </section>
              <section className="rounded-[2rem] border border-[#dcd8fb] bg-[#f4f1ff] p-6">
                <ShieldCheck
                  size={23}
                  className="text-[#5b3fd6]"
                />
                <h2 className="mt-4 font-semibold">
                  Acompanhamento seguro
                </h2>
                <p className="mt-2 text-sm leading-6 text-[#6b7280]">
                  Os detalhes financeiros são exibidos somente por
                  este convite individual.
                </p>
              </section>
            </aside>
          </div>
        )}
      </div>
    </main>
  );
}

function Estado({
  icon,
  titulo,
  texto,
  tom = "violet",
}: {
  icon: React.ReactNode;
  titulo: string;
  texto: string;
  tom?: "red" | "violet";
}) {
  return (
    <section className="mx-auto max-w-2xl rounded-[2rem] border border-[#e6e7ee] bg-white p-8 text-center shadow-sm">
      <div
        className={`mx-auto flex h-16 w-16 items-center justify-center rounded-3xl ${
          tom === "red"
            ? "bg-red-50 text-red-700"
            : "bg-[#f4f1ff] text-[#5b3fd6]"
        }`}
      >
        {icon}
      </div>
      <h1 className="mt-6 text-3xl font-semibold">{titulo}</h1>
      <p className="mt-4 text-sm leading-7 text-[#6b7280]">
        {texto}
      </p>
    </section>
  );
}

function Icone({
  children,
  cor = "violet",
}: {
  children: React.ReactNode;
  cor?: "violet" | "green" | "blue";
}) {
  const cores = {
    violet: "bg-[#f4f1ff] text-[#5b3fd6]",
    green: "bg-emerald-50 text-emerald-700",
    blue: "bg-blue-50 text-blue-700",
  };
  return (
    <div
      className={`flex h-16 w-16 items-center justify-center rounded-3xl ${cores[cor]}`}
    >
      {children}
    </div>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs text-[#6b7280]">{label}</p>
      <p className="mt-1 text-sm font-semibold">{value}</p>
    </div>
  );
}
