"use client";

import { ArrowRight, LoaderCircle, UserPlus } from "lucide-react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";
import { registerTrainerAction } from "@/app/actions/auth";

export function LoginForm({ callbackUrl = "/" }: { callbackUrl?: string }) {
  const router = useRouter();
  const [mode, setMode] = useState<"login" | "register">("login");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError("");
    const data = new FormData(event.currentTarget);
    const email = String(data.get("email") ?? "").trim().toLowerCase();
    const password = String(data.get("password") ?? "");

    if (mode === "register") {
      const registration = await registerTrainerAction({
        name: String(data.get("name") ?? ""),
        email,
        password,
        passwordConfirmation: String(data.get("passwordConfirmation") ?? ""),
        acceptedTerms: data.get("acceptedTerms") === "on",
      });
      if (!registration.success) {
        setLoading(false);
        setError(registration.message);
        return;
      }
    }

    const result = await signIn("credentials", { email, password, redirect: false });
    setLoading(false);
    if (result?.error) {
      setError(mode === "register" ? "Conta criada, mas não foi possível entrar automaticamente." : "Não foi possível entrar. Confira o e-mail e a senha.");
      return;
    }
    router.push(callbackUrl);
    router.refresh();
  }

  return (
    <>
      <div className="mt-7 grid grid-cols-2 rounded-xl bg-[#eef3f1] p-1 text-xs font-bold">
        <button type="button" onClick={() => { setMode("login"); setError(""); }} className={`rounded-lg px-3 py-2.5 ${mode === "login" ? "bg-white text-primary shadow-sm" : "text-muted"}`}>Entrar</button>
        <button type="button" onClick={() => { setMode("register"); setError(""); }} className={`rounded-lg px-3 py-2.5 ${mode === "register" ? "bg-white text-primary shadow-sm" : "text-muted"}`}>Criar conta</button>
      </div>
      <form className="mt-5 space-y-4" onSubmit={submit}>
        {mode === "register" && <label><span className="label">Nome profissional</span><input className="field" name="name" autoComplete="name" required minLength={2} maxLength={120} /></label>}
        <label><span className="label">E-mail</span><input className="field" name="email" type="email" autoComplete="email" required maxLength={254} /></label>
        <label><span className="label">Senha</span><input className="field" name="password" type="password" autoComplete={mode === "register" ? "new-password" : "current-password"} required minLength={mode === "register" ? 12 : 1} maxLength={128} /></label>
        {mode === "register" && (
          <>
            <label><span className="label">Confirmar senha</span><input className="field" name="passwordConfirmation" type="password" autoComplete="new-password" required minLength={12} maxLength={128} /></label>
            <p className="text-[11px] leading-5 text-muted">Use ao menos 12 caracteres, com maiúscula, minúscula, número e símbolo.</p>
            <label className="flex items-start gap-3 text-xs leading-5 text-muted"><input name="acceptedTerms" type="checkbox" required className="mt-1 size-4 accent-primary" /><span>Confirmo o uso profissional e minha responsabilidade pela proteção dos dados cadastrados.</span></label>
          </>
        )}
        {error && <p className="rounded-xl bg-red-50 px-3 py-2 text-xs font-semibold text-red-700">{error}</p>}
        <button className="btn-primary mt-2 w-full" disabled={loading}>
          {loading ? <LoaderCircle className="animate-spin" size={16} /> : mode === "register" ? <UserPlus size={16} /> : <ArrowRight size={16} />}
          {loading ? "Processando..." : mode === "register" ? "Criar conta e entrar" : "Entrar"}
        </button>
      </form>
    </>
  );
}
