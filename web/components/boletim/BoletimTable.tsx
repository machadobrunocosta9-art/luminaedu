import type { LinhaBoletim } from "@/lib/boletim";

function corDaMedia(media: number | null) {
  if (media === null) return "text-muted-foreground";
  if (media >= 70) return "text-emerald-600";
  if (media >= 50) return "text-amber-600";
  return "text-red-600";
}

export default function BoletimTable({
  alunoNome,
  turmaNome,
  escolaNome,
  escolaLogoUrl,
  anoLetivo,
  linhas,
}: {
  alunoNome: string;
  turmaNome: string | null;
  escolaNome: string;
  escolaLogoUrl?: string | null;
  anoLetivo: number;
  linhas: LinhaBoletim[];
}) {
  const linhasComNota = linhas.filter((linha) => linha.media !== null);

  const mediaGeral =
    linhasComNota.length > 0
      ? linhasComNota.reduce((soma, linha) => soma + (linha.media ?? 0), 0) /
        linhasComNota.length
      : null;

  return (
    <div className="overflow-hidden rounded-[26px] border border-border bg-card shadow-sm print:rounded-none print:border-0 print:shadow-none">
      <div className="border-b border-border px-6 py-6 text-center sm:px-8">
        {escolaLogoUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={escolaLogoUrl}
            alt={escolaNome}
            className="mx-auto mb-3 h-14 w-14 rounded-2xl object-cover"
          />
        ) : null}

        <p className="text-[13px] font-medium uppercase tracking-[0.18em] text-muted-foreground">
          {escolaNome}
        </p>

        <h1 className="mt-2 text-2xl font-semibold tracking-tight text-foreground">
          Boletim escolar
        </h1>

        <p className="mt-3 text-[15px] font-semibold text-foreground">
          {alunoNome}
        </p>
        <p className="mt-0.5 text-[13px] text-muted-foreground">
          {turmaNome ?? "Sem turma"} · Ano letivo {anoLetivo}
        </p>
      </div>

      {linhas.length === 0 ? (
        <p className="p-8 text-center text-sm text-muted-foreground">
          Nenhuma disciplina cadastrada ainda.
        </p>
      ) : (
        <>
          <div className="hidden overflow-x-auto sm:block print:block">
            <table className="w-full text-left text-sm">
              <thead className="bg-muted/40 text-[11px] uppercase tracking-wide text-muted-foreground">
                <tr>
                  <th className="px-6 py-3 font-semibold">Disciplina</th>
                  <th className="px-2 py-3 text-center font-semibold">1º</th>
                  <th className="px-2 py-3 text-center font-semibold">2º</th>
                  <th className="px-2 py-3 text-center font-semibold">3º</th>
                  <th className="px-2 py-3 text-center font-semibold">4º</th>
                  <th className="px-6 py-3 text-center font-semibold">Média</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {linhas.map((linha) => (
                  <tr key={linha.disciplinaId}>
                    <td className="px-6 py-3.5 font-medium text-foreground">
                      {linha.disciplinaNome}
                    </td>
                    {linha.notas.map((nota, index) => (
                      <td
                        key={index}
                        className="px-2 py-3.5 text-center tabular-nums text-muted-foreground"
                      >
                        {nota === null ? "—" : nota.toFixed(0)}
                      </td>
                    ))}
                    <td
                      className={`px-6 py-3.5 text-center text-[15px] font-semibold tabular-nums ${corDaMedia(
                        linha.media,
                      )}`}
                    >
                      {linha.media === null ? "—" : linha.media.toFixed(1)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="divide-y divide-border sm:hidden print:hidden">
            {linhas.map((linha) => (
              <div key={linha.disciplinaId} className="px-5 py-4">
                <div className="flex items-center justify-between gap-3">
                  <span className="font-medium text-foreground">
                    {linha.disciplinaNome}
                  </span>
                  <span
                    className={`text-[17px] font-semibold tabular-nums ${corDaMedia(
                      linha.media,
                    )}`}
                  >
                    {linha.media === null ? "—" : linha.media.toFixed(1)}
                  </span>
                </div>

                <div className="mt-2 flex gap-2">
                  {linha.notas.map((nota, index) => (
                    <div
                      key={index}
                      className="flex-1 rounded-xl bg-muted/60 py-2 text-center"
                    >
                      <p className="text-[10px] uppercase tracking-wide text-muted-foreground">
                        {index + 1}º
                      </p>
                      <p className="mt-0.5 text-[14px] font-medium tabular-nums text-foreground">
                        {nota === null ? "—" : nota.toFixed(0)}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>

          <div className="flex items-center justify-between border-t border-border bg-muted/30 px-6 py-4">
            <span className="text-sm font-semibold text-foreground">
              Média geral
            </span>
            <span
              className={`text-xl font-semibold tabular-nums ${corDaMedia(
                mediaGeral,
              )}`}
            >
              {mediaGeral === null ? "—" : mediaGeral.toFixed(1)}
            </span>
          </div>
        </>
      )}
    </div>
  );
}
