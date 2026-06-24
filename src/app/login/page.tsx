import { Activity, LockKeyhole } from "lucide-react";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { LoginForm } from "@/components/login-form";

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ callbackUrl?: string }> }) {
  if (await auth()) redirect("/");
  const requestedUrl = (await searchParams).callbackUrl;
  const callbackUrl = requestedUrl?.startsWith("/") && !requestedUrl.startsWith("//") ? requestedUrl : "/";
  return (
    <main className="grid min-h-screen bg-white lg:grid-cols-[1.05fr_0.95fr]">
      <section className="hidden bg-[linear-gradient(145deg,#0a3732,#0f5a51)] p-12 text-white lg:flex lg:flex-col">
        <div className="flex items-center gap-3"><span className="flex size-11 items-center justify-center rounded-xl bg-accent text-primary-dark"><Activity size={23} /></span><strong className="text-2xl">Pulso</strong></div>
        <div className="my-auto max-w-lg"><p className="text-xs font-bold uppercase tracking-[0.22em] text-accent">Gestão de treinamento</p><h1 className="mt-5 text-5xl font-bold leading-[1.1] tracking-tight">Acompanhe cada evolução com contexto.</h1><p className="mt-5 text-base leading-7 text-white/55">Alunos, avaliações, periodizações e execuções reais em um único fluxo profissional.</p></div>
        <p className="text-xs text-white/35">Dados protegidos e organizados para análise do profissional habilitado.</p>
      </section>
      <section className="flex items-center justify-center bg-background p-5 py-10">
        <div className="card w-full max-w-md p-6 md:p-8">
          <div className="mb-7 flex size-12 items-center justify-center rounded-2xl bg-[#e7f3ef] text-primary"><LockKeyhole size={22} /></div>
          <h2 className="text-2xl font-bold">Acesse o Pulso</h2>
          <p className="mt-2 text-sm text-muted">Entre na sua conta ou cadastre-se como profissional.</p>
          <LoginForm callbackUrl={callbackUrl} />
          <p className="mt-5 text-center text-[11px] leading-5 text-muted">Senhas são protegidas e cada profissional acessa somente seus próprios dados.</p>
        </div>
      </section>
    </main>
  );
}
