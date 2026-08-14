"use client";

import { upload } from "@vercel/blob/client";
import { ImageIcon, LoaderCircle, UploadCloud } from "lucide-react";
import { ChangeEvent, useRef, useState } from "react";

const TAMANHO_MAXIMO = 5 * 1024 * 1024;
const TIPOS_ACEITOS = ["image/jpeg", "image/png", "image/webp"];

function limparNomeArquivo(nome: string) {
  return nome
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .replace(/[^a-zA-Z0-9._-]/g, "-")
    .replace(/-+/g, "-")
    .toLowerCase();
}

export default function ImageUploadField({
  label,
  pathPrefix,
  clientPayload,
  currentUrl,
  onUploaded,
  shape = "circle",
}: {
  label: string;
  pathPrefix: string;
  clientPayload: Record<string, string>;
  currentUrl?: string | null;
  onUploaded: (url: string) => Promise<void>;
  shape?: "circle" | "square";
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<string | null>(currentUrl ?? null);
  const [enviando, setEnviando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  async function selecionarArquivo(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0] ?? null;
    setErro(null);

    if (!file) {
      return;
    }

    if (!TIPOS_ACEITOS.includes(file.type)) {
      setErro("Envie uma imagem JPG, PNG ou WEBP.");
      event.target.value = "";
      return;
    }

    if (file.size > TAMANHO_MAXIMO) {
      setErro("A imagem deve ter no máximo 5 MB.");
      event.target.value = "";
      return;
    }

    try {
      setEnviando(true);

      const pathname = `${pathPrefix}${Date.now()}-${limparNomeArquivo(file.name)}`;

      const blob = await upload(pathname, file, {
        access: "public",
        handleUploadUrl: "/api/uploads/imagem",
        clientPayload: JSON.stringify(clientPayload),
      });

      await onUploaded(blob.url);
      setPreview(blob.url);
    } catch (error) {
      setErro(
        error instanceof Error
          ? error.message
          : "Não foi possível enviar a imagem.",
      );
    } finally {
      setEnviando(false);

      if (inputRef.current) {
        inputRef.current.value = "";
      }
    }
  }

  const previewClasses =
    shape === "circle"
      ? "h-20 w-20 rounded-full"
      : "h-20 w-40 rounded-2xl";

  return (
    <div className="flex items-center gap-4">
      <div
        className={`flex shrink-0 items-center justify-center overflow-hidden border border-border bg-muted text-muted-foreground ${previewClasses}`}
      >
        {preview ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={preview} alt={label} className="h-full w-full object-cover" />
        ) : (
          <ImageIcon size={24} />
        )}
      </div>

      <div>
        <label className="inline-flex cursor-pointer items-center gap-2 rounded-2xl border border-border bg-card px-4 py-2 text-sm font-semibold text-foreground transition hover:bg-muted">
          {enviando ? (
            <LoaderCircle size={16} className="animate-spin" />
          ) : (
            <UploadCloud size={16} />
          )}
          {enviando ? "Enviando..." : label}
          <input
            ref={inputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            onChange={selecionarArquivo}
            disabled={enviando}
            className="hidden"
          />
        </label>

        <p className="mt-2 text-xs text-muted-foreground">
          JPG, PNG ou WEBP · máximo de 5 MB
        </p>

        {erro && <p className="mt-2 text-xs text-red-600">{erro}</p>}
      </div>
    </div>
  );
}
