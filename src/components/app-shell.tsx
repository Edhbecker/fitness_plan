"use client";

import Link from "next/link";
import { signOut } from "next-auth/react";
import { usePathname } from "next/navigation";
import {
  Activity,
  BookOpen,
  ChevronDown,
  LayoutDashboard,
  LogOut,
  UserRound,
  Users,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";

const nav = [
  { href: "/", label: "Visao geral", icon: LayoutDashboard },
  { href: "/alunos", label: "Alunos", icon: Users },
  { href: "/exercicios", label: "Exercicios", icon: BookOpen },
];

export function AppShell({ children, userName, userRole }: { children: React.ReactNode; userName: string; userRole: string }) {
  const pathname = usePathname();
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);
  const profileMenuRef = useRef<HTMLDivElement>(null);
  const initials = userName.split(/\s+/).slice(0, 2).map((part) => part[0]).join("").toUpperCase();

  useEffect(() => {
    function closeOnOutsideClick(event: MouseEvent) {
      if (!profileMenuRef.current?.contains(event.target as Node)) setProfileMenuOpen(false);
    }

    function closeOnEscape(event: KeyboardEvent) {
      if (event.key === "Escape") setProfileMenuOpen(false);
    }

    document.addEventListener("mousedown", closeOnOutsideClick);
    document.addEventListener("keydown", closeOnEscape);
    return () => {
      document.removeEventListener("mousedown", closeOnOutsideClick);
      document.removeEventListener("keydown", closeOnEscape);
    };
  }, []);

  return (
    <div className="min-h-screen lg:grid lg:grid-cols-[248px_1fr]">
      <aside className="hidden w-[248px] flex-col bg-primary-dark px-4 py-5 text-white lg:sticky lg:top-0 lg:flex lg:h-screen">
        <Link href="/" className="mb-8 flex items-center gap-3 px-2">
          <span className="flex size-10 items-center justify-center rounded-xl bg-accent text-primary-dark">
            <Activity size={22} strokeWidth={2.7} />
          </span>
          <span>
            <strong className="block text-xl leading-none">Pulso</strong>
            <span className="text-[10px] uppercase tracking-[0.22em] text-white/50">
              Training manager
            </span>
          </span>
        </Link>

        <p className="mb-2 px-3 text-[10px] font-bold uppercase tracking-[0.2em] text-white/35">
          Gestao
        </p>
        <nav className="space-y-1">
          {nav.map((item) => {
            const active = item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-semibold ${
                  active ? "bg-white/12 text-white" : "text-white/60 hover:bg-white/7 hover:text-white"
                }`}
              >
                <Icon size={18} />
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="mt-auto rounded-2xl border border-white/10 bg-white/6 p-4">
          <p className="text-xs font-bold text-white/80">Uso profissional</p>
          <p className="mt-1 text-[11px] leading-5 text-white/45">
            Dados e calculos apoiam a analise do profissional habilitado.
          </p>
        </div>
        <button
          type="button"
          onClick={() => signOut({ callbackUrl: "/login" })}
          className="mt-3 flex items-center gap-3 rounded-xl px-3 py-3 text-sm text-white/55 hover:bg-white/7 hover:text-white"
        >
          <LogOut size={17} />
          Sair
        </button>
      </aside>

      <div className="min-w-0">
        <header className="sticky top-0 z-30 flex h-18 items-center gap-3 border-b border-line bg-white/90 px-4 backdrop-blur md:px-8">
          <div className="ml-auto flex items-center gap-3">
            <div className="hidden text-right sm:block">
              <p className="text-xs font-bold">{userName}</p>
              <p className="text-[11px] text-muted">{userRole}</p>
            </div>
            <div ref={profileMenuRef} className="relative">
              <button
                type="button"
                onClick={() => setProfileMenuOpen((value) => !value)}
                className="flex items-center gap-2 rounded-xl border border-line bg-white p-1.5 shadow-sm hover:border-[#9bc1ba] hover:bg-[#f5faf8]"
                aria-haspopup="menu"
                aria-expanded={profileMenuOpen}
                aria-label="Abrir menu do perfil"
              >
                <span className="flex size-8 items-center justify-center rounded-lg bg-primary text-xs font-bold text-white">
                  {initials}
                </span>
                <ChevronDown className={`hidden text-muted transition sm:block ${profileMenuOpen ? "rotate-180" : ""}`} size={15} />
              </button>

              {profileMenuOpen && (
                <div className="absolute right-0 top-12 z-50 w-64 overflow-hidden rounded-2xl border border-line bg-white shadow-[0_18px_45px_rgba(15,76,69,0.14)]" role="menu">
                  <div className="border-b border-line bg-[#f8faf9] px-4 py-3">
                    <p className="text-sm font-bold">{userName}</p>
                    <p className="mt-0.5 text-[11px] text-muted">{userRole}</p>
                  </div>
                  <Link
                    href="/perfil"
                    onClick={() => setProfileMenuOpen(false)}
                    className="flex items-center gap-3 px-4 py-3 text-sm font-semibold text-foreground hover:bg-[#f4f7f5]"
                    role="menuitem"
                  >
                    <UserRound size={17} />
                    Meu perfil e senha
                  </Link>
                  <button
                    type="button"
                    onClick={() => signOut({ callbackUrl: "/login" })}
                    className="flex w-full items-center gap-3 px-4 py-3 text-left text-sm font-semibold text-red-600 hover:bg-red-50"
                    role="menuitem"
                  >
                    <LogOut size={17} />
                    Sair
                  </button>
                </div>
              )}
            </div>
          </div>
        </header>
        <main className="mx-auto max-w-[1500px] p-4 md:p-8">{children}</main>
      </div>
    </div>
  );
}
