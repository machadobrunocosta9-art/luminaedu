"use client";

import { upload } from "@vercel/blob/client";
import {
  AlertTriangle,
  CheckCircle2,
  FileText,
  LoaderCircle,
  UploadCloud,
} from "lucide-react";
import {
  ChangeEvent,
  FormEvent,
  useMemo,
  useRef,
  useState,
} from "react";

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

type DocumentUploadProps = {
  conviteToken: string;
  conviteId: string;
  tipoDocumento: TipoDocumento;
  titulo: string;
  descricao: string;
  obrigatorio?: boolean;
  bloqueado?: boolean;
};

const TAMANHO_MAXIMO = 10 * 1024 * 1024;

function limparNomeArquivo(nome: string) {
  return nome
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z0-9._-]/g, "-")
    .replace(/-+/g, "-")
    .toLowerCase();
}

function formatarTamanho(bytes: number) {
  if (bytes < 1024) {
    return `${bytes} B`;
  }

  if (bytes < 1024 * 1024) {
    return `${(bytes / 1024).toFixed(1)} KB`;
  }

  return `${(
    bytes /
    (1024 * 1024)
  ).toFixed(1)} MB`;
}

export default function DocumentUpload({
  conviteToken,
  conviteId,
  tipoDocumento,
  titulo,
  descricao,
  obrigatorio = true,
  bloqueado = false,
}: DocumentUploadProps) {
  const inputRef =
    useRef<HTMLInputElement>(null);

  const [arquivo, setArquivo] =
    useState<File | null>(null);

  const [enviando, setEnviando] =
    useState(false);

  const [sucesso, setSucesso] =
    useState(bloqueado);

  const [erro, setErro] =
    useState<string | null>(null);

  const resumoArquivo = useMemo(() => {
    if (!arquivo) {
      return null;
    }

    return `${arquivo.name} · ${formatarTamanho(
      arquivo.size,
    )}`;
  }, [arquivo]);

  function selecionarArquivo(
    event: ChangeEvent<HTMLInputElement>,
  ) {
    if (bloqueado) {
      return;
    }

    const file =
      event.target.files?.[0] ?? null;

    setErro(null);
    setSucesso(false);

    if (!file) {
      setArquivo(null);
      return;
    }

    const tiposAceitos = [
      "application/pdf",
      "image/jpeg",
      "image/png",
    ];

    if (!tiposAceitos.includes(file.type)) {
      setArquivo(null);
      setErro(
        "Envie somente arquivos PDF, JPG ou PNG.",
      );
      event.target.value = "";
      return;
    }

    if (file.size > TAMANHO_MAXIMO) {
      setArquivo(null);
      setErro(
        "O arquivo deve ter no máximo 10 MB.",
      );
      event.target.value = "";
      return;
    }

    setArquivo(file);
  }

  async function enviarDocumento(
    event: FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();

    if (bloqueado) {
      setErro("Este documento já foi enviado e está em processamento.");
      return;
    }

    if (!arquivo) {
      setErro(
        "Selecione um arquivo antes de enviar.",
      );
      return;
    }

    try {
      setEnviando(true);
      setErro(null);
      setSucesso(false);

      const nomeLimpo =
        limparNomeArquivo(arquivo.name);

      const pathname =
        `matriculas/${conviteId}/${tipoDocumento}/${Date.now()}-${nomeLimpo}`;

      const blob = await upload(
        pathname,
        arquivo,
        {
          access: "private",
          handleUploadUrl:
            "/api/matricula/documentos/upload",
          clientPayload: JSON.stringify({
            conviteToken,
            tipoDocumento,
          }),
        },
      );

      const response = await fetch(
        "/api/matricula/documentos/registrar",
        {
          method: "POST",
          headers: {
            "Content-Type":
              "application/json",
          },
          body: JSON.stringify({
            conviteToken,
            tipoDocumento,
            titulo,
            nomeArquivoOriginal:
              arquivo.name,
            urlArquivo: blob.url,
            chaveArmazenamento:
              blob.pathname,
            mimeType: arquivo.type,
            tamanhoBytes: arquivo.size,
          }),
        },
      );

      const data = (await response.json()) as {
        error?: string;
      };

      if (!response.ok) {
        throw new Error(
          data.error ||
            "Não foi possível registrar o documento.",
        );
      }

      setArquivo(null);
      setSucesso(true);

      if (inputRef.current) {
        inputRef.current.value = "";
      }
    } catch (error) {
      setErro(
        error instanceof Error
          ? error.message
          : "Não foi possível enviar o documento.",
      );
    } finally {
      setEnviando(false);
    }
  }

  return (
    <form
      onSubmit={enviarDocumento}
      className="rounded-3xl border border-[#e6e7ee] bg-white p-5 shadow-sm"
    >
      <div className="flex items-start gap-4">
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-[#f4f1ff] text-[#5b3fd6]">
          <FileText size={20} />
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="font-semibold text-[#1f2937]">
              {titulo}
            </h3>

            {obrigatorio ? (
              <span className="rounded-full bg-red-50 px-2.5 py-1 text-[11px] font-semibold text-red-700">
                Obrigatório
              </span>
            ) : (
              <span className="rounded-full bg-[#f3f4f8] px-2.5 py-1 text-[11px] font-semibold text-[#6b7280]">
                Opcional
              </span>
            )}
          </div>

          <p className="mt-1 text-sm leading-6 text-[#6b7280]">
            {descricao}
          </p>
        </div>
      </div>

      <div className="mt-5 rounded-2xl border border-dashed border-[#d7d9e2] bg-[#fafafc] p-4">
        <input
          ref={inputRef}
          type="file"
          accept=".pdf,.jpg,.jpeg,.png,application/pdf,image/jpeg,image/png"
          onChange={selecionarArquivo}
          disabled={bloqueado || enviando}
          className="block w-full text-sm text-[#6b7280] file:mr-4 file:rounded-xl file:border-0 file:bg-[#f4f1ff] file:px-4 file:py-2.5 file:text-sm file:font-semibold file:text-[#5b3fd6] hover:file:bg-[#ebe6ff]"
        />

        <p className="mt-3 text-xs text-[#6b7280]">
          PDF, JPG ou PNG · máximo de 10 MB
        </p>

        {resumoArquivo && (
          <p className="mt-3 break-all text-xs font-medium text-[#1f2937]">
            {resumoArquivo}
          </p>
        )}
      </div>

      {erro && (
        <div className="mt-4 flex items-start gap-2 rounded-2xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          <AlertTriangle
            size={17}
            className="mt-0.5 shrink-0"
          />
          <span>{erro}</span>
        </div>
      )}

      {sucesso && (
        <div className="mt-4 flex items-start gap-2 rounded-2xl border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-700">
          <CheckCircle2
            size={17}
            className="mt-0.5 shrink-0"
          />
          <span>
            Documento enviado com sucesso.
          </span>
        </div>
      )}

      <button
        type="submit"
        disabled={!arquivo || enviando || bloqueado}
        className="mt-5 inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-2xl bg-[#5b3fd6] px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-lg disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:translate-y-0"
      >
        {bloqueado ? (
          <>
            <CheckCircle2 size={17} />
            Documento recebido
          </>
        ) : enviando ? (
          <>
            <LoaderCircle
              size={17}
              className="animate-spin"
            />
            Enviando...
          </>
        ) : (
          <>
            <UploadCloud size={17} />
            Enviar documento
          </>
        )}
      </button>
    </form>
  );
}
