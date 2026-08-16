"use client";

import { Printer } from "lucide-react";

export default function PrintButton({
  label = "Imprimir",
  className,
}: {
  label?: string;
  className?: string;
}) {
  return (
    <button
      type="button"
      onClick={() => window.print()}
      className={
        className ??
        "inline-flex items-center gap-2 rounded-2xl border border-border bg-card px-5 py-3 text-sm font-semibold text-foreground transition hover:bg-muted print:hidden"
      }
    >
      <Printer size={18} />
      {label}
    </button>
  );
}
