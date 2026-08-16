"use client";

import { useState } from "react";
import { Plus } from "lucide-react";

type ResponsavelOpcao = {
  id: string;
  nome: string;
  alunos: { id: string; nome: string }[];
};

export default function NovaConversaForm({
  responsaveis,
  action,
}: {
  responsaveis: ResponsavelOpcao[];
  action: (formData: FormData) => void | Promise<void>;
}) {
  const [responsavelId, setResponsavelId] = useState("");

  const responsavelSelecionado = responsaveis.find(
    (responsavel) => responsavel.id === responsavelId,
  );

  if (responsaveis.length === 0) {
    return null;
  }

  return (
    <details className="group mb-6 overflow-hidden rounded-3xl border border-border bg-card shadow-sm">
      <summary className="flex cursor-pointer list-none items-center justify-between px-6 py-4 text-sm font-semibold text-primary">
        <span className="inline-flex items-center gap-2">
          <Plus size={17} />
          Iniciar conversa com um responsável
        </span>
        <span className="text-lg transition group-open:rotate-45">+</span>
      </summary>

      <form action={action} className="space-y-5 px-6 pb-6">
        <div className="grid gap-5 md:grid-cols-2">
          <div>
            <label className="mb-2 block text-sm font-medium text-foreground">
              Responsável *
            </label>
            <select
              name="responsavelId"
              required
              value={responsavelId}
              onChange={(event) => setResponsavelId(event.target.value)}
              className="h-12 w-full rounded-2xl border border-border bg-background px-4 text-sm outline-none focus:border-primary"
            >
              <option value="">Selecione</option>
              {responsaveis.map((responsavel) => (
                <option key={responsavel.id} value={responsavel.id}>
                  {responsavel.nome}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-foreground">
              Sobre qual aluno? (opcional)
            </label>
            <select
              name="alunoId"
              defaultValue=""
              disabled={!responsavelSelecionado}
              className="h-12 w-full rounded-2xl border border-border bg-background px-4 text-sm outline-none focus:border-primary disabled:opacity-50"
            >
              <option value="">Assunto geral</option>
              {responsavelSelecionado?.alunos.map((aluno) => (
                <option key={aluno.id} value={aluno.id}>
                  {aluno.nome}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div>
          <label className="mb-2 block text-sm font-medium text-foreground">
            Assunto *
          </label>
          <input
            name="assunto"
            required
            placeholder="Ex: Conversa sobre adaptação"
            className="h-12 w-full rounded-2xl border border-border bg-background px-4 text-sm outline-none focus:border-primary"
          />
        </div>

        <div>
          <label className="mb-2 block text-sm font-medium text-foreground">
            Mensagem *
          </label>
          <textarea
            name="texto"
            required
            rows={4}
            className="w-full resize-none rounded-2xl border border-border bg-background px-4 py-3 text-sm outline-none focus:border-primary"
          />
        </div>

        <p className="text-xs text-muted-foreground">
          O responsável recebe por e-mail e, se tiver ativado, também por
          notificação no celular.
        </p>

        <button
          type="submit"
          className="rounded-2xl bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground transition hover:opacity-90"
        >
          Enviar mensagem
        </button>
      </form>
    </details>
  );
}
