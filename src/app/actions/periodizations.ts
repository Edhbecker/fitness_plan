"use server";

import type { WorkoutStatus } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { requireTrainerId } from "@/lib/auth/require-trainer";
import { addPlannedExerciseForTrainer, createPeriodizationForTrainer } from "@/services/periodizations";
import { createWorkoutSessionFromPlan } from "@/services/workouts";
import type { ActionResult } from "@/types/actions";

function refreshStudent(studentId: string) {
  revalidatePath("/");
  revalidatePath(`/alunos/${studentId}`);
  revalidatePath(`/alunos/${studentId}/periodizacao`);
}

export async function createPeriodizationAction(
  studentId: string,
  input: { name: string; objective: string; startDate: string; totalWeeks: number; notes?: string },
): Promise<ActionResult> {
  try {
    await createPeriodizationForTrainer(await requireTrainerId(), {
      ...input,
      studentId,
      startDate: new Date(`${input.startDate}T12:00:00`),
    });
    refreshStudent(studentId);
    return { success: true, message: "Periodização criada com sucesso." };
  } catch {
    return { success: false, message: "Não foi possível criar o ciclo. A data inicial deve ser uma segunda-feira." };
  }
}

export async function addPlannedExerciseAction(
  studentId: string,
  input: { trainingDayId: string; exerciseId: string; sets: number; reps: number; loadKg: number; registeredOneRmKg?: number | null; restSeconds: number; notes?: string },
): Promise<ActionResult> {
  try {
    await addPlannedExerciseForTrainer(await requireTrainerId(), input);
    refreshStudent(studentId);
    return { success: true, message: "Exercício adicionado ao treino." };
  } catch {
    return { success: false, message: "Não foi possível adicionar o exercício. Revise os campos." };
  }
}

export async function registerWorkoutAction(
  studentId: string,
  trainingDayId: string,
  status: WorkoutStatus,
): Promise<ActionResult> {
  try {
    await createWorkoutSessionFromPlan(await requireTrainerId(), trainingDayId, status);
    refreshStudent(studentId);
    return { success: true, message: "Execução registrada com sucesso." };
  } catch {
    return { success: false, message: "Não foi possível registrar. Verifique se este treino já foi registrado." };
  }
}
