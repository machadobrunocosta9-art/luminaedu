import AppLayout from "@/components/layout/AppLayout";
import DashboardHeader from "@/components/dashboard/DashboardHeader";
import DashboardStats, {
  DashboardStat,
} from "@/components/dashboard/DashboardStats";

const stats: DashboardStat[] = [
  {
    title: "Presença hoje",
    value: "112",
    description: "de 128 alunos presentes",
    action: "Ver detalhes",
  },
  {
    title: "Comunicados",
    value: "2",
    description: "pendentes de envio",
    action: "Revisar",
  },
  {
    title: "Documentos",
    value: "5",
    description: "alunos com pendências",
    action: "Resolver",
  },
  {
    title: "Financeiro",
    value: "8",
    description: "mensalidades em aberto",
    action: "Acompanhar",
  },
];

export default function DashboardPage() {
  return (
    <AppLayout>
      <DashboardHeader
        badge="Centro de Operações"
        title="Bom dia, Bruno"
        subtitle="Veja com clareza o que precisa da sua atenção hoje."
      />

      <DashboardStats stats={stats} />
    </AppLayout>
  );
}