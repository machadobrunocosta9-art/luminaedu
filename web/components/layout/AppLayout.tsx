"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ReactNode, useEffect, useState } from "react";
import {
  ArrowRight,
  BarChart3,
  Bell,
  BookOpen,
  CalendarDays,
  CheckCircle2,
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
  X,
} from "lucide-react";

type AppLayoutProps = {
  children: ReactNode;
};

type LumiResumo = {
  tarefasAbertas: number;
  tarefasPrioritarias: number;
  matriculasPendentes: number;
  comunicadosPendentes: number;
  comunicadosVisualizados: number;
  pendenciasFinanceiras: number;
  pendenciasDocumentais: number;
  ocorrenciasRecentes: number;
  totalAlunos: number;
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
    href: "/lumi",
    icon: Sparkles,
  },
  {
    label: "Configurações",
    href: "/configuracoes",
    icon: Settings,
  },
];

const lumiActions = [
  {
    title: "Abrir Central da Lumi",
    description: "Ver resumo completo, prioridades e sugestões da escola.",
    href: "/lumi",
    icon: Sparkles,
  },
  {
    title: "Ver tarefas abertas",
    description: "Acompanhar pendências e responsáveis no Pulse.",
    href: "/pulse",
    icon: CalendarDays,
  },
  {
    title: "Acompanhar matrículas",
    description: "Ver processos em andamento e próximos passos.",
    href: "/matriculas",
    icon: ClipboardList,
  },
  {
    title: "Comunicação",
    description: "Ver comunicados, respostas e pendências da família.",
    href: "/comunicacao",
    icon: MessageCircle,
  },
  {
    title: "Financeiro",
    description: "Ver cobranças, pendências e situação financeira.",
    href: "/financeiro",
    icon: CreditCard,
  },
];

