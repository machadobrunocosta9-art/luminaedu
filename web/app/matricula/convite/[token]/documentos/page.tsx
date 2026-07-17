import DocumentUpload from "@/components/matriculas/DocumentUpload";
import { prisma } from "@/lib/prisma";
import {
  AlertTriangle,
  ArrowLeft,
  CheckCircle2,
  ClipboardCheck,
  CreditCard,
  FileCheck2,
  FileText,
  GraduationCap,
  LockKeyhole,
  ShieldCheck,
} from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";

export const dynamic = "force-dynamic";

type PageProps = {
  params: Promise<{
    token: string;
  }>;
};

type TipoDocumento =
  | "CERTIDAO_NASCIMENTO"
  | "RG_ALUNO"
  | "CPF_ALUNO"
  | "RG_RESPONSAVEL"
  | "CPF_RESPONSAVEL"
  | "COMPROVANTE_RESIDENCIA"
  | "CARTEIRA_VACINACAO"
  | "FOTO_ALUNO"
  | "LAUDO_MEDICO"
  | "CONTRATO_ASSINADO"
  | "COMPROVANTE_PAGAMENTO"
  | "OUTRO";

type DocumentoConfig = {
  tipo: TipoDocumento;
  titulo: string;
  descricao: string;
  obrigatorio: boolean;
};

const documentosObrigatorios: DocumentoConfig[] = [
  {
    tipo: "CERTIDAO_NASCIMENTO",
    titulo: "Certidão de nascimento",
    descricao:
      "Envie uma imagem legível ou o arquivo PDF da certidão de nascimento do aluno.",
    obrigatorio: true,
  },
  {
    tipo: "CPF_RESPONSAVEL",
    titulo: "CPF do responsável",
    descricao:
      "Envie o documento que contenha o número do CPF do responsável principal.",
    obrigatorio: true,
  },
  {
    tipo: "RG_RESPONSAVEL",
    titulo: "Documento de identidade do responsável",
    descricao:
      "Envie frente e verso do RG ou outro documento oficial com foto.",
    obrigatorio: true,
  },
  {
    tipo: "COMPROVANTE_RESIDENCIA",
    titulo: "Comprovante de residência",
    descricao:
      "Envie um comprovante recente em nome do responsável ou morador do endereço informado.",
    obrigatorio: true,
  },
  {
    tipo: "CARTEIRA_VACINACAO",
    titulo: "Carteira de vacinação",
    descricao:
      "Envie as páginas atualizadas da carteira de vacinação do aluno.",
    obrigatorio: true,
  },
  {
    tipo: "FOTO_ALUNO",
    titulo: "Foto do aluno",
    descricao:
      "Envie uma foto atual, nítida e de frente para identificação escolar.",
    obrigatorio: true,
  },
];

const documentosOpcionais: DocumentoConfig[] = [
  {
    tipo: "CPF_ALUNO",
    titulo: "CPF do aluno",
    descricao:
      "Envie o documento do CPF caso o aluno já possua.",
    obrigatorio: false,
  },
  {
    tipo: "RG_ALUNO",
    titulo: "RG do aluno",
    descricao:
      "Envie frente e verso do RG caso o aluno já possua.",
    obrigatorio: false,
  },
  {
    tipo: "LAUDO_MEDICO",
    titulo: "Laudo ou documento médico",
    descricao:
      "Envie laudos, receitas ou documentos relevantes para o acompanhamento do aluno.",
    obrigatorio: false,
  },
];

