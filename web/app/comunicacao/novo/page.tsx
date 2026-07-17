import AppLayout from "@/components/layout/AppLayout";
import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import Link from "next/link";
import { randomUUID } from "crypto";
import {
  ArrowLeft,
  CalendarDays,
  Mail,
  Megaphone,
  Send,
  Sparkles,
  UsersRound,
} from "lucide-react";

export const dynamic = "force-dynamic";

function parseValorCentavos(valor: string) {
  if (!valor) return null;

  const limpo = valor
    .replace("R$", "")
    .replace(/\./g, "")
    .replace(",", ".")
    .trim();

  const numero = Number(limpo);

  if (Number.isNaN(numero)) return null;

  return Math.round(numero * 100);
}

function gerarConteudoSugerido({
  tipo,
  titulo,
  dataEvento,
  horaEvento,
  localEvento,
  valor,
  observacoes,
}: {
  tipo: string;
  titulo: string;
  dataEvento?: string;
  horaEvento?: string;
  localEvento?: string;
  valor?: string;
  observacoes?: string;
}) {
  if (tipo === "EVENTO") {
    return `Prezados responsáveis,

Informamos que realizaremos o evento "${titulo}"${
      dataEvento ? ` no dia ${dataEvento}` : ""
    }${horaEvento ? `, às ${horaEvento}` : ""}${
      localEvento ? `, no local ${localEvento}` : ""
    }.

${valor ? `Valor: ${valor}.` : ""}

${observacoes || "Em breve enviaremos mais informações sobre a organização do evento."}

Pedimos que confirme se o aluno irá participar.`;
  }

  if (tipo === "AUTORIZACAO") {
    return `Prezados responsáveis,

Solicitamos a autorização referente a "${titulo}".

${observacoes || "Leia as informações com atenção e confirme sua autorização."}

A confirmação ficará registrada digitalmente pela escola.`;
  }

  if (tipo === "CIENCIA") {
    return `Prezados responsáveis,

Encaminhamos o comunicado "${titulo}" para ciência da família.

${observacoes || "Pedimos que leia com atenção e confirme ciência."}

A confirmação ficará registrada digitalmente pela escola.`;
  }

  if (tipo === "PAGAMENTO") {
    return `Prezados responsáveis,

Encaminhamos informações referentes a "${titulo}".

${valor ? `Valor: ${valor}.` : ""}

${observacoes || "Pedimos atenção ao prazo informado pela escola."}`;
  }

  return `Prezados responsáveis,

Encaminhamos o comunicado "${titulo}".

${observacoes || "Pedimos que leiam com atenção as informações enviadas pela escola."}`;
}

