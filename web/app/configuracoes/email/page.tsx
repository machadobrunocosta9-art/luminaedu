import AppLayout from "@/components/layout/AppLayout";
import { requireAdmin, resolveAuthSchoolId } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import {
  criptografarSegredo,
  podeGuardarSegredo,
} from "@/lib/security/segredos";
import { getCredenciaisSmtpDaEscola } from "@/lib/email/config";
import { sendWithSmtp } from "@/lib/email/smtp-provider";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, CheckCircle2, Mail, TriangleAlert } from "lucide-react";
import CampoSenhaApp from "@/components/configuracoes/CampoSenhaApp";

export const dynamic = "force-dynamic";

async function salvarConfiguracao(formData: FormData) {
  "use server";

  const auth = await requireAdmin("ADMINISTRAR_SISTEMA");
  const escolaId = await resolveAuthSchoolId(auth);

  const remetenteNome = String(formData.get("remetenteNome") || "").trim();
  const usuario = String(formData.get("usuario") || "").trim();
  const senhaBruta = String(formData.get("senha") || "");
  const host = String(formData.get("host") || "smtp.gmail.com").trim();
  const porta = Number(String(formData.get("porta") || "465").trim());

  if (!usuario || !remetenteNome) {
    redirect("/configuracoes/email?erro=campos");
  }

  // Remove espacos: o Google mostra a senha de app em 4 blocos.
  const senha = senhaBruta.replace(/\s+/g, "");

  const existente = await prisma.configuracaoEmail.findUnique({
    where: { escolaId },
    select: { id: true },
  });

  if (!senha && !existente) {
    redirect("/configuracoes/email?erro=senha");
  }

  if (!podeGuardarSegredo()) {
    redirect("/configuracoes/email?erro=cofre");
  }

  const remetente = `${remetenteNome} <${usuario}>`;

  await prisma.configuracaoEmail.upsert({
    where: { escolaId },
    update: {
      remetente,
      usuario,
      host,
      porta: Number.isNaN(porta) ? 465 : porta,
      ativo: true,
      // Sem senha nova, mantem a que ja estava guardada.
      ...(senha ? { senha: criptografarSegredo(senha) } : {}),
    },
    create: {
      escolaId,
      remetente,
      usuario,
      senha: criptografarSegredo(senha),
      host,
      porta: Number.isNaN(porta) ? 465 : porta,
      ativo: true,
    },
  });

  revalidatePath("/configuracoes/email");
  redirect("/configuracoes/email?salvo=1");
}

async function enviarTeste(formData: FormData) {
  "use server";

  const auth = await requireAdmin("ADMINISTRAR_SISTEMA");
  const escolaId = await resolveAuthSchoolId(auth);
  const destino = String(formData.get("destino") || "").trim();

  if (!destino) {
    redirect("/configuracoes/email?erro=destino");
  }

  const credenciais = await getCredenciaisSmtpDaEscola(escolaId);

  if (!credenciais) {
    redirect("/configuracoes/email?erro=semconfig");
  }

  const resultado = await sendWithSmtp(
    {
      to: destino,
      subject: "Teste de e-mail da Lumina",
      text: "Deu certo! O envio de e-mails da sua escola está funcionando.",
      html: "<p>Deu certo! O envio de e-mails da sua escola está funcionando.</p>",
    },
    credenciais,
  );

  if (resultado.status === "sent") {
    redirect("/configuracoes/email?teste=ok");
  }

  const motivo = encodeURIComponent(
    "errorClass" in resultado ? resultado.errorClass : "Falha desconhecida",
  );

  redirect(`/configuracoes/email?teste=falhou&motivo=${motivo}`);
}

const ERROS: Record<string, string> = {
  campos: "Preencha o nome de exibição e o e-mail.",
  senha: "Informe a senha de app na primeira configuração.",
  destino: "Informe um e-mail para receber o teste.",
  semconfig: "Salve a configuração antes de enviar o teste.",
  cofre:
    "A aplicação não está preparada para guardar segredos com segurança. Fale com o suporte técnico.",
};

