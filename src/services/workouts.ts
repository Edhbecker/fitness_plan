import { type WorkoutStatus } from "@prisma/client";
import {
  calculateEstimatedOneRm,
  calculateIntensityPercentage,
  calculateTrainingVolume,
} from "@/lib/calculations";
import { prisma } from "@/lib/prisma";
import { exerciseMetricsSchema, workoutSessionSchema } from "@/lib/validations/workout";
import { writeAuditLog } from "./audit";

export function calculateExerciseMetrics(input: {
  sets: number;
  reps: number;
  loadKg: number;
  registeredOneRmKg?: number | null;
}) {
  const validatedInput = exerciseMetricsSchema.parse(input);
  const estimatedOneRmKg = calculateEstimatedOneRm(validatedInput.loadKg, validatedInput.reps);
  return {
    volume: calculateTrainingVolume(
      validatedInput.sets,
      validatedInput.reps,
      validatedInput.loadKg,
    ),
    estimatedOneRmKg,
    intensityPercentage: calculateIntensityPercentage(
      validatedInput.loadKg,
      estimatedOneRmKg,
      validatedInput.registeredOneRmKg,
    ),
  };
}

export async function createWorkoutSessionFromPlan(
  trainerId: string,
  trainingDayId: string,
  status: WorkoutStatus,
  performedDate = new Date(),
) {
  const validatedInput = workoutSessionSchema.parse({
    trainingDayId,
    status,
    performedDate,
  });
  return prisma.$transaction(async (transaction) => {
    const day = await transaction.trainingDay.findFirstOrThrow({
      where: {
        id: validatedInput.trainingDayId,
        trainingWeek: { periodization: { trainerId } },
      },
      include: {
        plannedExercises: { orderBy: { order: "asc" } },
        trainingWeek: { include: { periodization: { select: { studentId: true } } } },
      },
    });
    const studentId = day.trainingWeek.periodization.studentId;
    const existingSession = await transaction.workoutSession.findFirst({
      where: { trainingDayId: day.id },
      select: { id: true },
    });
    if (existingSession) {
      throw new Error("Este treino já possui uma execução registrada.");
    }
    const session = await transaction.workoutSession.create({
      data: {
        trainingDayId: day.id,
        studentId,
        trainerId,
        performedDate: validatedInput.performedDate,
        status: validatedInput.status,
        performedExercises: {
          create: validatedInput.status === "MISSED"
            ? []
            : day.plannedExercises.map((exercise) => ({
                plannedExerciseId: exercise.id,
                exerciseId: exercise.exerciseId,
                customExerciseName: exercise.customExerciseName,
                order: exercise.order,
                sets: exercise.sets,
                reps: exercise.reps,
                loadKg: exercise.loadKg,
                registeredOneRmKg: exercise.registeredOneRmKg,
                estimatedOneRmKg: exercise.estimatedOneRmKg,
                volume: exercise.volume,
                intensityPercentage: exercise.intensityPercentage,
                restSeconds: exercise.restSeconds,
                notes: exercise.notes,
              })),
        },
      },
    });
    await writeAuditLog(transaction, {
      trainerId,
      entityType: "WorkoutSession",
      entityId: session.id,
      action: "WORKOUT_SESSION_CREATED",
      newValue: {
        studentId,
        trainingDayId: validatedInput.trainingDayId,
        status: validatedInput.status,
      },
    });
    return session;
  });
}
