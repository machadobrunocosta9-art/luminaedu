"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BarChart3,
  BookOpen,
  CreditCard,
  FileText,
  GraduationCap,
  HeartPulse,
  LayoutDashboard,
  Send,
  Settings,
  UserRound,
  UsersRound,
} from "lucide-react";

const groups = [
  {
    title: "Principal",
    items: [
      {
        label: "Dashboard",
        href: "/dashboard",
        icon: LayoutDashboard,
      },
      {
        label: "Matrículas",
        href: "/matriculas",
        icon: GraduationCap,
      },
      {
        label: "Alunos",
        href: "/alunos",
        icon: UserRound,
      },
      {
        label: "Responsáveis",
        href: "/responsaveis",
        icon: UsersRound,
      },
      {
        label: "Turmas",
        href: "/turmas",
        icon: BookOpen,
      },
    ],
  },
  {
    title: "Operação",
    items: [
      {
        label: "Pulse",
        href: "/pulse",
        icon: HeartPulse,
      },
      {
        label: "Acadêmico",
        href: "/academico",
        icon: BookOpen,
      },
      {
        label: "Financeiro",
        href: "/financeiro",
        icon: CreditCard,
      },
      {
        label: "Comunicação",
        href: "/comunicacao",
        icon: Send,
      },
      {
        label: "Documentos",
        href: "/documentos",
        icon: FileText,
      },
      {
        label: "Relatórios",
        href: "/relatorios",
        icon: BarChart3,
      },
    ],
  },
];

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="sticky top-0 flex h-screen w-[280px] shrink-0 flex-col border-r border-sidebar-border bg-sidebar px-5 py-6 text-sidebar-foreground">
      <div className="mb-8 flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-white/10 text-sm font-semibold text-white ring-1 ring-white/10">
          L
        </div>

        <div>
          <div className="text-lg font-semibold tracking-tight text-white">
            Lumina
          </div>

          <div className="mt-0.5 text-xs text-white/45">
            Gestão escolar premium
          </div>
        </div>
      </div>

      <nav className="flex-1 space-y-6">
        {groups.map((group) => (
          <div key={group.title}>
            <p className="mb-2 px-3 text-[11px] font-semibold uppercase tracking-[0.18em] text-white/30">
              {group.title}
            </p>

            <div className="space-y-1">
              {group.items.map((item) => {
                const Icon = item.icon;

                const active =
                  item.href !== "#" &&
                  (pathname === item.href ||
                    pathname.startsWith(`${item.href}/`));

                return (
                  <Link
                    key={item.label}
                    href={item.href}
                    className={[
                      "flex items-center gap-3 rounded-2xl px-3 py-2.5 text-sm font-medium transition",
                      active
                        ? "bg-white/12 text-white shadow-sm ring-1 ring-white/10"
                        : "text-white/58 hover:bg-white/[0.07] hover:text-white",
                    ].join(" ")}
                  >
                    <Icon size={18} />
                    <span>{item.label}</span>
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      <div className="mt-6 border-t border-white/10 pt-4">
        <Link
          href="/configuracoes"
          className={[
            "flex items-center gap-3 rounded-2xl px-3 py-2.5 text-sm font-medium transition",
            pathname === "/configuracoes" ||
            pathname.startsWith("/configuracoes/")
              ? "bg-white/12 text-white shadow-sm ring-1 ring-white/10"
              : "text-white/58 hover:bg-white/[0.07] hover:text-white",
          ].join(" ")}
        >
          <Settings size={18} />
          <span>Configurações</span>
        </Link>
      </div>
    </aside>
  );
}

