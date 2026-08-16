import AppLayout from "@/components/layout/AppLayout";
import { requireAdmin, resolveAuthSchoolId } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export const dynamic = "force-dynamic";

function formatDateTime(date: Date) {
  return new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(date);
}

const STATUS_LABELS: Record<string, string> = {
  PENDENTE: "Pendente",
  ENVIADO: "Enviado",
  FALHOU: "Falhou",
  NAO_CONFIGURADO: "Não configurado (falta chave/remetente)",
};

const STATUS_CLASSES: Record<string, string> = {
  PENDENTE: "bg-amber-50 text-amber-700",
  ENVIADO: "bg-emerald-50 text-emerald-700",
  FALHOU: "bg-red-50 text-red-700",
  NAO_CONFIGURADO: "bg-slate-100 text-slate-600",
};

export default async function EmailLogPage() {
  const auth = await requireAdmin("ADMINISTRAR_SISTEMA");
  const escolaId = await resolveAuthSchoolId(auth);

  const emails = await prisma.emailTransacional.findMany({
    where: { escolaId },
    orderBy: { criadoEm: "desc" },
    take: 50,
  });

  const naoConfigurado = emails.filter(
    (email) => email.status === "NAO_CONFIGURADO",
  ).length;
  const falhou = emails.filter((email) => email.status === "FALHOU").length;

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
          Log de e-mails
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Últimos 50 e-mails transacionais e o status de envio de cada um.
        </p>
      </div>

      {(naoConfigurado > 0 || falhou > 0) && (
        <div className="mb-6 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
          {naoConfigurado > 0 && (
            <p>
              {naoConfigurado} e-mail(s) não foram enviados por falta de
              configuração (RESEND_API_KEY, EMAIL_FROM, EMAIL_PROVIDER ou
              EMAIL_DELIVERY_ENABLED).
            </p>
          )}
          {falhou > 0 && (
            <p>{falhou} e-mail(s) falharam ao tentar enviar pelo Resend.</p>
          )}
        </div>
      )}

      {emails.length === 0 ? (
        <div className="rounded-3xl border border-dashed border-border p-8 text-center text-sm text-muted-foreground">
          Nenhum e-mail transacional registrado ainda.
        </div>
      ) : (
        <div className="overflow-hidden rounded-3xl border border-border bg-card shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[720px] text-left text-sm">
              <thead className="bg-muted/40 text-xs uppercase tracking-wide text-muted-foreground">
                <tr>
                  <th className="px-5 py-3 font-medium">Data</th>
                  <th className="px-5 py-3 font-medium">Tipo</th>
                  <th className="px-5 py-3 font-medium">Destinatário</th>
                  <th className="px-5 py-3 font-medium">Assunto</th>
                  <th className="px-5 py-3 font-medium">Status</th>
                  <th className="px-5 py-3 font-medium">Erro</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {emails.map((email) => (
                  <tr key={email.id}>
                    <td className="px-5 py-3 text-muted-foreground">
                      {formatDateTime(email.criadoEm)}
                    </td>
                    <td className="px-5 py-3 text-muted-foreground">
                      {email.tipo}
                    </td>
                    <td className="px-5 py-3 text-foreground">
                      {email.destinatario}
                    </td>
                    <td className="px-5 py-3 text-muted-foreground">
                      {email.assunto}
                    </td>
                    <td className="px-5 py-3">
                      <span
                        className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${
                          STATUS_CLASSES[email.status] ?? ""
                        }`}
                      >
                        {STATUS_LABELS[email.status] ?? email.status}
                      </span>
                    </td>
                    <td className="px-5 py-3 text-xs text-red-600">
                      {email.erroClasse ?? ""}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </AppLayout>
  );
}
