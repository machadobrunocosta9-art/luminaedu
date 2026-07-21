import AppLayout from "@/components/layout/AppLayout";
import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import {
  ArrowLeft,
  CheckCircle2,
  Clock3,
  ExternalLink,
  FileSearch,
  RotateCcw,
  XCircle,
} from "lucide-react";
import { revalidatePath } from "next/cache";
import Link from "next/link";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

const TIPOS_OBRIGATORIOS = [
  "CERTIDAO_NASCIMENTO",
  "CPF_RESPONSAVEL",
  "RG_RESPONSAVEL",
  "COMPROVANTE_RESIDENCIA",
  "CARTEIRA_VACINACAO",
  "FOTO_ALUNO",
] as const;

const STATUS_PERMITIDOS = [
  "EM_ANALISE",
  "APROVADO",
  "REJEITADO",
  "REENVIO_SOLICITADO",
] as const;

type StatusPermitido =
  (typeof STATUS_PERMITIDOS)[number];

function getString(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value.trim() : "";
}

function isStatusPermitido(
  status: string,
): status is StatusPermitido {
  return STATUS_PERMITIDOS.includes(
    status as StatusPermitido,
  );
}

async function analisarDocumento(formData: FormData) {
  "use server";

  await requireAdmin("GERENCIAR_DOCUMENTOS");

  const documentoId = getString(formData, "documentoId");
  const status = getString(formData, "status");
  const motivo = getString(formData, "motivo");

  if (!documentoId || !isStatusPermitido(status)) {
    throw new Error("Dados inválidos para analisar o documento.");
  }

  if (
    ["REJEITADO", "REENVIO_SOLICITADO"].includes(status) &&
    motivo.length < 5
  ) {
    throw new Error(
      "Informe uma orientação com pelo menos 5 caracteres.",
    );
  }

  const agora = new Date();

  const resultado = await prisma.$transaction(async (tx) => {
    const atual =
      await tx.documentoMatricula.findUnique({
        where: { id: documentoId },
        select: {
          id: true,
          matriculaId: true,
          convite: {
            select: { token: true },
          },
        },
      });

    if (!atual) {
      throw new Error("Documento não encontrado.");
    }

    await tx.documentoMatricula.update({
      where: { id: atual.id },
      data: {
        status,
        motivoRejeicao:
          status === "REJEITADO" ||
          status === "REENVIO_SOLICITADO"
            ? motivo
            : null,
        observacaoSecretaria: motivo || null,
        analisadoEm: agora,
        aprovadoEm:
          status === "APROVADO" ? agora : null,
        rejeitadoEm:
          status === "REJEITADO" ? agora : null,
        reenvioSolicitadoEm:
          status === "REENVIO_SOLICITADO"
            ? agora
            : null,
      },
    });

    if (atual.matriculaId) {
      const documentos =
        await tx.documentoMatricula.findMany({
          where: {
            matriculaId: atual.matriculaId,
          },
          orderBy: { versao: "desc" },
          select: {
            tipo: true,
            status: true,
          },
        });

      const maisRecentes = new Map<string, string>();

      for (const documento of documentos) {
        if (!maisRecentes.has(documento.tipo)) {
          maisRecentes.set(
            documento.tipo,
            documento.status,
          );
        }
      }

      const todosAprovados = TIPOS_OBRIGATORIOS.every(
        (tipo) => maisRecentes.get(tipo) === "APROVADO",
      );

      await tx.matricula.update({
        where: { id: atual.matriculaId },
        data: {
          status: todosAprovados
            ? "AGUARDANDO_PAGAMENTO"
            : status === "EM_ANALISE"
              ? "EM_ANALISE"
              : "AGUARDANDO_DOCUMENTOS",
        },
      });
    }

    return atual;
  });

  revalidatePath("/documentos/matriculas");
  revalidatePath("/documentos");
  revalidatePath("/matriculas");
  revalidatePath("/dashboard");
  revalidatePath(
    `/matricula/convite/${resultado.convite.token}/documentos`,
  );

  redirect("/documentos/matriculas");
}

function formatarData(data: Date | null) {
  if (!data) return "Sem data";

  return new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(data);
}

