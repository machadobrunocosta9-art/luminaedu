import AppLayout from "@/components/layout/AppLayout";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  AlertTriangle,
  ClipboardList,
  Mail,
  Sparkles,
  UserRound,
} from "lucide-react";

type NovaOcorrenciaPageProps = {
  params: Promise<{
    id: string;
  }>;
  searchParams: Promise<{
    tipo?: string;
  }>;
};

const tiposPermitidos = [
  "OCORRENCIA",
  "ADVERTENCIA",
  "SUSPENSAO",
  "RELATORIO",
  "ATENDIMENTO",
  "RESUMO",
];

function normalizarTipo(tipo?: string) {
  if (!tipo) return "OCORRENCIA";

  const tipoMaiusculo = tipo.toUpperCase();

  if (tiposPermitidos.includes(tipoMaiusculo)) {
    return tipoMaiusculo;
  }

  return "OCORRENCIA";
}

function getTituloPadrao(tipo: string) {
  const labels: Record<string, string> = {
    OCORRENCIA: "Nova ocorrência",
    ADVERTENCIA: "Nova advertência",
    SUSPENSAO: "Nova suspensão",
    RELATORIO: "Novo relatório",
    ATENDIMENTO: "Novo atendimento",
    RESUMO: "Novo resumo",
  };

  return labels[tipo] ?? "Nova ocorrência";
}

function getPlaceholderTitulo(tipo: string) {
  const labels: Record<string, string> = {
    OCORRENCIA: "Ex: Ocorrência em sala de aula",
    ADVERTENCIA: "Ex: Advertência por comportamento",
    SUSPENSAO: "Ex: Suspensão por conduta inadequada",
    RELATORIO: "Ex: Relatório pedagógico do aluno",
    ATENDIMENTO: "Ex: Atendimento com a coordenação",
    RESUMO: "Ex: Resumo de acompanhamento",
  };

  return labels[tipo] ?? "Ex: Ocorrência em sala de aula";
}

function getTextoAjuda(tipo: string) {
  const labels: Record<string, string> = {
    OCORRENCIA:
      "Registre de forma simples o que aconteceu. A Lumina vai transformar em texto formal no prontuário.",
    ADVERTENCIA:
      "Descreva o comportamento observado e as orientações dadas. A Lumina vai gerar um texto formal de advertência.",
    SUSPENSAO:
      "Informe o motivo da suspensão e, se necessário, o período. A Lumina vai gerar o texto formal para o prontuário.",
    RELATORIO:
      "Escreva os pontos principais do acompanhamento. A Lumina vai organizar em formato de relatório.",
    ATENDIMENTO:
      "Registre o atendimento realizado com aluno, família ou equipe escolar.",
    RESUMO:
      "Escreva os pontos principais. A Lumina vai organizar um resumo para consulta futura.",
  };

  return labels[tipo] ?? labels.OCORRENCIA;
}

function gerarTextoSugerido({
  tipo,
  alunoNome,
  descricao,
  inicioSuspensao,
  fimSuspensao,
}: {
  tipo: string;
  alunoNome: string;
  descricao: string;
  inicioSuspensao?: string;
  fimSuspensao?: string;
}) {
  if (tipo === "ADVERTENCIA") {
    return `Comunicamos que foi registrada uma advertência referente ao aluno ${alunoNome}.

Conforme registro da equipe escolar:
${descricao}

Solicitamos que a família converse com o aluno sobre o ocorrido e acompanhe as orientações da escola.`;
  }

  if (tipo === "SUSPENSAO") {
    return `Comunicamos que foi registrada uma suspensão referente ao aluno ${alunoNome}${
      inicioSuspensao && fimSuspensao
        ? `, no período de ${inicioSuspensao} a ${fimSuspensao}`
        : ""
    }.

Motivo/registro:
${descricao}

O retorno às atividades deverá ocorrer com atenção às orientações da coordenação.`;
  }

  if (tipo === "RELATORIO") {
    return `Segue relatório referente ao acompanhamento do aluno ${alunoNome}:

${descricao}

Este registro ficará disponível no prontuário digital do aluno para acompanhamento da equipe escolar.`;
  }

  if (tipo === "ATENDIMENTO") {
    return `Foi registrado um atendimento referente ao aluno ${alunoNome}.

Registro do atendimento:
${descricao}

A equipe escolar seguirá acompanhando o caso conforme necessidade.`;
  }

  if (tipo === "RESUMO") {
    return `Resumo do acompanhamento do aluno ${alunoNome}:

${descricao}

Este resumo foi registrado para consulta no prontuário digital do aluno.`;
  }

  return `Foi registrada uma ocorrência referente ao aluno ${alunoNome}.

Registro:
${descricao}

Este registro ficará salvo no prontuário digital do aluno.`;
}