function getStatusInfo(status?: string | null) {
  if (!status) {
    return {
      label: "Pendente",
      className:
        "border-amber-200 bg-amber-50 text-amber-700",
    };
  }

  const statusMap: Record<
    string,
    {
      label: string;
      className: string;
    }
  > = {
    PENDENTE: {
      label: "Pendente",
      className:
        "border-amber-200 bg-amber-50 text-amber-700",
    },

    ENVIADO: {
      label: "Enviado",
      className:
        "border-blue-200 bg-blue-50 text-blue-700",
    },

    EM_ANALISE: {
      label: "Em análise",
      className:
        "border-violet-200 bg-violet-50 text-violet-700",
    },

    APROVADO: {
      label: "Aprovado",
      className:
        "border-emerald-200 bg-emerald-50 text-emerald-700",
    },

    REJEITADO: {
      label: "Rejeitado",
      className:
        "border-red-200 bg-red-50 text-red-700",
    },

    REENVIO_SOLICITADO: {
      label: "Reenvio solicitado",
      className:
        "border-orange-200 bg-orange-50 text-orange-700",
    },

    CANCELADO: {
      label: "Cancelado",
      className:
        "border-slate-200 bg-slate-50 text-slate-700",
    },
  };

  return (
    statusMap[status] ?? {
      label: status,
      className:
        "border-slate-200 bg-slate-50 text-slate-700",
    }
  );
}