export default function AppLayout({ children }: AppLayoutProps) {
  const pathname = usePathname();

  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [lumiOpen, setLumiOpen] = useState(false);
  const [lumiResumo, setLumiResumo] = useState<LumiResumo | null>(null);
  const [lumiLoading, setLumiLoading] = useState(false);
  const [lumiErro, setLumiErro] = useState(false);

  const esconderBuscaTopo = pathname === "/alunos";

  useEffect(() => {
    if (!lumiOpen || lumiResumo) return;

    let ativo = true;

    async function carregarResumo() {
      try {
        setLumiLoading(true);
        setLumiErro(false);

        const response = await fetch("/api/lumi/resumo", {
          cache: "no-store",
        });

        if (!response.ok) {
          throw new Error("Erro ao carregar resumo da Lumi.");
        }

        const data = (await response.json()) as LumiResumo;

        if (ativo) {
          setLumiResumo(data);
        }
      } catch {
        if (ativo) {
          setLumiErro(true);
        }
      } finally {
        if (ativo) {
          setLumiLoading(false);
        }
      }
    }

    carregarResumo();

    return () => {
      ativo = false;
    };
  }, [lumiOpen, lumiResumo]);

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

              {!esconderBuscaTopo && (
                <div className="hidden h-11 min-w-[320px] items-center gap-3 rounded-2xl border border-border bg-card px-4 shadow-sm md:flex">
                  <Search size={18} className="text-muted-foreground" />
                  <input
                    placeholder="Buscar aluno, responsável, turma..."
                    className="w-full bg-transparent text-sm outline-none placeholder:text-muted-foreground"
                  />
                </div>
              )}
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

      {lumiOpen && (
        <button
          type="button"
          aria-label="Fechar painel da Lumi"
          onClick={() => setLumiOpen(false)}
          className="fixed inset-0 z-50 bg-background/60 backdrop-blur-sm"
        />
      )}

      <aside
        className={`fixed right-0 top-0 z-[60] h-screen w-full max-w-md border-l border-border bg-card shadow-2xl transition-transform duration-300 ${
          lumiOpen ? "translate-x-0" : "translate-x-full"
        }`}
      >
        <div className="flex h-full flex-col">
          <div className="border-b border-border p-6">
            <div className="mb-6 flex items-start justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-3xl bg-primary text-primary-foreground shadow-sm">
                  <Sparkles size={22} />
                </div>

                <div>
                  <p className="text-lg font-semibold text-foreground">Lumi</p>
                  <p className="text-sm text-muted-foreground">
                    Assistente da gestão escolar
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setLumiOpen(false)}
                className="flex h-10 w-10 items-center justify-center rounded-2xl border border-border bg-background text-muted-foreground transition hover:bg-muted hover:text-foreground"
                aria-label="Fechar Lumi"
              >
                <X size={18} />
              </button>
            </div>

            <div className="rounded-3xl bg-primary/10 p-5">
              <p className="mb-2 inline-flex rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
                Resolver meu dia
              </p>

              <h2 className="text-xl font-semibold text-foreground">
                Posso te ajudar a organizar as prioridades da escola.
              </h2>

              <p className="mt-3 text-sm leading-6 text-muted-foreground">
                Agora eu já leio alguns dados reais da Lumina para destacar
                tarefas, comunicados, matrículas e pendências.
              </p>
            </div>
          </div>

          <div className="flex-1 space-y-4 overflow-y-auto p-6">
            <section className="rounded-3xl border border-border bg-background p-5">
              <div className="mb-4 flex items-center gap-3">
                <CheckCircle2 size={20} className="text-primary" />

                <div>
                  <h3 className="font-semibold text-foreground">
                    Leitura rápida
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    O que merece atenção agora
                  </p>
                </div>
              </div>

              {lumiLoading ? (
                <p className="text-sm text-muted-foreground">
                  Carregando dados da escola...
                </p>
              ) : lumiErro ? (
                <p className="text-sm leading-6 text-muted-foreground">
                  Não consegui carregar os dados agora. Tente abrir a Lumi
                  novamente em instantes.
                </p>
              ) : lumiResumo ? (
                <>
                  <div className="mb-5 grid grid-cols-2 gap-3">
                    <div className="rounded-2xl bg-muted p-4">
                      <p className="text-xs text-muted-foreground">
                        Tarefas abertas
                      </p>
                      <p className="mt-1 text-2xl font-semibold text-foreground">
                        {lumiResumo.tarefasAbertas}
                      </p>
                    </div>

                    <div className="rounded-2xl bg-muted p-4">
                      <p className="text-xs text-muted-foreground">
                        Comunicados pendentes
                      </p>
                      <p className="mt-1 text-2xl font-semibold text-foreground">
                        {lumiResumo.comunicadosPendentes}
                      </p>
                    </div>

                    <div className="rounded-2xl bg-muted p-4">
                      <p className="text-xs text-muted-foreground">
                        Matrículas pendentes
                      </p>
                      <p className="mt-1 text-2xl font-semibold text-foreground">
                        {lumiResumo.matriculasPendentes}
                      </p>
                    </div>

                    <div className="rounded-2xl bg-muted p-4">
                      <p className="text-xs text-muted-foreground">
                        Financeiro
                      </p>
                      <p className="mt-1 text-2xl font-semibold text-foreground">
                        {lumiResumo.pendenciasFinanceiras}
                      </p>
                    </div>
                  </div>

                  <div className="space-y-3 text-sm leading-6 text-muted-foreground">
                    <p>
                      • Existem{" "}
                      <strong className="text-foreground">
                        {lumiResumo.tarefasAbertas}
                      </strong>{" "}
                      tarefa(s) abertas no Pulse.
                    </p>

                    <p>
                      •{" "}
                      <strong className="text-foreground">
                        {lumiResumo.comunicadosPendentes}
                      </strong>{" "}
                      comunicado(s) ainda aguardam resposta da família.
                    </p>

                    <p>
                      •{" "}
                      <strong className="text-foreground">
                        {lumiResumo.matriculasPendentes}
                      </strong>{" "}
                      matrícula(s) precisam de acompanhamento.
                    </p>

                    <p>
                      • Foram identificadas{" "}
                      <strong className="text-foreground">
                        {lumiResumo.ocorrenciasRecentes}
                      </strong>{" "}
                      advertência(s) ou suspensão(ões) nos últimos 90 dias.
                    </p>
                  </div>
                </>
              ) : (
                <p className="text-sm text-muted-foreground">
                  Abra a Lumi para carregar o resumo da escola.
                </p>
              )}
            </section>

            <section>
              <h3 className="mb-3 font-semibold text-foreground">
                Ações recomendadas
              </h3>

              <div className="space-y-3">
                {lumiActions.map((action) => {
                  const Icon = action.icon;

                  return (
                    <Link
                      key={action.title}
                      href={action.href}
                      onClick={() => setLumiOpen(false)}
                      className="group flex items-center justify-between gap-4 rounded-3xl border border-border bg-background p-4 transition hover:-translate-y-0.5 hover:bg-muted hover:shadow-sm"
                    >
                      <div className="flex min-w-0 items-center gap-3">
                        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                          <Icon size={20} />
                        </div>

                        <div className="min-w-0">
                          <p className="font-semibold text-foreground">
                            {action.title}
                          </p>
                          <p className="mt-1 text-sm leading-5 text-muted-foreground">
                            {action.description}
                          </p>
                        </div>
                      </div>

                      <ArrowRight
                        size={18}
                        className="shrink-0 text-muted-foreground transition group-hover:translate-x-0.5 group-hover:text-primary"
                      />
                    </Link>
                  );
                })}
              </div>
            </section>
          </div>

          <div className="border-t border-border p-6">
            <p className="text-xs leading-5 text-muted-foreground">
              Esta é a primeira versão da Lumi com dados reais. Depois, ela vai
              sugerir ações automaticamente com base no comportamento da escola.
            </p>
          </div>
        </div>
      </aside>

      <button
        type="button"
        onClick={() => setLumiOpen(true)}
        className="fixed bottom-6 right-6 z-40 flex items-center gap-3 rounded-full bg-primary px-5 py-4 text-sm font-semibold text-primary-foreground shadow-lg shadow-primary/20 transition hover:-translate-y-0.5 hover:opacity-95"
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