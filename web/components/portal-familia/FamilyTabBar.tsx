"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, MessageCircle, MessagesSquare, User } from "lucide-react";

const TABS = [
  { href: "/portal-familia", label: "Início", icon: Home, exact: true },
  {
    href: "/portal-familia/comunicados",
    label: "Comunicados",
    icon: MessageCircle,
    badgeKey: "comunicados" as const,
  },
  {
    href: "/portal-familia/mensagens",
    label: "Mensagens",
    icon: MessagesSquare,
    badgeKey: "mensagens" as const,
  },
  { href: "/portal-familia/perfil", label: "Perfil", icon: User },
];

export default function FamilyTabBar({
  comunicadosBadge = 0,
  mensagensBadge = 0,
}: {
  comunicadosBadge?: number;
  mensagensBadge?: number;
}) {
  const pathname = usePathname();

  const badges: Record<string, number> = {
    comunicados: comunicadosBadge,
    mensagens: mensagensBadge,
  };

  return (
    <nav
      className="fixed inset-x-0 bottom-0 z-40 border-t border-black/5 bg-white/85 pb-[env(safe-area-inset-bottom)] backdrop-blur-xl"
      style={{ boxShadow: "0 -1px 20px rgba(0,0,0,0.04)" }}
    >
      <div className="mx-auto flex max-w-md items-stretch justify-around">
        {TABS.map((tab) => {
          const Icon = tab.icon;
          const active = tab.exact
            ? pathname === tab.href
            : pathname === tab.href || pathname.startsWith(`${tab.href}/`);
          const badge = tab.badgeKey ? badges[tab.badgeKey] : 0;

          return (
            <Link
              key={tab.href}
              href={tab.href}
              className="flex min-w-0 flex-1 flex-col items-center gap-1 px-2 py-2.5 pt-3"
            >
              <span className="relative flex h-7 w-7 items-center justify-center">
                <Icon
                  size={24}
                  strokeWidth={active ? 2.3 : 1.8}
                  className={active ? "text-primary" : "text-[#8e8e93]"}
                />
                {badge > 0 && (
                  <span className="absolute -right-2 -top-1.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold leading-none text-white">
                    {badge > 9 ? "9+" : badge}
                  </span>
                )}
              </span>
              <span
                className={`text-[11px] font-medium ${
                  active ? "text-primary" : "text-[#8e8e93]"
                }`}
              >
                {tab.label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
