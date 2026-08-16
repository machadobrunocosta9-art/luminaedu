import AppLayout from "@/components/layout/AppLayout";
import {
  isReservedAdminEmail,
  requireAdmin,
  resolveAuthSchoolId,
} from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { hashPassword } from "@/lib/security/password";
import { normalizeEmail } from "@/lib/security/tokens";
import { redirect } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Save } from "lucide-react";

export const dynamic = "force-dynamic";

async function criarPessoaEquipe(formData: FormData) {
  "use server";

  const auth = await requireAdmin("ADMINISTRAR_SISTEMA");
  const escolaId = await resolveAuthSchoolId(auth);

  const nome = String(formData.get("nome") || "").trim();
  const emailBruto = String(formData.get("email") || "").trim();
  const papel = String(formData.get("papel") || "");
  const senha = String(formData.get("senha") || "");

  const papeisPermitidos = [
    "ADMINISTRADOR",
    "SECRETARIA",
    "COORDENACAO",
    "FINANCEIRO",
    "PROFESSOR",
  ];

  if (!nome || !emailBruto || !papeisPermitidos.includes(papel)) {
    throw new Error("Preencha nome, e-mail e papel corretamente.");
  }

  if (senha.length < 12) {
    throw new Error("A senha temporária deve ter pelo menos 12 caracteres.");
  }

  if (isReservedAdminEmail(emailBruto)) {
    throw new Error(
      "Este e-mail é o do administrador do sistema e não pode ser usado para outra conta.",
    );
  }

  const email = normalizeEmail(emailBruto);
  const senhaHash = await hashPassword(senha);

  const usuario = await prisma.usuario.create({
    data: {
      nome,
      email,
      senhaHash,
      papel: papel as
        | "ADMINISTRADOR"
        | "SECRETARIA"
        | "COORDENACAO"
        | "FINANCEIRO"
        | "PROFESSOR",
      status: "ATIVO",
      escolaId,
    },
  });

  if (papel === "PROFESSOR") {
    redirect(`/equipe/${usuario.id}`);
  }

  redirect("/equipe");
}

export default async function NovaPessoaEquipePage() {
  await requireAdmin("ADMINISTRAR_SISTEMA");

  return (
    <AppLayout>
      <Link
        href="/equipe"
        className="mb-5 inline-flex items-center gap-2 text-sm font-medium text-muted-foreground transition hover:text-foreground"
      >
        <ArrowLeft size={16} />
        Voltar para equipe
      </Link>

      <div className="mb-6">
        <h1 className="text-3xl font-semibold tracking-tight text-foreground">
          Adicionar pessoa da equipe
        </h1>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
          Crie o login e defina uma senha temporária. Compartilhe o e-mail e a
          senha com a pessoa — ela pode trocar depois no perfil dela.
        </p>
      </div>

      <form
        action={criarPessoaEquipe}
        className="max-w-xl space-y-5 rounded-3xl border border-border bg-card p-6 shadow-sm"
      >
        <div>
          <label className="mb-2 block text-sm font-medium text-foreground">
            Nome completo *
          </label>
          <input
            name="nome"
            required
            className="h-12 w-full rounded-2xl border border-border bg-background px-4 text-sm outline-none focus:border-primary"
          />
        </div>

        <div>
          <label className="mb-2 block text-sm font-medium text-foreground">
            E-mail *
          </label>
          <input
            name="email"
            type="email"
            required
            className="h-12 w-full rounded-2xl border border-border bg-background px-4 text-sm outline-none focus:border-primary"
          />
        </div>

        <div>
          <label className="mb-2 block text-sm font-medium text-foreground">
            Papel *
          </label>
          <select
            name="papel"
            required
            defaultValue="PROFESSOR"
            className="h-12 w-full rounded-2xl border border-border bg-background px-4 text-sm outline-none focus:border-primary"
          >
            <option value="PROFESSOR">Professor(a)</option>
            <option value="SECRETARIA">Secretaria</option>
            <option value="COORDENACAO">Coordenação</option>
            <option value="FINANCEIRO">Financeiro</option>
            <option value="ADMINISTRADOR">Administrador(a)</option>
          </select>
        </div>

        <div>
          <label className="mb-2 block text-sm font-medium text-foreground">
            Senha temporária *
          </label>
          <input
            name="senha"
            type="text"
            required
            minLength={12}
            placeholder="Defina uma senha para compartilhar"
            className="h-12 w-full rounded-2xl border border-border bg-background px-4 text-sm outline-none focus:border-primary"
          />
          <p className="mt-2 text-xs text-muted-foreground">
            Mínimo de 12 caracteres. A pessoa poderá trocar no próprio perfil.
          </p>
        </div>

        <button
          type="submit"
          className="inline-flex items-center gap-2 rounded-2xl bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground transition hover:opacity-90"
        >
          <Save size={18} />
          Criar conta
        </button>
      </form>
    </AppLayout>
  );
}
