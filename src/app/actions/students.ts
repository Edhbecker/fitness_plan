"use server";

import { revalidatePath } from "next/cache";
import { requireTrainerId } from "@/lib/auth/require-trainer";
import { studentSchema, type StudentInput } from "@/lib/validations/student";
import { createStudentForTrainer, deactivateStudentForTrainer } from "@/services/students";
import type { ActionResult } from "@/types/actions";

export async function createStudentAction(input: StudentInput): Promise<ActionResult<{ id: string }>> {
  const parsed = studentSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, message: "Revise os dados informados.", errors: parsed.error.flatten().fieldErrors };
  }
  try {
    const trainerId = await requireTrainerId();
    const student = await createStudentForTrainer(trainerId, {
      ...parsed.data,
      birthDate: new Date(`${parsed.data.birthDate}T12:00:00`),
    });
    revalidatePath("/");
    revalidatePath("/alunos");
    return { success: true, data: { id: student.id }, message: "Aluno cadastrado com sucesso." };
  } catch {
    return { success: false, message: "Não foi possível cadastrar o aluno. Tente novamente." };
  }
}

export async function deactivateStudentAction(studentId: string): Promise<ActionResult> {
  try {
    await deactivateStudentForTrainer(await requireTrainerId(), studentId);
    revalidatePath("/");
    revalidatePath("/alunos");
    revalidatePath(`/alunos/${studentId}`);
    return { success: true, message: "Aluno desativado com sucesso." };
  } catch {
    return { success: false, message: "Não foi possível desativar o aluno." };
  }
}
