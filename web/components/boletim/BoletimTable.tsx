import type { LinhaBoletim } from "@/lib/boletim";

export default function BoletimTable({
  alunoNome,
  turmaNome,
  escolaNome,
  anoLetivo,
  linhas,
}: {
  alunoNome: string;
  turmaNome: string | null;
  escolaNome: string;
  anoLetivo: number;
  linhas: LinhaBoletim[];
}) {
  return (
    <div className="rounded-3xl border border-border bg-card p-6 shadow-sm print:rounded-none print:border-0 print:shadow-none">
      <div className="mb-6 text-center">
        <p className="text-sm font-medium text-muted-foreground">
          {escolaNome}
        </p>
        <h1 className="mt-1 text-2xl font-semibold tracking-tight text-foreground">
          Boletim escolar
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {alunoNome} · {turmaNome ?? "Sem turma"} · Ano letivo {anoLetivo}
        </p>
      </div>

      {linhas.length === 0 ? (
        <p className="rounded-2xl border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
          Nenhuma disciplina cadastrada ainda.
        </p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[480px] text-left text-sm">
            <thead className="border-b border-border text-xs uppercase tracking-wide text-muted-foreground">
              <tr>
                <th className="py-3 pr-3 font-medium">Disciplina</th>
                <th className="px-2 py-3 text-center font-medium">1º Bim.</th>
                <th className="px-2 py-3 text-center font-medium">2º Bim.</th>
                <th className="px-2 py-3 text-center font-medium">3º Bim.</th>
                <th className="px-2 py-3 text-center font-medium">4º Bim.</th>
                <th className="py-3 pl-3 text-center font-medium">Média</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {linhas.map((linha) => (
                <tr key={linha.disciplinaId}>
                  <td className="py-3 pr-3 font-medium text-foreground">
                    {linha.disciplinaNome}
                  </td>
                  {linha.notas.map((nota, index) => (
                    <td
                      key={index}
                      className="px-2 py-3 text-center text-muted-foreground"
                    >
                      {nota === null ? "—" : nota.toFixed(1)}
                    </td>
                  ))}
                  <td className="py-3 pl-3 text-center font-semibold text-foreground">
                    {linha.media === null ? "—" : linha.media.toFixed(1)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
