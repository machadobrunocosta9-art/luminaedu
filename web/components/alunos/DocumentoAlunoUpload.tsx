"use client";

import { upload } from "@vercel/blob/client";
import { AlertTriangle, CheckCircle2, LoaderCircle, UploadCloud } from "lucide-react";
import { useRouter } from "next/navigation";
import { ChangeEvent, FormEvent, useRef, useState } from "react";

const TAMANHO_MAXIMO = 10 * 1024 * 1024;
const TIPOS_ACEITOS = ["application/pdf", "image/jpeg", "image/png"];

function limparNomeArquivo(nome: string) {
  return nome
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .replace(/[^a-zA-Z0-9._-]/g, "-")
    .replace(/-+/g, "-")
    .toLowerCase();
}

export default function DocumentoAlunoUpload({ alunoId }: { alunoId: string }) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [titulo, setTitulo] = useState("");
  const [arquivo, setArquivo] = useState<File | null>(null);
  const [enviando, setEnviando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [sucesso, setSucesso] = useState(false);

  function selecionarArquivo(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0] ?? null;
    setErro(null);
    setSucesso(false);

    if (!file) {
      setArquivo(null);
      return;
    }

    if (!TIPOS_ACEITOS.includes(file.type)) {
      setArquivo(null);
      setErro("Envie somente arquivos PDF, JPG ou PNG.");
      event.target.value = "";
      return;
    }

    if (file.size > TAMANHO_MAXIMO) {
      setArquivo(null);
      setErro("O arquivo deve ter no máximo 10 MB.");
      event.target.value = "";
      return;
    }

    setArquivo(file);
  }

  async function enviar(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!arquivo) {
      setErro("Selecione um arquivo antes de enviar.");
      return;
    }

    if (!titulo.trim()) {
      setErro("Informe um título para o documento.");
      return;
    }

    try {
      setEnviando(true);
      setErro(null);
      setSucesso(false);

      const pathname = `alunos/${alunoId}/documentos/${Date.now()}-${limparNomeArquivo(arquivo.name)}`;

      const blob = await upload(pathname, arquivo, {
        access: "private",
        handleUploadUrl: "/api/alunos/documentos/upload",
        clientPayload: JSON.stringify({ alunoId }),
      });

      const response = await fetch("/api/alunos/documentos/registrar", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          alunoId,
          titulo: titulo.trim(),
          nomeArquivoOriginal: arquivo.name,
          urlArquivo: blob.url,
          chaveArmazenamento: blob.pathname,
          mimeType: arquivo.type,
          tamanhoBytes: arquivo.size,
        }),
      });

      const data = (await response.json()) as { error?: string };

      if (!response.ok) {
        throw new Error(data.error || "Não foi possível registrar o documento.");
      }

      setArquivo(null);
      setTitulo("");
      setSucesso(true);

      if (inputRef.current) {
        inputRef.current.value = "";
      }

      router.refresh();
    } catch (error) {
      setErro(
        error instanceof Error ? error.message : "Não foi possível enviar o documento.",
      );
    } finally {
      setEnviando(false);
    }
  }

  return (
    <form
      onSubmit={enviar}
      className="rounded-2xl border border-dashed border-border bg-background p-4"
    >
      <div className="grid gap-3 sm:grid-cols-[1fr_auto]">
        <input
          value={titulo}
          onChange={(event) => setTitulo(event.target.value)}
          placeholder="Título do documento (ex: RG, comprovante de residência...)"
          className="h-11 w-full rounded-xl border border-border bg-card px-3 text-sm outline-none focus:border-primary"
        />

        <input
          ref={inputRef}
          type="file"
          accept=".pdf,.jpg,.jpeg,.png,application/pdf,image/jpeg,image/png"
          onChange={selecionarArquivo}
          disabled={enviando}
          className="text-sm text-muted-foreground file:mr-3 file:rounded-xl file:border-0 file:bg-muted file:px-3 file:py-2 file:text-xs file:font-semibold file:text-foreground hover:file:bg-primary/10"
        />
      </div>

      {erro && (
        <div className="mt-3 flex items-center gap-2 text-xs text-red-600">
          <AlertTriangle size={14} />
          {erro}
        </div>
      )}

      {sucesso && (
        <div className="mt-3 flex items-center gap-2 text-xs text-emerald-600">
          <CheckCircle2 size={14} />
          Documento enviado com sucesso.
        </div>
      )}

      <button
        type="submit"
        disabled={!arquivo || enviando}
        className="mt-3 inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2 text-xs font-semibold text-primary-foreground transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {enviando ? (
          <LoaderCircle size={14} className="animate-spin" />
        ) : (
          <UploadCloud size={14} />
        )}
        {enviando ? "Enviando..." : "Anexar documento"}
      </button>
    </form>
  );
}
