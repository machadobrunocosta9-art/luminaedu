import AppLayout from "@/components/layout/AppLayout";
import DashboardHero from "@/components/dashboard/DashboardHero";
import DashboardStats, {
  DashboardStat,
} from "@/components/dashboard/DashboardStats";
import AgendaCard from "@/components/dashboard/AgendaCard";
import PulsePanel from "@/components/dashboard/PulsePanel";
import RecentActivity from "@/components/dashboard/RecentActivity";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

async function getDashboardData() {
  const [
    alunos,
    tarefasAbertas,
    matriculasEmAndamento,
    pendenciasFinanceiras,
    tarefas,
  ] = await Promise.all([
    prisma.aluno.count(),

    prisma.tarefa.count({
      where: {
        status: {
          not: "CONCLUIDA",
        },
      },
    }),

    prisma.matricula.count({
      where: {
        status: {
          not: "CONCLUIDA",
        },
      },
    }),

    prisma.tarefa.count({
      where: {
        setor: "Financeiro",
        status: {
          not: "CONCLUIDA",
        },
      },
    }),

    prisma.tarefa.findMany({
      where: {
        status: {
          not: "CONCLUIDA",
        },
      },
      orderBy: {
        criadoEm: "desc",
      },
      take: 5,
      select: {
        id: true,
        titulo: true,
        descricao: true,
        setor: true,
        prioridade: true,
        status: true,
      },
    }),
  ]);

  const stats: DashboardStat[] = [
    {
      title: "Alunos",
      value: String(alunos),
      description: "cadastrados na escola",
      action: "Ver alunos",
    },
    {
      title: "Matrículas",
      value: String(matriculasEmAndamento),
      description: "processos em andamento",
      action: "Acompanhar",
    },
    {
      title: "Pulse",
      value: String(tarefasAbertas),
      description: "tarefas abertas",
      action: "Ver tarefas",
    },
    {
      title: "Financeiro",
      value: String(pendenciasFinanceiras),
      description: "pendências financeiras",
      action: "Resolver",
    },
  ];

  return {
    alunos,
    tarefasAbertas,
    matriculasEmAndamento,
    pendenciasFinanceiras,
    tarefas,
    stats,
  };
}

export default async function DashboardPage() {
  const data = await getDashboardData();

  return (
    <AppLayout>
      <DashboardHero
        alunos={data.alunos}
        prioridades={data.tarefasAbertas}
        matriculas={data.matriculasEmAndamento}
        pendenciasFinanceiras={data.pendenciasFinanceiras}
      />

      <DashboardStats stats={data.stats} />

      <div className="mt-8 grid grid-cols-1 items-stretch gap-6 xl:grid-cols-[1.4fr_1fr]">
        <PulsePanel tarefas={data.tarefas} />
        <AgendaCard />
      </div>

      <RecentActivity />
    </AppLayout>
  );
}