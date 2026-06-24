"use client";

import Link from "next/link";
import { signOut } from "next-auth/react";
import { usePathname } from "next/navigation";
import {
  Activity,
  BookOpen,
  LayoutDashboard,
  LogOut,
  Menu,
  Users,
} from "lucide-react";
import { useState } from "react";

const nav = [
  { href: "/", label: "Visão geral", icon: LayoutDashboard },
  { href: "/alunos", label: "Alunos", icon: Users },
  { href: "/exercicios", label: "Exercícios", icon: BookOpen },
];

export function AppShell({ children, userName, userRole }: { children: React.ReactNode; userName: string; userRole: string }) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const initials = userName.split(/\s+/).slice(0, 2).map((part) => part[0]).join("").toUpperCase();

  return (
    <div className="min-h-screen lg:grid lg:grid-cols-[248px_1fr]">
      <aside
        className={`${open ? "fixed inset-y-0 left-0 z-50 flex" : "hidden"} w-[248px] flex-col bg-primary-dark px-4 py-5 text-white lg:sticky lg:top-0 lg:flex lg:h-screen`}
      >
        <Link href="/" className="mb-8 flex items-center gap-3 px-2" onClick={() => setOpen(false)}>
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
          Gestão
        </p>
        <nav className="space-y-1">
          {nav.map((item) => {
            const active = item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setOpen(false)}
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
            Dados e cálculos apoiam a análise do profissional habilitado.
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

      {open && <button className="fixed inset-0 z-40 bg-black/35 lg:hidden" onClick={() => setOpen(false)} />}

      <div className="min-w-0">
        <header className="sticky top-0 z-30 flex h-18 items-center gap-3 border-b border-line bg-white/90 px-4 backdrop-blur md:px-8">
          <button className="btn-secondary px-3 lg:hidden" onClick={() => setOpen(true)} aria-label="Abrir menu">
            <Menu size={18} />
          </button>
          <div className="ml-auto flex items-center gap-3">
            <div className="hidden text-right sm:block">
              <p className="text-xs font-bold">{userName}</p>
              <p className="text-[11px] text-muted">{userRole}</p>
            </div>
            <div className="flex items-center rounded-xl border border-line bg-white p-1.5">
              <span className="flex size-8 items-center justify-center rounded-lg bg-primary text-xs font-bold text-white">
                {initials}
              </span>
            </div>
          </div>
        </header>
        <main className="mx-auto max-w-[1500px] p-4 md:p-8">{children}</main>
      </div>
    </div>
  );
}
