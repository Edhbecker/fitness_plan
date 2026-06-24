import { z } from "zod";

export const exerciseMetricsSchema = z.object({
  sets: z.number().int().min(1).max(100),
  reps: z.number().int().min(1).max(1000),
  loadKg: z.number().finite().min(0).max(10000),
  registeredOneRmKg: z.number().finite().positive().max(10000).nullable().optional(),
});

export const workoutSessionSchema = z.object({
  trainingDayId: z.string().min(1),
  status: z.enum(["COMPLETED", "PARTIAL", "MISSED"]),
  performedDate: z.date().refine((value) => !Number.isNaN(value.getTime()), {
    message: "Informe uma data de execução válida.",
  }),
});

export const plannedExerciseSchema = z.object({
  trainingDayId: z.string().min(1),
  exerciseId: z.string().min(1),
  sets: z.number().int().min(1).max(100),
  reps: z.number().int().min(1).max(1000),
  loadKg: z.number().finite().min(0).max(10000),
  registeredOneRmKg: z.number().finite().positive().max(10000).nullable().optional(),
  restSeconds: z.number().int().min(0).max(3600).default(60),
  notes: z.string().trim().optional(),
});
