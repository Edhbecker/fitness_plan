import { notFound } from "next/navigation";
import { ProfileForm } from "@/components/profile-form";
import { requireTrainerId } from "@/lib/auth/require-trainer";
import { getUserProfileForTrainer } from "@/services/users";

function formatDateInput(date: Date | null) {
  if (!date) return "";
  return date.toISOString().slice(0, 10);
}

export default async function ProfilePage() {
  const profile = await getUserProfileForTrainer(await requireTrainerId());
  if (!profile) notFound();

  return (
    <div className="space-y-6">
      <div>
        <p className="text-xs font-bold uppercase tracking-[0.18em] text-accent">Minha conta</p>
        <h1 className="mt-2 text-3xl font-bold tracking-tight">Perfil do personal</h1>
        <p className="mt-1 text-sm text-muted">Gerencie seus dados de acesso e seguranca da conta.</p>
      </div>

      <ProfileForm
        profile={{
          name: profile.name,
          email: profile.email,
          birthDate: formatDateInput(profile.birthDate),
        }}
      />
    </div>
  );
}
