import { prisma } from "@/lib/prisma";
import { createPeriodizationSchema } from "@/lib/validations/periodization";
import { writeAuditLog } from "./audit";
import { generatePeriodizationCalendar } from "./periodization";
import { calculateExerciseMetrics } from "./workouts";
import { plannedExerciseSchema } from "@/lib/validations/workout";

export type CreatePeriodizationInput = {
  studentId: string;
  name: string;
  objective: string;
  startDate: Date;
  totalWeeks?: number;
  notes?: string;
};

export async function createPeriodizationForTrainer(
  trainerId: string,
  input: CreatePeriodizationInput,
) {
  const validatedInput = createPeriodizationSchema.parse(input);
  const calendar = generatePeriodizationCalendar(
    validatedInput.startDate,
    validatedInput.totalWeeks ?? 12,
  );
  return prisma.$transaction(async (transaction) => {
    const student = await transaction.student.findFirstOrThrow({
      where: { id: validatedInput.studentId, trainerId },
      select: { id: true },
    });
    const periodization = await transaction.periodization.create({
      data: {
        trainerId,
        studentId: student.id,
        name: validatedInput.name,
        objective: validatedInput.objective,
        startDate: calendar.startDate,
        totalWeeks: calendar.totalWeeks,
        endDate: calendar.endDate,
        notes: validatedInput.notes,
        weeks: {
          create: calendar.weeks.map((week) => ({
            weekNumber: week.weekNumber,
            startDate: week.startDate,
            endDate: week.endDate,
            days: { create: week.days },
          })),
        },
      },
    });
    await writeAuditLog(transaction, {
      trainerId,
      entityType: "Periodization",
      entityId: periodization.id,
      action: "PERIODIZATION_CREATED",
      newValue: {
        studentId: student.id,
        totalWeeks: periodization.totalWeeks,
        startDate: periodization.startDate.toISOString(),
        endDate: periodization.endDate.toISOString(),
      },
    });
    return periodization;
  });
}

export async function getLatestPeriodizationForTrainer(trainerId: string, studentId: string) {
  return prisma.periodization.findFirst({
    where: { trainerId, studentId },
    orderBy: { startDate: "desc" },
    include: {
      weeks: {
        orderBy: { weekNumber: "asc" },
        include: {
          days: {
            orderBy: { date: "asc" },
            include: {
              plannedExercises: {
                orderBy: { order: "asc" },
                include: { exercise: { select: { name: true } } },
              },
              workoutSessions: {
                orderBy: { performedDate: "desc" },
                take: 1,
                include: { performedExercises: true },
              },
            },
          },
        },
      },
    },
  });
}

export async function addPlannedExerciseForTrainer(
  trainerId: string,
  input: {
    trainingDayId: string;
    exerciseId: string;
    sets: number;
    reps: number;
    loadKg: number;
    registeredOneRmKg?: number | null;
    restSeconds: number;
    notes?: string;
  },
) {
  const validated = plannedExerciseSchema.parse(input);
  const metrics = calculateExerciseMetrics(validated);

  return prisma.$transaction(async (transaction) => {
    const day = await transaction.trainingDay.findFirstOrThrow({
      where: { id: validated.trainingDayId, trainingWeek: { periodization: { trainerId } } },
      include: { plannedExercises: { orderBy: { order: "desc" }, take: 1 } },
    });
    const exercise = await transaction.exercise.findFirstOrThrow({
      where: { id: validated.exerciseId, trainerId, active: true },
      select: { id: true, name: true },
    });
    const planned = await transaction.plannedExercise.create({
      data: {
        trainingDayId: day.id,
        exerciseId: exercise.id,
        order: (day.plannedExercises[0]?.order ?? 0) + 1,
        sets: validated.sets,
        reps: validated.reps,
        loadKg: validated.loadKg,
        registeredOneRmKg: validated.registeredOneRmKg,
        estimatedOneRmKg: metrics.estimatedOneRmKg,
        volume: metrics.volume,
        intensityPercentage: metrics.intensityPercentage,
        restSeconds: validated.restSeconds,
        notes: validated.notes || null,
      },
    });
    await transaction.trainingDay.update({ where: { id: day.id }, data: { isRestDay: false } });
    await writeAuditLog(transaction, {
      trainerId,
      entityType: "PlannedExercise",
      entityId: planned.id,
      action: "PLANNED_EXERCISE_CREATED",
      newValue: { exerciseId: exercise.id, exerciseName: exercise.name, trainingDayId: day.id },
    });
    return planned;
  });
}
