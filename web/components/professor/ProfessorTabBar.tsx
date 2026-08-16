"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { GraduationCap, User } from "lucide-react";

const TABS = [
  { href: "/professor", label: "Turmas", icon: GraduationCap, exact: true },
  { href: "/perfil", label: "Perfil", icon: User },
];

export default function ProfessorTabBar() {
  const pathname = usePathname();

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

          return (
            <Link
              key={tab.href}
              href={tab.href}
              className="flex min-w-0 flex-1 flex-col items-center gap-1 px-2 py-2.5 pt-3"
            >
              <Icon
                size={24}
                strokeWidth={active ? 2.3 : 1.8}
                className={active ? "text-primary" : "text-[#8e8e93]"}
              />
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
