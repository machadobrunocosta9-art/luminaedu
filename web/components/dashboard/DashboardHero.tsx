import LuminaCard from "@/components/ui/LuminaCard";
import LuminaButton from "@/components/ui/LuminaButton";

type DashboardHeroProps = {
  alunos: number;
  prioridades: number;
  matriculas: number;
  pendenciasFinanceiras: number;
};

export default function DashboardHero({
  prioridades,
  matriculas,
  pendenciasFinanceiras,
}: DashboardHeroProps) {
  return (
    <section className="mb-8">
      <div className="mb-6">
        <p className="text-sm font-medium text-muted-foreground">
          Centro de Comando
        </p>

        <h1 className="mt-2 text-4xl font-semibold tracking-tight text-foreground">
          Bom dia, Bruno.
        </h1>

        <p className="mt-3 max-w-3xl text-base leading-7 text-muted-foreground">
          Sua escola está pronta para começar o dia. Acompanhe prioridades,
          pendências e ações importantes em um só lugar.
        </p>
      </div>

      <LuminaCard className="border-primary/10 bg-gradient-to-br from-primary/10 via-card to-card">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <div className="mb-3 inline-flex rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
              Lumi
            </div>

            <h2 className="text-xl font-semibold text-foreground">
              Encontrei pontos importantes para acompanhar hoje.
            </h2>

            <p className="mt-2 max-w-3xl text-sm leading-6 text-muted-foreground">
              Há {prioridades} tarefas abertas, {matriculas} matrícula em
              andamento e {pendenciasFinanceiras} pendência financeira que
              merece atenção. Esses dados já estão vindo do banco da Lumina.
            </p>
          </div>

          <LuminaButton variant="primary">Ver recomendações</LuminaButton>
        </div>
      </LuminaCard>
    </section>
  );
}