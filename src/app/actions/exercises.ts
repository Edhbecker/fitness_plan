"use server";

import { revalidatePath } from "next/cache";
import { requireTrainerId } from "@/lib/auth/require-trainer";
import { exerciseInputSchema, type ExerciseInput } from "@/lib/validations/exercise";
import { createExerciseForTrainer } from "@/services/exercises";
import type { ActionResult } from "@/types/actions";

export async function createExerciseAction(input: ExerciseInput): Promise<ActionResult<{ id: string }>> {
  const parsed = exerciseInputSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, message: "Revise os dados do exercício.", errors: parsed.error.flatten().fieldErrors };
  }
  try {
    const exercise = await createExerciseForTrainer(await requireTrainerId(), parsed.data);
    revalidatePath("/exercicios");
    return { success: true, data: { id: exercise.id }, message: "Exercício cadastrado com sucesso." };
  } catch {
    return { success: false, message: "Não foi possível cadastrar. Verifique se o nome já existe." };
  }
}
