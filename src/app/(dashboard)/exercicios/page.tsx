import { ExerciseLibrary } from "@/components/exercise-library";
import { requireTrainerId } from "@/lib/auth/require-trainer";
import { listExercisesForTrainer } from "@/services/exercises";

export default async function ExercisesPage() {
  const exercises = await listExercisesForTrainer(await requireTrainerId()).then((items) =>
    items.map((exercise) => ({
      id: exercise.id,
      name: exercise.name,
      group: exercise.primaryMuscleGroup,
      equipment: exercise.equipment ?? "Sem equipamento",
      type: exercise.type,
      aliases: exercise.aliases.map((item) => item.alias),
    })),
  );
  return <div className="space-y-6"><div><p className="text-xs font-bold uppercase tracking-[0.18em] text-accent">Biblioteca</p><h1 className="mt-2 text-3xl font-bold tracking-tight">Exercícios</h1><p className="mt-1 text-sm text-muted">Padronize prescrições e encontre exercícios também por aliases manuais.</p></div><ExerciseLibrary exercises={exercises} /></div>;
}