export default async function NovoComunicadoPage() {
  const escola = await prisma.escola.findFirst({
    orderBy: {
      criadoEm: "asc",
    },
  });

  if (!escola) {
    throw new Error("Nenhuma escola encontrada.");
  }

  const escolaEncontrada = escola;

  const [alunos, turmas] = await Promise.all([
    prisma.aluno.findMany({
      where: {
        escolaId: escolaEncontrada.id,
      },
      orderBy: {
        nome: "asc",
      },
      include: {
        responsavel: true,
        turma: true,
      },
    }),
    prisma.turma.findMany({
      where: {
        escolaId: escolaEncontrada.id,
      },
      orderBy: {
        nome: "asc",
      },
    }),
  ]);

  async function criarComunicado(formData: FormData) {
    "use server";

    await requireAdmin();

    const tipo = String(formData.get("tipo") || "SIMPLES");
    const publicoAlvo = String(formData.get("publicoAlvo") || "ESCOLA");
    const titulo = String(formData.get("titulo") || "").trim();
    const conteudoManual = String(formData.get("conteudo") || "").trim();
    const turmaId = String(formData.get("turmaId") || "").trim();
    const alunoId = String(formData.get("alunoId") || "").trim();
    const dataEventoValue = String(formData.get("dataEvento") || "").trim();
    const horaEvento = String(formData.get("horaEvento") || "").trim();
    const localEvento = String(formData.get("localEvento") || "").trim();
    const valor = String(formData.get("valor") || "").trim();
    const observacoes = String(formData.get("observacoes") || "").trim();

    if (!titulo) {
      throw new Error("Título é obrigatório.");
    }

    if (publicoAlvo === "TURMA" && !turmaId) {
      throw new Error("Selecione uma turma.");
    }

    if (publicoAlvo === "ALUNO" && !alunoId) {
      throw new Error("Selecione um aluno.");
    }

    const conteudo =
      conteudoManual ||
      gerarConteudoSugerido({
        tipo,
        titulo,
        dataEvento: dataEventoValue,
        horaEvento,
        localEvento,
        valor,
        observacoes,
      });

    const comunicado = await prisma.comunicado.create({
      data: {
        tipo: tipo as
          | "SIMPLES"
          | "CIENCIA"
          | "EVENTO"
          | "AUTORIZACAO"
          | "PAGAMENTO",
        status: "PREPARADO",
        titulo,
        conteudo,
        publicoAlvo,
        observacoes: observacoes || null,
        dataEvento: dataEventoValue
          ? new Date(`${dataEventoValue}T00:00:00`)
          : null,
        horaEvento: horaEvento || null,
        localEvento: localEvento || null,
        valorCentavos: parseValorCentavos(valor),
        requerCiencia:
          tipo === "CIENCIA" ||
          tipo === "EVENTO" ||
          tipo === "AUTORIZACAO",
        requerParticipacao: tipo === "EVENTO",
        requerAutorizacao: tipo === "AUTORIZACAO",
        requerPagamento: tipo === "PAGAMENTO",
        permiteRespostaTexto: tipo === "EVENTO" || tipo === "AUTORIZACAO",
        escolaId: escolaEncontrada.id,
        turmaId: publicoAlvo === "TURMA" ? turmaId : null,
        alunoId: publicoAlvo === "ALUNO" ? alunoId : null,
      },
    });

    let alunosDestinatarios = await prisma.aluno.findMany({
      where: {
        escolaId: escolaEncontrada.id,
        ...(publicoAlvo === "TURMA" ? { turmaId } : {}),
        ...(publicoAlvo === "ALUNO" ? { id: alunoId } : {}),
      },
      include: {
        responsavel: true,
      },
      orderBy: {
        nome: "asc",
      },
    });

    alunosDestinatarios = alunosDestinatarios.filter(
      (aluno) => aluno.responsavel,
    );

    if (alunosDestinatarios.length > 0) {
      await prisma.destinatarioComunicado.createMany({
        data: alunosDestinatarios.map((aluno) => ({
          status: "PENDENTE",
          nomeResponsavel: aluno.responsavel.nome,
          email: aluno.responsavel.email,
          telefone: aluno.responsavel.telefone,
          tokenResposta: randomUUID(),
          escolaId: escolaEncontrada.id,
          comunicadoId: comunicado.id,
          alunoId: aluno.id,
          responsavelId: aluno.responsavelId,
        })),
      });
    }

    await prisma.tarefa.create({
      data: {
        titulo: `Enviar comunicado: ${titulo}`,
        descricao: `Comunicado inteligente preparado para ${alunosDestinatarios.length} destinatário(s).`,
        setor: "Comunicação",
        status: "A_FAZER",
        prioridade:
          tipo === "AUTORIZACAO" || tipo === "EVENTO" ? "ALTA" : "MEDIA",
        escolaId: escolaEncontrada.id,
      },
    });

    revalidatePath("/comunicacao");
    revalidatePath("/dashboard");
    revalidatePath("/pulse");
    revalidatePath("/relatorios");

    redirect("/comunicacao");
  }

  return (
    <AppLayout>
      <div className="mb-8">
        <Link
          href="/comunicacao"
          className="mb-5 inline-flex items-center gap-2 text-sm font-medium text-muted-foreground transition hover:text-foreground"
        >
          <ArrowLeft size={16} />
          Voltar para comunicação
        </Link>

        <div className="flex items-start justify-between gap-6">
          <div>
            <p className="text-sm font-medium text-muted-foreground">
              Comunicação Inteligente
            </p>

            <h1 className="mt-2 text-3xl font-semibold tracking-tight text-foreground">
              Novo comunicado
            </h1>

            <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
              Crie comunicados simples, avisos com ciência, eventos com
              participação, autorizações digitais e cobranças futuras.
            </p>
          </div>

          <div className="hidden rounded-3xl border border-border bg-card p-5 shadow-sm md:block">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-primary text-primary-foreground">
                <Megaphone size={20} />
              </div>

              <div>
                <p className="font-semibold text-foreground">
                  {escolaEncontrada.nome}
                </p>
                <p className="text-sm text-muted-foreground">
                  {alunos.length} aluno(s) cadastrados
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <form
        action={criarComunicado}
        className="grid gap-6 xl:grid-cols-[1fr_420px]"
      >
        <section className="rounded-3xl border border-border bg-card p-6 shadow-sm">
          <div className="mb-6 flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-muted">
              <Mail size={19} />
            </div>

            <div>
              <h2 className="font-semibold text-foreground">
                Dados do comunicado
              </h2>
              <p className="text-sm text-muted-foreground">
                Escolha o tipo, o público e escreva a mensagem.
              </p>
            </div>
          </div>

          <div className="grid gap-5 md:grid-cols-2">
            <div>
              <label className="mb-2 block text-sm font-medium text-foreground">
                Tipo de comunicado *
              </label>

              <select
                name="tipo"
                required
                defaultValue="CIENCIA"
                className="h-12 w-full rounded-2xl border border-border bg-background px-4 text-sm outline-none transition focus:border-primary"
              >
                <option value="SIMPLES">Comunicado simples</option>
                <option value="CIENCIA">Comunicado com ciência</option>
                <option value="EVENTO">Evento com participação</option>
                <option value="AUTORIZACAO">Autorização digital</option>
                <option value="PAGAMENTO">Comunicado com pagamento</option>
              </select>
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-foreground">
                Público-alvo *
              </label>

              <select
                name="publicoAlvo"
                required
                defaultValue="ESCOLA"
                className="h-12 w-full rounded-2xl border border-border bg-background px-4 text-sm outline-none transition focus:border-primary"
              >
                <option value="ESCOLA">Toda a escola</option>
                <option value="TURMA">Uma turma</option>
                <option value="ALUNO">Um aluno específico</option>
              </select>
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-foreground">
                Turma
              </label>

              <select
                name="turmaId"
                defaultValue=""
                className="h-12 w-full rounded-2xl border border-border bg-background px-4 text-sm outline-none transition focus:border-primary"
              >
                <option value="">Selecionar turma</option>
                {turmas.map((turma) => (
                  <option key={turma.id} value={turma.id}>
                    {turma.nome} · {turma.turno}
                  </option>
                ))}
              </select>

              <p className="mt-2 text-xs text-muted-foreground">
                Use quando o público-alvo for uma turma.
              </p>
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-foreground">
                Aluno
              </label>

              <select
                name="alunoId"
                defaultValue=""
                className="h-12 w-full rounded-2xl border border-border bg-background px-4 text-sm outline-none transition focus:border-primary"
              >
                <option value="">Selecionar aluno</option>
                {alunos.map((aluno) => (
                  <option key={aluno.id} value={aluno.id}>
                    {aluno.nome} · {aluno.turma?.nome ?? "Sem turma"}
                  </option>
                ))}
              </select>

              <p className="mt-2 text-xs text-muted-foreground">
                Use quando o público-alvo for um aluno específico.
              </p>
            </div>
          </div>

          <div className="mt-5">
            <label className="mb-2 block text-sm font-medium text-foreground">
              Título *
            </label>

            <input
              name="titulo"
              required
              placeholder="Ex: Passeio pedagógico ao zoológico"
              className="h-12 w-full rounded-2xl border border-border bg-background px-4 text-sm outline-none transition placeholder:text-muted-foreground focus:border-primary"
            />
          </div>

          <div className="mt-5 grid gap-5 md:grid-cols-4">
            <div>
              <label className="mb-2 block text-sm font-medium text-foreground">
                Data do evento
              </label>

              <input
                name="dataEvento"
                type="date"
                className="h-12 w-full rounded-2xl border border-border bg-background px-4 text-sm outline-none transition focus:border-primary"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-foreground">
                Hora
              </label>

              <input
                name="horaEvento"
                placeholder="Ex: 08:00"
                className="h-12 w-full rounded-2xl border border-border bg-background px-4 text-sm outline-none transition placeholder:text-muted-foreground focus:border-primary"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-foreground">
                Local
              </label>

              <input
                name="localEvento"
                placeholder="Ex: Escola"
                className="h-12 w-full rounded-2xl border border-border bg-background px-4 text-sm outline-none transition placeholder:text-muted-foreground focus:border-primary"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-foreground">
                Valor
              </label>

              <input
                name="valor"
                placeholder="Ex: 45,00"
                className="h-12 w-full rounded-2xl border border-border bg-background px-4 text-sm outline-none transition placeholder:text-muted-foreground focus:border-primary"
              />
            </div>
          </div>

          <div className="mt-5">
            <label className="mb-2 block text-sm font-medium text-foreground">
              Observações para a Lumi
            </label>

            <textarea
              name="observacoes"
              rows={4}
              placeholder="Ex: precisa levar lanche, uniforme da escola, autorização obrigatória..."
              className="w-full resize-none rounded-2xl border border-border bg-background px-4 py-3 text-sm leading-6 outline-none transition placeholder:text-muted-foreground focus:border-primary"
            />
          </div>

          <div className="mt-5">
            <label className="mb-2 block text-sm font-medium text-foreground">
              Texto do comunicado
            </label>

            <textarea
              name="conteudo"
              rows={8}
              placeholder="Você pode escrever o texto completo aqui ou deixar vazio para a Lumina gerar um texto-base automaticamente."
              className="w-full resize-none rounded-2xl border border-border bg-background px-4 py-3 text-sm leading-6 outline-none transition placeholder:text-muted-foreground focus:border-primary"
            />
          </div>

          <div className="mt-6 flex flex-wrap justify-end gap-3">
            <Link
              href="/comunicacao"
              className="rounded-2xl border border-border px-5 py-3 text-sm font-semibold text-foreground transition hover:bg-muted"
            >
              Cancelar
            </Link>

            <button
              type="submit"
              className="inline-flex items-center gap-2 rounded-2xl bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground transition hover:opacity-90"
            >
              <Send size={18} />
              Criar comunicado
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
                  Como a Lumi ajuda
                </h2>
                <p className="text-sm text-muted-foreground">
                  A comunicação já nasce com inteligência.
                </p>
              </div>
            </div>

            <div className="space-y-3 text-sm leading-6 text-muted-foreground">
              <p>
                Se você deixar o texto vazio, a Lumina cria um texto-base usando
                o tipo do comunicado, título, data, local, valor e observações.
              </p>

              <p>
                Na próxima fase, a Lumi poderá reescrever o comunicado em tom
                mais formal, acolhedor ou curto para WhatsApp.
              </p>
            </div>
          </section>

          <section className="rounded-3xl border border-border bg-card p-6 shadow-sm">
            <div className="mb-5 flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-muted">
                <UsersRound size={19} />
              </div>

              <div>
                <h2 className="font-semibold text-foreground">Respostas</h2>
                <p className="text-sm text-muted-foreground">
                  O que cada tipo permite.
                </p>
              </div>
            </div>

            <div className="space-y-3">
              <div className="rounded-2xl bg-muted p-4">
                <p className="font-medium text-foreground">
                  Comunicado com ciência
                </p>
                <p className="mt-1 text-sm text-muted-foreground">
                  Responsável marca “Estou ciente”.
                </p>
              </div>

              <div className="rounded-2xl bg-muted p-4">
                <p className="font-medium text-foreground">
                  Evento com participação
                </p>
                <p className="mt-1 text-sm text-muted-foreground">
                  Responsável escolhe se o aluno participa ou não.
                </p>
              </div>

              <div className="rounded-2xl bg-muted p-4">
                <p className="font-medium text-foreground">
                  Autorização digital
                </p>
                <p className="mt-1 text-sm text-muted-foreground">
                  Responsável autoriza ou não autoriza.
                </p>
              </div>
            </div>
          </section>

          <section className="rounded-3xl border border-border bg-card p-6 shadow-sm">
            <div className="mb-5 flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-muted">
                <CalendarDays size={19} />
              </div>

              <div>
                <h2 className="font-semibold text-foreground">
                  Eventos com resposta
                </h2>
              </div>
            </div>

            <p className="text-sm leading-6 text-muted-foreground">
              Quando o responsável marcar “não participa”, a Lumina vai pedir o
              motivo. Isso elimina papel, lista manual e mensagens perdidas.
            </p>
          </section>
        </aside>
      </form>
    </AppLayout>
  );
}
