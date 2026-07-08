"use server";

import { revalidatePath } from "next/cache";
import { requireTrainerId } from "@/lib/auth/require-trainer";
import { createAssessmentForTrainer, updateAssessmentForTrainer } from "@/services/assessments";
import type { ActionResult, AssessmentActionInput } from "@/types/actions";

export async function createAssessmentAction(
  studentId: string,
  input: AssessmentActionInput,
): Promise<ActionResult<{ id: string }>> {
  try {
    const assessment = await createAssessmentForTrainer(await requireTrainerId(), studentId, {
      ...input,
      assessmentDate: new Date(`${input.assessmentDate}T12:00:00`),
    });
    revalidatePath("/");
    revalidatePath("/alunos");
    revalidatePath(`/alunos/${studentId}`);
    revalidatePath(`/alunos/${studentId}/avaliacao`);
    return { success: true, data: { id: assessment.id }, message: "Avaliação salva com sucesso." };
  } catch {
    return { success: false, message: "Não foi possível salvar a avaliação. Revise os dados e tente novamente." };
  }
}

export async function updateAssessmentAction(
  studentId: string,
  assessmentId: string,
  input: AssessmentActionInput,
): Promise<ActionResult<{ id: string }>> {
  try {
    const assessment = await updateAssessmentForTrainer(await requireTrainerId(), studentId, assessmentId, {
      ...input,
      assessmentDate: new Date(`${input.assessmentDate}T12:00:00`),
    });
    revalidatePath("/");
    revalidatePath("/alunos");
    revalidatePath(`/alunos/${studentId}`);
    revalidatePath(`/alunos/${studentId}/avaliacao`);
    return { success: true, data: { id: assessment.id }, message: "Avaliação atualizada com sucesso." };
  } catch {
    return { success: false, message: "Não foi possível atualizar a avaliação. Revise os dados e tente novamente." };
  }
}
