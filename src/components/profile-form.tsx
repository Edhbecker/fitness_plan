"use client";

import { KeyRound, LoaderCircle, Save, ShieldCheck, UserRound } from "lucide-react";
import { FormEvent, useState, useTransition } from "react";
import { updatePasswordAction, updateProfileAction } from "@/app/actions/profile";

type FieldErrors = Record<string, string[] | undefined>;

type ProfileFormProps = {
  profile: {
    name: string;
    email: string;
    birthDate: string;
  };
};

function firstError(errors: FieldErrors, field: string) {
  return errors[field]?.[0];
}

function FieldError({ errors, field }: { errors: FieldErrors; field: string }) {
  const message = firstError(errors, field);
  if (!message) return null;
  return <span className="mt-1 block text-xs font-semibold text-red-600">{message}</span>;
}

export function ProfileForm({ profile }: ProfileFormProps) {
  const [profilePending, startProfileTransition] = useTransition();
  const [passwordPending, startPasswordTransition] = useTransition();
  const [profileMessage, setProfileMessage] = useState("");
  const [passwordMessage, setPasswordMessage] = useState("");
  const [profileErrors, setProfileErrors] = useState<FieldErrors>({});
  const [passwordErrors, setPasswordErrors] = useState<FieldErrors>({});

  function submitProfile(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    setProfileMessage("");
    setProfileErrors({});

    startProfileTransition(async () => {
      const result = await updateProfileAction({
        name: String(form.get("name") ?? ""),
        email: String(form.get("email") ?? ""),
        birthDate: String(form.get("birthDate") ?? ""),
      });
      setProfileMessage(result.message);
      setProfileErrors(result.success ? {} : result.errors ?? {});
    });
  }

  function submitPassword(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formElement = event.currentTarget;
    const form = new FormData(formElement);
    setPasswordMessage("");
    setPasswordErrors({});

    startPasswordTransition(async () => {
      const result = await updatePasswordAction({
        currentPassword: String(form.get("currentPassword") ?? ""),
        newPassword: String(form.get("newPassword") ?? ""),
        passwordConfirmation: String(form.get("passwordConfirmation") ?? ""),
      });
      setPasswordMessage(result.message);
      setPasswordErrors(result.success ? {} : result.errors ?? {});
      if (result.success) formElement.reset();
    });
  }

  return (
    <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
      <form onSubmit={submitProfile} className="card p-5 md:p-6">
        <div className="mb-5 flex items-start gap-3">
          <span className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-[#e7f3ef] text-primary">
            <UserRound size={20} />
          </span>
          <div>
            <h2 className="font-bold">Dados do perfil</h2>
            <p className="mt-1 text-xs text-muted">Atualize os dados usados no cabecalho e no acesso.</p>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <label className="md:col-span-2">
            <span className="label">Nome profissional</span>
            <input name="name" className="field" required minLength={2} maxLength={120} defaultValue={profile.name} aria-invalid={Boolean(firstError(profileErrors, "name"))} />
            <FieldError errors={profileErrors} field="name" />
          </label>

          <label className="md:col-span-2">
            <span className="label">E-mail</span>
            <input name="email" type="email" inputMode="email" className="field" required maxLength={254} defaultValue={profile.email} aria-invalid={Boolean(firstError(profileErrors, "email"))} />
            <FieldError errors={profileErrors} field="email" />
          </label>

          <label>
            <span className="label">Data de nascimento</span>
            <input name="birthDate" type="date" className="field" defaultValue={profile.birthDate} aria-invalid={Boolean(firstError(profileErrors, "birthDate"))} />
            <FieldError errors={profileErrors} field="birthDate" />
          </label>
        </div>

        <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:items-center">
          <button className="btn-primary" disabled={profilePending}>
            {profilePending ? <LoaderCircle className="animate-spin" size={16} /> : <Save size={16} />}
            {profilePending ? "Salvando..." : "Salvar perfil"}
          </button>
          {profileMessage && <p className="text-xs font-semibold text-muted">{profileMessage}</p>}
        </div>
      </form>

      <form onSubmit={submitPassword} className="card p-5 md:p-6">
        <div className="mb-5 flex items-start gap-3">
          <span className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-[#fff0e3] text-[#c86720]">
            <KeyRound size={20} />
          </span>
          <div>
            <h2 className="font-bold">Seguranca</h2>
            <p className="mt-1 text-xs text-muted">Altere sua senha usando a senha atual como confirmacao.</p>
          </div>
        </div>

        <div className="space-y-4">
          <label>
            <span className="label">Senha atual</span>
            <input name="currentPassword" type="password" autoComplete="current-password" className="field" required maxLength={128} aria-invalid={Boolean(firstError(passwordErrors, "currentPassword"))} />
            <FieldError errors={passwordErrors} field="currentPassword" />
          </label>

          <label>
            <span className="label">Nova senha</span>
            <input name="newPassword" type="password" autoComplete="new-password" className="field" required minLength={12} maxLength={128} aria-invalid={Boolean(firstError(passwordErrors, "newPassword"))} />
            <FieldError errors={passwordErrors} field="newPassword" />
          </label>

          <label>
            <span className="label">Confirmar nova senha</span>
            <input name="passwordConfirmation" type="password" autoComplete="new-password" className="field" required minLength={12} maxLength={128} aria-invalid={Boolean(firstError(passwordErrors, "passwordConfirmation"))} />
            <FieldError errors={passwordErrors} field="passwordConfirmation" />
          </label>

          <p className="flex gap-2 rounded-xl bg-[#f4f7f5] px-3 py-2 text-[11px] leading-5 text-muted">
            <ShieldCheck className="mt-0.5 shrink-0 text-primary" size={15} />
            Use ao menos 12 caracteres, com maiuscula, minuscula, numero e simbolo.
          </p>
        </div>

        <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:items-center">
          <button className="btn-primary" disabled={passwordPending}>
            {passwordPending ? <LoaderCircle className="animate-spin" size={16} /> : <KeyRound size={16} />}
            {passwordPending ? "Alterando..." : "Alterar senha"}
          </button>
          {passwordMessage && <p className="text-xs font-semibold text-muted">{passwordMessage}</p>}
        </div>
      </form>
    </div>
  );
}
