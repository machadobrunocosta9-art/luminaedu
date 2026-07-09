"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ReactNode, useState } from "react";
import {
  BarChart3,
  Bell,
  BookOpen,
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  ClipboardList,
  CreditCard,
  FileText,
  GraduationCap,
  Home,
  Menu,
  MessageCircle,
  Search,
  Settings,
  Sparkles,
  UsersRound,
} from "lucide-react";

type AppLayoutProps = {
  children: ReactNode;
};

const menuItems = [
  {
    label: "Hoje",
    href: "/dashboard",
    icon: Home,
  },
  {
    label: "Alunos",
    href: "/alunos",
    icon: GraduationCap,
  },
  {
    label: "Turmas",
    href: "/turmas",
    icon: UsersRound,
  },
  {
    label: "Matrículas",
    href: "/matriculas",
    icon: ClipboardList,
  },
  {
    label: "Comunicação",
    href: "/comunicacao",
    icon: MessageCircle,
  },
  {
    label: "Financeiro",
    href: "/financeiro",
    icon: CreditCard,
  },
  {
    label: "Documentos",
    href: "/documentos",
    icon: FileText,
  },
  {
    label: "Acadêmico",
    href: "/academico",
    icon: BookOpen,
  },
  {
    label: "Pulse",
    href: "/pulse",
    icon: CalendarDays,
  },
  {
    label: "Relatórios",
    href: "/relatorios",
    icon: BarChart3,
  },
  {
    label: "Lumi IA",
    href: "/relatorios",
    icon: Sparkles,
  },
  {
    label: "Configurações",
    href: "/configuracoes",
    icon: Settings,
  },
];

export default function AppLayout({ children }: AppLayoutProps) {
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(true);

  return (
    <div className="min-h-screen bg-muted/30 text-foreground">
      <aside
        className={`fixed left-0 top-0 z-40 hidden h-screen overflow-visible border-r border-border bg-card shadow-sm transition-all duration-300 lg:flex lg:flex-col ${
          sidebarOpen ? "w-72" : "w-24"
        }`}
      >
        <div className="flex h-24 items-center px-5">
          <Link
            href="/dashboard"
            className={`flex items-center ${
              sidebarOpen ? "gap-3" : "w-full justify-center"
            }`}
          >
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-3xl bg-primary text-xl font-bold text-primary-foreground shadow-sm">
              L
            </div>

            {sidebarOpen && (
              <div className="min-w-0">
                <p className="text-lg font-semibold tracking-tight text-foreground">
                  Lumina
                </p>
                <p className="truncate text-xs text-muted-foreground">
                  Jardim Escola Girassol Encantado
                </p>
              </div>
            )}
          </Link>
        </div>

        <button
          type="button"
          onClick={() => setSidebarOpen((value) => !value)}
          className="absolute -right-[15px] top-[86px] z-50 flex h-10 w-8 items-center justify-center rounded-full border border-border bg-background text-primary shadow-md transition hover:bg-primary/10"
          aria-label={sidebarOpen ? "Fechar menu" : "Abrir menu"}
        >
          {sidebarOpen ? <ChevronLeft size={17} /> : <ChevronRight size={17} />}
        </button>

        <nav className="space-y-1 px-4 pt-4">
          {menuItems.map((item) => {
            const Icon = item.icon;

            const active =
              pathname === item.href ||
              (item.href !== "/dashboard" && pathname.startsWith(item.href));

            return (
              <Link
                key={item.label}
                href={item.href}
                title={!sidebarOpen ? item.label : undefined}
                className={`group flex h-11 items-center rounded-2xl text-sm font-medium transition ${
                  sidebarOpen ? "justify-start gap-3 px-4" : "justify-center"
                } ${
                  active
                    ? "bg-primary/10 text-primary"
                    : "text-muted-foreground hover:bg-primary/5 hover:text-primary"
                }`}
              >
                <Icon size={20} className="shrink-0" />

                {sidebarOpen && <span>{item.label}</span>}
              </Link>
            );
          })}
        </nav>

        <div className="flex-1" />
      </aside>

      <div
        className={`min-h-screen transition-all duration-300 ${
          sidebarOpen ? "lg:pl-72" : "lg:pl-24"
        }`}
      >
        <header className="sticky top-0 z-30 border-b border-border bg-muted/40 backdrop-blur">
          <div className="flex h-20 items-center justify-between gap-4 px-5 lg:px-8">
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setSidebarOpen((value) => !value)}
                className="flex h-11 w-11 items-center justify-center rounded-2xl border border-border bg-card text-primary shadow-sm transition hover:bg-primary/10 lg:hidden"
                aria-label="Abrir menu"
              >
                <Menu size={20} />
              </button>

              <div className="hidden h-11 min-w-[320px] items-center gap-3 rounded-2xl border border-border bg-card px-4 shadow-sm md:flex">
                <Search size={18} className="text-muted-foreground" />
                <input
                  placeholder="Buscar aluno, responsável, turma..."
                  className="w-full bg-transparent text-sm outline-none placeholder:text-muted-foreground"
                />
              </div>
            </div>

            <div className="flex items-center gap-3">
              <button className="relative flex h-11 w-11 items-center justify-center rounded-2xl border border-border bg-card text-foreground shadow-sm transition hover:bg-primary/5">
                <Bell size={19} />
                <span className="absolute right-2 top-2 h-2.5 w-2.5 rounded-full bg-primary" />
              </button>

              <div className="hidden items-center gap-3 rounded-3xl border border-border bg-card px-4 py-2 shadow-sm sm:flex">
                <div className="flex h-9 w-9 items-center justify-center rounded-2xl bg-primary text-sm font-bold text-primary-foreground">
                  B
                </div>

                <div>
                  <p className="text-sm font-semibold text-foreground">
                    Bruno Machado
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Administrador
                  </p>
                </div>
              </div>
            </div>
          </div>
        </header>

        <main className="min-h-[calc(100vh-5rem)] bg-muted/30 px-5 py-8 lg:px-8">
          {children}
        </main>
      </div>

      <button
        type="button"
        className="fixed bottom-6 right-6 z-50 flex items-center gap-3 rounded-full bg-primary px-5 py-4 text-sm font-semibold text-primary-foreground shadow-lg shadow-primary/20 transition hover:-translate-y-0.5 hover:opacity-95"
        aria-label="Abrir Lumi"
      >
        <span className="flex h-9 w-9 items-center justify-center rounded-full bg-primary-foreground/15">
          <Sparkles size={19} />
        </span>
        <span>Lumi</span>
      </button>
    </div>
  );
}