function formatarTamanho(bytes: number | null) {
  if (!bytes) return "Tamanho não informado";
  if (bytes < 1024 * 1024) {
    return `${(bytes / 1024).toFixed(1)} KB`;
  }
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function statusInfo(status: string) {
  const mapa: Record<
    string,
    { label: string; className: string }
  > = {
    ENVIADO: {
      label: "Aguardando análise",
      className: "bg-blue-50 text-blue-700 ring-blue-200",
    },
    EM_ANALISE: {
      label: "Em análise",
      className:
        "bg-violet-50 text-violet-700 ring-violet-200",
    },
    APROVADO: {
      label: "Aprovado",
      className:
        "bg-emerald-50 text-emerald-700 ring-emerald-200",
    },
    REJEITADO: {
      label: "Rejeitado",
      className: "bg-red-50 text-red-700 ring-red-200",
    },
    REENVIO_SOLICITADO: {
      label: "Reenvio solicitado",
      className:
        "bg-orange-50 text-orange-700 ring-orange-200",
    },
  };

  return (
    mapa[status] ?? {
      label: status,
      className: "bg-muted text-muted-foreground ring-border",
    }
  );
}

export default async function DocumentosMatriculasPage() {
  const todos = await prisma.documentoMatricula.findMany({
    orderBy: [
      { enviadoEm: "desc" },
      { versao: "desc" },
    ],
    include: {
      matricula: {
        include: {
          aluno: {
            include: {
              responsavel: true,
              turma: true,
            },
          },
        },
      },
      convite: true,
      escola: true,
    },
  });

  const chaves = new Set<string>();
  const documentos = todos.filter((documento) => {
    const chave = `${documento.conviteId}:${documento.tipo}`;
    if (chaves.has(chave)) return false;
    chaves.add(chave);
    return true;
  });

  const aguardando = documentos.filter((documento) =>
    ["ENVIADO", "EM_ANALISE"].includes(documento.status),
  ).length;
  const aprovados = documentos.filter(
    (documento) => documento.status === "APROVADO",
  ).length;
  const precisamAcao = documentos.filter((documento) =>
    ["REJEITADO", "REENVIO_SOLICITADO"].includes(
      documento.status,
    ),
  ).length;

  return (
    <AppLayout>
      <div className="mb-8">
        <Link
          href="/documentos"
          className="inline-flex items-center gap-2 text-sm font-semibold text-muted-foreground transition hover:text-foreground"
        >
          <ArrowLeft size={16} />
          Voltar para documentos
        </Link>

        <p className="mt-8 text-sm font-medium text-muted-foreground">
          Secretaria
        </p>
        <h1 className="mt-2 text-4xl font-semibold tracking-tight text-foreground">
          Análise de documentos
        </h1>
        <p className="mt-3 max-w-3xl leading-7 text-muted-foreground">
          Confira os arquivos enviados pelos responsáveis e
          registre a decisão da Secretaria.
        </p>
      </div>

      <div className="mb-7 grid gap-5 md:grid-cols-3">
        <Resumo
          titulo="Aguardando"
          valor={aguardando}
          descricao="para conferência"
          icon={<Clock3 size={22} />}
        />
        <Resumo
          titulo="Aprovados"
          valor={aprovados}
          descricao="na versão atual"
          icon={<CheckCircle2 size={22} />}
        />
        <Resumo
          titulo="Com pendência"
          valor={precisamAcao}
          descricao="rejeitados ou em reenvio"
          icon={<RotateCcw size={22} />}
        />
      </div>

      {documentos.length === 0 ? (
        <div className="rounded-3xl border border-dashed border-border bg-card p-10 text-center">
          <FileSearch
            size={32}
            className="mx-auto text-muted-foreground"
          />
          <h2 className="mt-4 font-semibold text-foreground">
            Nenhum arquivo enviado
          </h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Os documentos aparecerão aqui depois do primeiro envio.
          </p>
        </div>
      ) : (
        <div className="space-y-5">
          {documentos.map((documento) => {
            const info = statusInfo(documento.status);
            const aluno = documento.matricula?.aluno;

            return (
              <article
                key={documento.id}
                className="rounded-3xl border border-border bg-card p-6 shadow-sm"
              >
                <div className="flex flex-col gap-6 xl:flex-row xl:items-start xl:justify-between">
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-3">
                      <h2 className="text-lg font-semibold text-foreground">
                        {documento.titulo}
                      </h2>
                      <span
                        className={`rounded-full px-3 py-1 text-xs font-semibold ring-1 ${info.className}`}
                      >
                        {info.label} · v{documento.versao}
                      </span>
                    </div>

                    <div className="mt-4 grid gap-2 text-sm text-muted-foreground sm:grid-cols-2">
                      <p>
                        Aluno: <strong className="text-foreground">{aluno?.nome ?? documento.convite.nomeAluno}</strong>
                      </p>
                      <p>
                        Responsável: <strong className="text-foreground">{aluno?.responsavel.nome ?? documento.convite.nomeResponsavel}</strong>
                      </p>
                      <p>
                        Turma: <strong className="text-foreground">{aluno?.turma?.nome ?? "A definir"}</strong>
                      </p>
                      <p>
                        Enviado em: <strong className="text-foreground">{formatarData(documento.enviadoEm)}</strong>
                      </p>
                    </div>

                    <div className="mt-4 flex flex-wrap items-center gap-3 rounded-2xl bg-muted/50 p-4 text-sm">
                      <span className="min-w-0 break-all font-medium text-foreground">
                        {documento.nomeArquivoOriginal ?? "Arquivo sem nome"}
                      </span>
                      <span className="text-muted-foreground">
                        {formatarTamanho(documento.tamanhoBytes)}
                      </span>
                      <Link
                        href={`/api/documentos/${documento.id}/arquivo`}
                        target="_blank"
                        rel="noreferrer"
                        className="ml-auto inline-flex items-center gap-2 font-semibold text-primary"
                      >
                        Abrir arquivo
                        <ExternalLink size={15} />
                      </Link>
                    </div>

                    {documento.motivoRejeicao && (
                      <p className="mt-4 rounded-2xl border border-orange-200 bg-orange-50 p-4 text-sm text-orange-800">
                        <strong>Orientação:</strong>{" "}
                        {documento.motivoRejeicao}
                      </p>
                    )}
                  </div>

                  <div className="grid shrink-0 gap-3 sm:grid-cols-2 xl:w-[360px]">
                    <AcaoSimples
                      documentoId={documento.id}
                      status="EM_ANALISE"
                      label="Iniciar análise"
                      disabled={documento.status === "EM_ANALISE"}
                    />
                    <AcaoSimples
                      documentoId={documento.id}
                      status="APROVADO"
                      label="Aprovar"
                      destaque
                      disabled={documento.status === "APROVADO"}
                    />

                    <AcaoComMotivo
                      documentoId={documento.id}
                      status="REENVIO_SOLICITADO"
                      label="Solicitar reenvio"
                    />
                    <AcaoComMotivo
                      documentoId={documento.id}
                      status="REJEITADO"
                      label="Rejeitar"
                      rejeicao
                    />
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

function AcaoSimples({
  documentoId,
  status,
  label,
  destaque = false,
  disabled = false,
}: {
  documentoId: string;
  status: StatusPermitido;
  label: string;
  destaque?: boolean;
  disabled?: boolean;
}) {
  return (
    <form action={analisarDocumento}>
      <input type="hidden" name="documentoId" value={documentoId} />
      <input type="hidden" name="status" value={status} />
      <button
        type="submit"
        disabled={disabled}
        className={`w-full rounded-2xl px-4 py-3 text-sm font-semibold transition disabled:cursor-not-allowed disabled:opacity-45 ${
          destaque
            ? "bg-primary text-primary-foreground hover:opacity-90"
            : "border border-border bg-background text-foreground hover:bg-muted"
        }`}
      >
        {label}
      </button>
    </form>
  );
}

function AcaoComMotivo({
  documentoId,
  status,
  label,
  rejeicao = false,
}: {
  documentoId: string;
  status: "REJEITADO" | "REENVIO_SOLICITADO";
  label: string;
  rejeicao?: boolean;
}) {
  return (
    <details className="rounded-2xl border border-border bg-background p-3">
      <summary
        className={`cursor-pointer list-none text-center text-sm font-semibold ${
          rejeicao ? "text-red-700" : "text-foreground"
        }`}
      >
        {rejeicao ? <XCircle size={15} className="mr-2 inline" /> : null}
        {label}
      </summary>
      <form action={analisarDocumento} className="mt-3 space-y-3">
        <input type="hidden" name="documentoId" value={documentoId} />
        <input type="hidden" name="status" value={status} />
        <textarea
          name="motivo"
          required
          minLength={5}
          rows={3}
          placeholder="Explique o que precisa ser corrigido"
          className="w-full resize-none rounded-xl border border-border bg-card px-3 py-2 text-sm outline-none focus:border-primary"
        />
        <button
          type="submit"
          className={`w-full rounded-xl px-3 py-2 text-sm font-semibold text-white ${
            rejeicao ? "bg-red-600" : "bg-orange-600"
          }`}
        >
          Confirmar
        </button>
      </form>
    </details>
  );
}