export default async function ConfiguracaoEmailPage({
  searchParams,
}: {
  searchParams?: Promise<{
    salvo?: string;
    erro?: string;
    teste?: string;
    motivo?: string;
  }>;
}) {
  const auth = await requireAdmin("ADMINISTRAR_SISTEMA");
  const escolaId = await resolveAuthSchoolId(auth);
  const query = searchParams ? await searchParams : {};

  const configuracao = await prisma.configuracaoEmail.findUnique({
    where: { escolaId },
  });

  const nomeAtual = configuracao?.remetente.replace(/\s*<.*$/, "") ?? "";
  const erro = query.erro ? ERROS[query.erro] : null;

  return (
    <AppLayout>
      <Link
        href="/configuracoes"
        className="mb-5 inline-flex items-center gap-2 text-sm font-medium text-muted-foreground transition hover:text-foreground"
      >
        <ArrowLeft size={16} />
        Voltar para configurações
      </Link>

      <div className="mb-6">
        <h1 className="text-3xl font-semibold tracking-tight text-foreground">
          E-mail da escola
        </h1>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
          Configure a conta que envia os comunicados, convites e avisos às
          famílias. Recomendamos um Gmail exclusivo da escola.
        </p>
      </div>

      {erro && (
        <div className="mb-6 flex items-start gap-3 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          <TriangleAlert size={18} className="mt-0.5 shrink-0" />
          {erro}
        </div>
      )}

      {query.salvo === "1" && (
        <div className="mb-6 flex items-center gap-3 rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm font-medium text-emerald-700">
          <CheckCircle2 size={18} />
          Configuração salva. Envie um teste abaixo para confirmar.
        </div>
      )}

      {query.teste === "ok" && (
        <div className="mb-6 flex items-center gap-3 rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm font-medium text-emerald-700">
          <CheckCircle2 size={18} />
          E-mail de teste enviado! Confira a caixa de entrada.
        </div>
      )}

      {query.teste === "falhou" && (
        <div className="mb-6 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          <p className="font-semibold">O teste falhou.</p>
          <p className="mt-1 break-words">
            {query.motivo ? decodeURIComponent(query.motivo) : "Erro desconhecido."}
          </p>
          <p className="mt-2 text-xs">
            Se a mensagem falar em autenticação, confira se a senha é uma
            &quot;senha de app&quot; do Google (não a senha normal da conta).
          </p>
        </div>
      )}

      <form
        action={salvarConfiguracao}
        className="mb-6 max-w-xl space-y-5 rounded-3xl border border-border bg-card p-6 shadow-sm"
      >
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-primary/10 text-primary">
            <Mail size={20} />
          </div>
          <div>
            <h2 className="font-semibold text-foreground">Conta de envio</h2>
            <p className="text-sm text-muted-foreground">
              {configuracao
                ? "Já configurado. Deixe a senha em branco para manter a atual."
                : "Ainda não configurado."}
            </p>
          </div>
        </div>

        <div>
          <label className="mb-2 block text-sm font-medium text-foreground">
            Nome que aparece para as famílias *
          </label>
          <input
            name="remetenteNome"
            required
            defaultValue={nomeAtual}
            placeholder="Ex: Jardim Escola Girassol Encantado"
            className="h-12 w-full rounded-2xl border border-border bg-background px-4 text-sm outline-none focus:border-primary"
          />
        </div>

        <div>
          <label className="mb-2 block text-sm font-medium text-foreground">
            E-mail da escola *
          </label>
          <input
            name="usuario"
            type="email"
            required
            defaultValue={configuracao?.usuario ?? ""}
            placeholder="comunicacao.suaescola@gmail.com"
            className="h-12 w-full rounded-2xl border border-border bg-background px-4 text-sm outline-none focus:border-primary"
          />
        </div>

        <CampoSenhaApp obrigatorio={!configuracao} />

        <details className="rounded-2xl bg-muted/40 p-4">
          <summary className="cursor-pointer text-sm font-medium text-foreground">
            Configuração avançada (outro provedor)
          </summary>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-2 block text-sm font-medium text-foreground">
                Servidor (host)
              </label>
              <input
                name="host"
                defaultValue={configuracao?.host ?? "smtp.gmail.com"}
                className="h-11 w-full rounded-xl border border-border bg-background px-3 text-sm outline-none focus:border-primary"
              />
            </div>
            <div>
              <label className="mb-2 block text-sm font-medium text-foreground">
                Porta
              </label>
              <input
                name="porta"
                type="number"
                defaultValue={configuracao?.porta ?? 465}
                className="h-11 w-full rounded-xl border border-border bg-background px-3 text-sm outline-none focus:border-primary"
              />
            </div>
          </div>
        </details>

        <button
          type="submit"
          className="rounded-2xl bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground transition hover:opacity-90"
        >
          Salvar configuração
        </button>
      </form>

      {configuracao && (
        <form
          action={enviarTeste}
          className="max-w-xl space-y-4 rounded-3xl border border-border bg-card p-6 shadow-sm"
        >
          <div>
            <h2 className="font-semibold text-foreground">Enviar teste</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Dispara um e-mail real para confirmar se está tudo certo.
            </p>
          </div>

          <div className="flex flex-wrap items-end gap-3">
            <div className="min-w-[240px] flex-1">
              <label className="mb-2 block text-sm font-medium text-foreground">
                Enviar para
              </label>
              <input
                name="destino"
                type="email"
                required
                defaultValue={configuracao.usuario}
                className="h-12 w-full rounded-2xl border border-border bg-background px-4 text-sm outline-none focus:border-primary"
              />
            </div>

            <button
              type="submit"
              className="h-12 rounded-2xl border border-border px-6 text-sm font-semibold text-foreground transition hover:bg-muted"
            >
              Enviar teste
            </button>
          </div>
        </form>
      )}
    </AppLayout>
  );
}
