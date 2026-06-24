import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronLeft } from "lucide-react";
import { type PlannerPeriodization, WorkoutPlanner } from "@/components/workout-planner";
import { requireTrainerId } from "@/lib/auth/require-trainer";
import { listExercisesForTrainer } from "@/services/exercises";
import { getLatestPeriodizationForTrainer } from "@/services/periodizations";
import { getStudentForTrainer } from "@/services/students";

export default async function PeriodizationPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const trainerId = await requireTrainerId();
  const student = await getStudentForTrainer(trainerId, id);
  if (!student) notFound();

  const [databasePeriodization, databaseExercises] = await Promise.all([
    getLatestPeriodizationForTrainer(trainerId, id),
    listExercisesForTrainer(trainerId),
  ]);
  const periodization: PlannerPeriodization | null = databasePeriodization
    ? {
        id: databasePeriodization.id,
        name: databasePeriodization.name,
        objective: databasePeriodization.objective,
        totalWeeks: databasePeriodization.totalWeeks,
        weeks: databasePeriodization.weeks.map((week) => ({
          id: week.id,
          weekNumber: week.weekNumber,
          startDate: week.startDate.toISOString(),
          endDate: week.endDate.toISOString(),
          days: week.days.map((day) => ({
            id: day.id,
            dayOfWeek: day.dayOfWeek,
            date: day.date.toISOString(),
            isRestDay: day.isRestDay,
            status: day.workoutSessions[0]?.status ?? null,
            performedVolume: day.workoutSessions[0]?.performedExercises.reduce((sum, exercise) => sum + Number(exercise.volume), 0) ?? 0,
            exercises: day.plannedExercises.map((exercise) => ({
              id: exercise.id,
              name: exercise.exercise?.name ?? exercise.customExerciseName ?? "Exercício removido",
              sets: exercise.sets,
              reps: exercise.reps,
              loadKg: Number(exercise.loadKg),
              volume: Number(exercise.volume),
              intensityPercentage: exercise.intensityPercentage === null ? null : Number(exercise.intensityPercentage),
            })),
          })),
        })),
      }
    : null;
  const exerciseOptions = databaseExercises.map((exercise) => ({ id: exercise.id, name: exercise.name }));

  return (
    <div className="space-y-6">
      <div><Link href={`/alunos/${student.id}`} className="mb-4 inline-flex items-center gap-1 text-xs font-bold text-muted hover:text-primary"><ChevronLeft size={15} /> Voltar para {student.name}</Link><h1 className="text-3xl font-bold tracking-tight">Treino semanal</h1><p className="mt-1 text-sm text-muted">Prescrição planejada e registro realizado em contextos separados.</p></div>
      <WorkoutPlanner studentId={student.id} periodization={periodization} exerciseOptions={exerciseOptions} />
    </div>
  );
}