export default async function DocumentosMatriculaPage({
  params,
}: PageProps) {
  const { token } = await params;

  const convite =
    await prisma.conviteMatricula.findUnique({
      where: {
        token,
      },

      include: {
        escola: true,
        turma: true,

        matricula: {
          include: {
            aluno: true,
          },
        },

        documentos: {
          orderBy: [
            {
              tipo: "asc",
            },
            {
              versao: "desc",
            },
          ],
        },
      },
    });

  if (!convite) {
    notFound();
  }

  const conviteExpirado =
    convite.expiraEm <= new Date();

  const conviteBloqueado =
    convite.status === "CANCELADO" ||
    convite.status === "EXPIRADO";

  const matriculaDisponivel =
    convite.status === "CONCLUIDO" &&
    Boolean(convite.matriculaId) &&
    Boolean(convite.matricula);

  const documentoMaisRecentePorTipo =
    new Map<string, (typeof convite.documentos)[number]>();

  for (const documento of convite.documentos) {
    if (
      !documentoMaisRecentePorTipo.has(
        documento.tipo,
      )
    ) {
      documentoMaisRecentePorTipo.set(
        documento.tipo,
        documento,
      );
    }
  }

  const obrigatoriosEnviados =
    documentosObrigatorios.filter((config) => {
      const documento =
        documentoMaisRecentePorTipo.get(config.tipo);

      return Boolean(
        documento &&
          [
            "ENVIADO",
            "EM_ANALISE",
            "APROVADO",
          ].includes(documento.status),
      );
    }).length;

  const obrigatoriosAprovados =
    documentosObrigatorios.filter((config) => {
      const documento =
        documentoMaisRecentePorTipo.get(config.tipo);

      return documento?.status === "APROVADO";
    }).length;

  const obrigatoriosPendentes =
    documentosObrigatorios.length -
    obrigatoriosEnviados;

  const progresso = Math.round(
    (obrigatoriosEnviados /
      documentosObrigatorios.length) *
      100,
  );

  return (
    <main className="min-h-screen bg-[#fafafc] text-[#1f2937]">
      <header className="border-b border-[#e6e7ee] bg-white">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-5 py-5">
          <Link
            href={`/matricula/convite/${token}`}
            className="flex items-center gap-3"
          >
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#5b3fd6] font-bold text-white shadow-sm">
              L
            </div>

            <div>
              <p className="font-semibold tracking-tight">
                Lumina
              </p>

              <p className="text-xs text-[#6b7280]">
                Documentação da matrícula
              </p>
            </div>
          </Link>

          <div className="hidden items-center gap-2 text-sm text-[#6b7280] sm:flex">
            <LockKeyhole size={16} />
            Armazenamento privado
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-7xl px-5 py-8 lg:py-12">
        <Link
          href={`/matricula/convite/${token}`}
          className="mb-6 inline-flex items-center gap-2 text-sm font-semibold text-[#5b3fd6] transition hover:opacity-80"
        >
          <ArrowLeft size={16} />
          Voltar para a matrícula
        </Link>

        {conviteBloqueado || conviteExpirado ? (
          <section className="mx-auto max-w-2xl rounded-[2rem] border border-[#e6e7ee] bg-white p-8 text-center shadow-sm">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-3xl bg-red-50 text-red-700">
              <AlertTriangle size={30} />
            </div>

            <h1 className="mt-6 text-3xl font-semibold tracking-tight">
              Envio indisponível
            </h1>

            <p className="mt-4 text-sm leading-7 text-[#6b7280]">
              Este convite não está disponível para o
              envio de documentos. Entre em contato com a
              escola para solicitar um novo acesso.
            </p>
          </section>
        ) : !matriculaDisponivel ? (
          <section className="mx-auto max-w-2xl rounded-[2rem] border border-[#e6e7ee] bg-white p-8 text-center shadow-sm">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-3xl bg-amber-50 text-amber-700">
              <ClipboardCheck size={30} />
            </div>

            <h1 className="mt-6 text-3xl font-semibold tracking-tight">
              Conclua primeiro os dados
            </h1>

            <p className="mt-4 text-sm leading-7 text-[#6b7280]">
              O envio dos documentos será liberado depois
              que o formulário principal da matrícula for
              concluído.
            </p>

            <Link
              href={`/matricula/convite/${token}`}
              className="mt-6 inline-flex min-h-12 items-center justify-center rounded-2xl bg-[#5b3fd6] px-6 py-3 text-sm font-semibold text-white transition hover:opacity-90"
            >
              Continuar preenchimento
            </Link>
          </section>
        ) : (
          <>
            <section className="mb-7 overflow-hidden rounded-[2rem] border border-[#dcd8fb] bg-[#f4f1ff] p-6 shadow-sm lg:p-8">
              <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
                <div className="flex items-start gap-4">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-3xl bg-[#5b3fd6] text-white shadow-sm">
                    <FileCheck2 size={22} />
                  </div>

                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#5b3fd6]">
                      Documentação digital
                    </p>

                    <h1 className="mt-2 text-3xl font-semibold tracking-tight lg:text-4xl">
                      Documentos de{" "}
                      {convite.matricula?.aluno.nome}
                    </h1>

                    <p className="mt-3 max-w-3xl text-sm leading-7 text-[#6b7280]">
                      Envie arquivos legíveis em PDF, JPG ou
                      PNG. Cada documento ficará armazenado
                      de forma privada e será analisado pela
                      Secretaria.
                    </p>
                  </div>
                </div>

                <div className="min-w-[240px] rounded-3xl border border-white/70 bg-white/80 p-5 backdrop-blur">
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-xs font-medium text-[#6b7280]">
                      Progresso do envio
                    </p>

                    <p className="text-sm font-semibold text-[#5b3fd6]">
                      {progresso}%
                    </p>
                  </div>

                  <div className="mt-3 h-2 overflow-hidden rounded-full bg-[#e6e7ee]">
                    <div
                      className="h-full rounded-full bg-[#5b3fd6] transition-all"
                      style={{
                        width: `${progresso}%`,
                      }}
                    />
                  </div>

                  <p className="mt-3 text-xs leading-5 text-[#6b7280]">
                    {obrigatoriosEnviados} de{" "}
                    {documentosObrigatorios.length} documentos
                    obrigatórios enviados.
                  </p>
                </div>
              </div>
            </section>

            <section className="mb-7 grid gap-4 md:grid-cols-3">
              <div className="rounded-3xl border border-[#e6e7ee] bg-white p-5 shadow-sm">
                <FileText
                  size={22}
                  className="text-[#5b3fd6]"
                />

                <p className="mt-4 text-sm text-[#6b7280]">
                  Obrigatórios
                </p>

                <p className="mt-1 text-4xl font-semibold tracking-tight">
                  {documentosObrigatorios.length}
                </p>
              </div>

              <div className="rounded-3xl border border-[#e6e7ee] bg-white p-5 shadow-sm">
                <ClipboardCheck
                  size={22}
                  className="text-amber-600"
                />

                <p className="mt-4 text-sm text-[#6b7280]">
                  Pendentes de envio
                </p>

                <p className="mt-1 text-4xl font-semibold tracking-tight">
                  {obrigatoriosPendentes}
                </p>
              </div>

              <div className="rounded-3xl border border-[#e6e7ee] bg-white p-5 shadow-sm">
                <CheckCircle2
                  size={22}
                  className="text-emerald-600"
                />

                <p className="mt-4 text-sm text-[#6b7280]">
                  Aprovados
                </p>

                <p className="mt-1 text-4xl font-semibold tracking-tight">
                  {obrigatoriosAprovados}
                </p>
              </div>
            </section>

            <div className="grid gap-7 xl:grid-cols-[1fr_320px]">
              <div className="space-y-8">
                <section>
                  <div className="mb-5">
                    <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#5b3fd6]">
                      Etapa obrigatória
                    </p>

                    <h2 className="mt-2 text-2xl font-semibold tracking-tight">
                      Documentos obrigatórios
                    </h2>

                    <p className="mt-2 text-sm leading-6 text-[#6b7280]">
                      Todos os itens abaixo precisam ser enviados
                      para a análise da matrícula.
                    </p>
                  </div>

                  <div className="grid gap-5 lg:grid-cols-2">
                    {documentosObrigatorios.map(
                      (config) => {
                        const documento =
                          documentoMaisRecentePorTipo.get(
                            config.tipo,
                          );

                        const statusInfo =
                          getStatusInfo(
                            documento?.status,
                          );

                        const bloqueiaNovoEnvio =
                          documento &&
                          [
                            "ENVIADO",
                            "EM_ANALISE",
                            "APROVADO",
                          ].includes(documento.status);

                        return (
                          <div
                            key={config.tipo}
                            className="space-y-3"
                          >
                            <div className="flex justify-end">
                              <span
                                className={`rounded-full border px-3 py-1 text-xs font-semibold ${statusInfo.className}`}
                              >
                                {statusInfo.label}

                                {documento
                                  ? ` · v${documento.versao}`
                                  : ""}
                              </span>
                            </div>

                            <DocumentUpload
                              conviteToken={
                                convite.token
                              }
                              conviteId={convite.id}
                              tipoDocumento={
                                config.tipo
                              }
                              titulo={config.titulo}
                              descricao={
                                config.descricao
                              }
                              obrigatorio={
                                config.obrigatorio
                              }
                              bloqueado={
                                Boolean(
                                  bloqueiaNovoEnvio,
                                )
                              }
                            />

                            {documento?.motivoRejeicao && (
                              <div className="rounded-2xl border border-red-200 bg-red-50 p-4">
                                <p className="text-sm font-semibold text-red-700">
                                  Motivo informado pela
                                  Secretaria
                                </p>

                                <p className="mt-2 text-sm leading-6 text-red-700/90">
                                  {
                                    documento.motivoRejeicao
                                  }
                                </p>
                              </div>
                            )}
                          </div>
                        );
                      },
                    )}
                  </div>
                </section>

                <section>
                  <div className="mb-5">
                    <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#5b3fd6]">
                      Quando necessário
                    </p>

                    <h2 className="mt-2 text-2xl font-semibold tracking-tight">
                      Documentos opcionais
                    </h2>

                    <p className="mt-2 text-sm leading-6 text-[#6b7280]">
                      Envie apenas os documentos que se aplicam
                      ao aluno.
                    </p>
                  </div>

                  <div className="grid gap-5 lg:grid-cols-2">
                    {documentosOpcionais.map(
                      (config) => {
                        const documento =
                          documentoMaisRecentePorTipo.get(
                            config.tipo,
                          );

                        const statusInfo =
                          getStatusInfo(
                            documento?.status,
                          );

                        const bloqueiaNovoEnvio =
                          documento &&
                          [
                            "ENVIADO",
                            "EM_ANALISE",
                            "APROVADO",
                          ].includes(documento.status);

                        return (
                          <div
                            key={config.tipo}
                            className="space-y-3"
                          >
                            {documento && (
                              <div className="flex justify-end">
                                <span
                                  className={`rounded-full border px-3 py-1 text-xs font-semibold ${statusInfo.className}`}
                                >
                                  {statusInfo.label} · v
                                  {documento.versao}
                                </span>
                              </div>
                            )}

                            <DocumentUpload
                              conviteToken={
                                convite.token
                              }
                              conviteId={convite.id}
                              tipoDocumento={
                                config.tipo
                              }
                              titulo={config.titulo}
                              descricao={
                                config.descricao
                              }
                              obrigatorio={
                                config.obrigatorio
                              }
                              bloqueado={
                                Boolean(
                                  bloqueiaNovoEnvio,
                                )
                              }
                            />

                            {documento?.motivoRejeicao && (
                              <div className="rounded-2xl border border-red-200 bg-red-50 p-4">
                                <p className="text-sm font-semibold text-red-700">
                                  Motivo informado pela
                                  Secretaria
                                </p>

                                <p className="mt-2 text-sm leading-6 text-red-700/90">
                                  {
                                    documento.motivoRejeicao
                                  }
                                </p>
                              </div>
                            )}
                          </div>
                        );
                      },
                    )}
                  </div>
                </section>
              </div>

              <aside className="space-y-5">
                <section className="rounded-[2rem] border border-[#e6e7ee] bg-white p-6 shadow-sm">
                  <ShieldCheck
                    size={23}
                    className="text-[#5b3fd6]"
                  />

                  <h2 className="mt-4 font-semibold">
                    Seus arquivos estão protegidos
                  </h2>

                  <p className="mt-2 text-sm leading-6 text-[#6b7280]">
                    Os documentos são armazenados de forma
                    privada e não podem ser acessados
                    publicamente pelo endereço do arquivo.
                  </p>
                </section>

                <section className="rounded-[2rem] border border-[#e6e7ee] bg-white p-6 shadow-sm">
                  <GraduationCap
                    size={23}
                    className="text-[#5b3fd6]"
                  />

                  <h2 className="mt-4 font-semibold">
                    Escola responsável
                  </h2>

                  <p className="mt-2 text-sm leading-6 text-[#6b7280]">
                    {convite.escola.nome}
                  </p>

                  <p className="mt-3 text-xs text-[#6b7280]">
                    Turma pretendida
                  </p>

                  <p className="mt-1 text-sm font-semibold">
                    {convite.turma?.nome ??
                      "A definir"}
                  </p>
                </section>

                <section className="sticky bottom-5 rounded-[2rem] border border-[#dcd8fb] bg-white/95 p-6 shadow-xl backdrop-blur">
                  {obrigatoriosPendentes === 0 ? (
                    <>
                      <CheckCircle2
                        size={24}
                        className="text-emerald-600"
                      />

                      <h2 className="mt-4 font-semibold">
                        Documentos enviados
                      </h2>

                      <p className="mt-2 text-sm leading-6 text-[#6b7280]">
                        Todos os documentos obrigatórios foram
                        enviados. A Secretaria fará a análise.
                      </p>
                    </>
                  ) : (
                    <>
                      <ClipboardCheck
                        size={24}
                        className="text-[#5b3fd6]"
                      />

                      <h2 className="mt-4 font-semibold">
                        Continue o envio
                      </h2>

                      <p className="mt-2 text-sm leading-6 text-[#6b7280]">
                        Ainda faltam{" "}
                        {obrigatoriosPendentes} documento
                        {obrigatoriosPendentes === 1
                          ? ""
                          : "s"}{" "}
                        obrigatório
                        {obrigatoriosPendentes === 1
                          ? ""
                          : "s"}.
                      </p>
                    </>
                  )}

                  <Link
                    href={`/matricula/convite/${token}/pagamento`}
                    className="mt-5 inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-2xl bg-[#5b3fd6] px-5 py-3 text-sm font-semibold text-white transition hover:opacity-90"
                  >
                    <CreditCard size={17} />
                    Acompanhar pagamento
                  </Link>

                  <Link
                    href={`/matricula/convite/${token}`}
                    className="mt-5 inline-flex min-h-11 w-full items-center justify-center rounded-2xl border border-[#e6e7ee] bg-[#fafafc] px-5 py-3 text-sm font-semibold transition hover:bg-[#f3f4f8]"
                  >
                    Voltar à matrícula
                  </Link>
                </section>
              </aside>
            </div>
          </>
        )}
      </div>
    </main>
  );
}