export default async function NovaOcorrenciaPage({
  params,
  searchParams,
}: NovaOcorrenciaPageProps) {
  const { id } = await params;
  const { tipo } = await searchParams;

  const tipoInicial = normalizarTipo(tipo);

  const aluno = await prisma.aluno.findUnique({
    where: {
      id,
    },
    include: {
      escola: true,
      responsavel: true,
      turma: true,
    },
  });

  if (!aluno) {
    notFound();
  }

  const alunoEncontrado = aluno;

  async function criarOcorrencia(formData: FormData) {
    "use server";

    const tipo = normalizarTipo(String(formData.get("tipo") || "OCORRENCIA"));
    const titulo = String(formData.get("titulo") || "").trim();
    const descricao = String(formData.get("descricao") || "").trim();

    const enviarParaResponsavel =
      formData.get("enviarParaResponsavel") === "on";

    const emailResponsavel = String(
      formData.get("emailResponsavel") || "",
    ).trim();

    const inicioSuspensaoValue = String(
      formData.get("inicioSuspensao") || "",
    ).trim();

    const fimSuspensaoValue = String(
      formData.get("fimSuspensao") || "",
    ).trim();

    if (!titulo || !descricao) {
      throw new Error("Título e descrição são obrigatórios.");
    }

    const textoFinal = gerarTextoSugerido({
      tipo,
      alunoNome: alunoEncontrado.nome,
      descricao,
      inicioSuspensao: inicioSuspensaoValue,
      fimSuspensao: fimSuspensaoValue,
    });

    await prisma.ocorrenciaAluno.create({
      data: {
        tipo: tipo as
          | "ADVERTENCIA"
          | "SUSPENSAO"
          | "OCORRENCIA"
          | "RELATORIO"
          | "RESUMO"
          | "ATENDIMENTO",
        titulo,
        descricao,
        textoFinal,
        enviarParaResponsavel,
        emailResponsavel: enviarParaResponsavel
          ? emailResponsavel || alunoEncontrado.responsavel.email
          : null,
        inicioSuspensao: inicioSuspensaoValue
          ? new Date(`${inicioSuspensaoValue}T00:00:00`)
          : null,
        fimSuspensao: fimSuspensaoValue
          ? new Date(`${fimSuspensaoValue}T00:00:00`)
          : null,
        escolaId: alunoEncontrado.escolaId,
        alunoId: alunoEncontrado.id,
      },
    });

    await prisma.tarefa.create({
      data: {
        titulo: `Acompanhar ${titulo}`,
        descricao: `Novo registro criado no prontuário do aluno ${alunoEncontrado.nome}. Tipo: ${tipo}.`,
        setor:
          tipo === "ADVERTENCIA" || tipo === "SUSPENSAO"
            ? "Acadêmico"
            : "Comunicação",
        prioridade:
          tipo === "SUSPENSAO"
            ? "ALTA"
            : tipo === "ADVERTENCIA"
              ? "MEDIA"
              : "BAIXA",
        status: "A_FAZER",
        escolaId: alunoEncontrado.escolaId,
        alunoId: alunoEncontrado.id,
      },
    });

    revalidatePath(`/alunos/${alunoEncontrado.id}`);
    revalidatePath("/alunos");
    revalidatePath("/dashboard");
    revalidatePath("/pulse");
    revalidatePath("/academico");
    revalidatePath("/comunicacao");
    revalidatePath("/relatorios");

    redirect(`/alunos/${alunoEncontrado.id}`);
  }

  return (
    <AppLayout>
      <div className="mb-8">
        <Link
          href={`/alunos/${alunoEncontrado.id}`}
          className="mb-5 inline-flex items-center gap-2 text-sm font-medium text-muted-foreground transition hover:text-foreground"
        >
          <ArrowLeft size={16} />
          Voltar para o prontuário
        </Link>

        <div className="flex items-start justify-between gap-6">
          <div>
            <p className="text-sm font-medium text-muted-foreground">
              Prontuário Digital
            </p>

            <h1 className="mt-2 text-3xl font-semibold tracking-tight text-foreground">
              {getTituloPadrao(tipoInicial)}
            </h1>

            <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
              Registre ocorrência, advertência, suspensão, relatório,
              atendimento ou resumo no histórico do aluno.
            </p>
          </div>

          <div className="hidden rounded-3xl border border-border bg-card p-5 shadow-sm md:block">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-primary text-primary-foreground">
                <UserRound size={20} />
              </div>

              <div>
                <p className="font-semibold text-foreground">
                  {alunoEncontrado.nome}
                </p>
                <p className="text-sm text-muted-foreground">
                  {alunoEncontrado.turma?.nome ?? "Sem turma"}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <form
        action={criarOcorrencia}
        className="grid gap-6 xl:grid-cols-[1fr_420px]"
      >
        <section className="rounded-3xl border border-border bg-card p-6 shadow-sm">
          <div className="mb-6 flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-muted">
              <ClipboardList size={19} />
            </div>

            <div>
              <h2 className="font-semibold text-foreground">
                Dados do registro
              </h2>
              <p className="text-sm text-muted-foreground">
                Informe o tipo e descreva o que aconteceu.
              </p>
            </div>
          </div>

          <div className="grid gap-5 md:grid-cols-2">
            <div>
              <label className="mb-2 block text-sm font-medium text-foreground">
                Tipo *
              </label>

              <select
                name="tipo"
                required
                className="h-12 w-full rounded-2xl border border-border bg-background px-4 text-sm outline-none transition focus:border-primary"
                defaultValue={tipoInicial}
              >
                <option value="OCORRENCIA">Ocorrência</option>
                <option value="ADVERTENCIA">Advertência</option>
                <option value="SUSPENSAO">Suspensão</option>
                <option value="RELATORIO">Relatório</option>
                <option value="ATENDIMENTO">Atendimento</option>
                <option value="RESUMO">Resumo</option>
              </select>
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-foreground">
                Título *
              </label>

              <input
                name="titulo"
                required
                placeholder={getPlaceholderTitulo(tipoInicial)}
                className="h-12 w-full rounded-2xl border border-border bg-background px-4 text-sm outline-none transition placeholder:text-muted-foreground focus:border-primary"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-foreground">
                Início da suspensão
              </label>

              <input
                name="inicioSuspensao"
                type="date"
                className="h-12 w-full rounded-2xl border border-border bg-background px-4 text-sm outline-none transition focus:border-primary"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-foreground">
                Fim da suspensão
              </label>

              <input
                name="fimSuspensao"
                type="date"
                className="h-12 w-full rounded-2xl border border-border bg-background px-4 text-sm outline-none transition focus:border-primary"
              />
            </div>
          </div>

          <div className="mt-5">
            <label className="mb-2 block text-sm font-medium text-foreground">
              Descrição *
            </label>

            <textarea
              name="descricao"
              required
              rows={8}
              placeholder={getTextoAjuda(tipoInicial)}
              className="w-full resize-none rounded-2xl border border-border bg-background px-4 py-3 text-sm leading-6 outline-none transition placeholder:text-muted-foreground focus:border-primary"
            />
          </div>

          <div className="mt-5 rounded-3xl border border-border bg-background p-5">
            <div className="flex items-start gap-3">
              <input
                id="enviarParaResponsavel"
                name="enviarParaResponsavel"
                type="checkbox"
                className="mt-1 h-4 w-4 rounded border-border"
                defaultChecked={
                  tipoInicial === "ADVERTENCIA" ||
                  tipoInicial === "SUSPENSAO" ||
                  tipoInicial === "RELATORIO"
                }
              />

              <div className="flex-1">
                <label
                  htmlFor="enviarParaResponsavel"
                  className="font-medium text-foreground"
                >
                  Preparar envio para o responsável
                </label>

                <p className="mt-1 text-sm leading-6 text-muted-foreground">
                  A Lumina vai salvar o texto final no prontuário e deixar o
                  envio preparado. O envio real por e-mail entra na próxima
                  etapa.
                </p>

                <div className="mt-4">
                  <label className="mb-2 block text-sm font-medium text-foreground">
                    E-mail do responsável
                  </label>

                  <input
                    name="emailResponsavel"
                    type="email"
                    defaultValue={alunoEncontrado.responsavel.email ?? ""}
                    placeholder="responsavel@email.com"
                    className="h-12 w-full rounded-2xl border border-border bg-background px-4 text-sm outline-none transition placeholder:text-muted-foreground focus:border-primary"
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="mt-6 flex flex-wrap items-center justify-end gap-3">
            <Link
              href={`/alunos/${alunoEncontrado.id}`}
              className="rounded-2xl border border-border px-5 py-3 text-sm font-semibold text-foreground transition hover:bg-muted"
            >
              Cancelar
            </Link>

            <button
              type="submit"
              className="rounded-2xl bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground transition hover:opacity-90"
            >
              Salvar registro
            </button>
          </div>
        </section>

        <aside className="space-y-6">
          <section className="rounded-3xl border border-border bg-card p-6 shadow-sm">
            <div className="mb-5 flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-muted">
                <Sparkles size={19} />
              </div>

              <div>
                <h2 className="font-semibold text-foreground">
                  Sugestão da Lumi
                </h2>
                <p className="text-sm text-muted-foreground">
                  Nesta etapa, a Lumi gera um texto formal automaticamente ao
                  salvar.
                </p>
              </div>
            </div>

            <div className="rounded-2xl bg-muted p-4">
              <p className="text-sm leading-6 text-foreground">
                {getTextoAjuda(tipoInicial)}
              </p>
            </div>
          </section>

          <section className="rounded-3xl border border-border bg-card p-6 shadow-sm">
            <div className="mb-5 flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-muted">
                <Mail size={19} />
              </div>

              <div>
                <h2 className="font-semibold text-foreground">Responsável</h2>
                <p className="text-sm text-muted-foreground">
                  Dados usados para comunicação futura.
                </p>
              </div>
            </div>

            <div className="space-y-3">
              <div className="rounded-2xl bg-muted p-4">
                <p className="text-xs font-medium uppercase tracking-[0.16em] text-muted-foreground">
                  Nome
                </p>
                <p className="mt-1 font-medium text-foreground">
                  {alunoEncontrado.responsavel.nome}
                </p>
              </div>

              <div className="rounded-2xl bg-muted p-4">
                <p className="text-xs font-medium uppercase tracking-[0.16em] text-muted-foreground">
                  E-mail
                </p>
                <p className="mt-1 font-medium text-foreground">
                  {alunoEncontrado.responsavel.email || "Não informado"}
                </p>
              </div>

              <div className="rounded-2xl bg-muted p-4">
                <p className="text-xs font-medium uppercase tracking-[0.16em] text-muted-foreground">
                  Telefone
                </p>
                <p className="mt-1 font-medium text-foreground">
                  {alunoEncontrado.responsavel.telefone}
                </p>
              </div>
            </div>
          </section>

          <section className="rounded-3xl border border-border bg-card p-6 shadow-sm">
            <div className="mb-5 flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-muted">
                <AlertTriangle size={19} />
              </div>

              <div>
                <h2 className="font-semibold text-foreground">Importante</h2>
              </div>
            </div>

            <div className="space-y-3 text-sm leading-6 text-muted-foreground">
              <p>
                Advertências, suspensões, atendimentos e relatórios ficarão
                salvos no prontuário digital do aluno.
              </p>

              <p>
                O envio por e-mail será ativado na próxima fase, junto com a
                comunicação inteligente.
              </p>
            </div>
          </section>
        </aside>
      </form>
    </AppLayout>
  );
}