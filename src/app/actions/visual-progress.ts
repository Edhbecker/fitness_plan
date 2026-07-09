"use server";

import { type VisualPerception } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { requireTrainerId } from "@/lib/auth/require-trainer";
import {
  visualPhotoAngles,
  type VisualPhotoAngleValue,
} from "@/lib/visual-progress";
import {
  createVisualProgressSessionForTrainer,
  deleteVisualProgressSessionForTrainer,
  saveVisualProgressComparisonForTrainer,
  updateVisualProgressSessionForTrainer,
  type BodyAssessmentLinkMode,
  type VisualProgressPhotoUpload,
} from "@/services/visual-progress";
import type { ActionResult } from "@/types/actions";

function refreshVisualProgress(studentId: string) {
  revalidatePath("/");
  revalidatePath("/alunos");
  revalidatePath(`/alunos/${studentId}`);
  revalidatePath(`/alunos/${studentId}/evolucao-visual`);
  revalidatePath(`/alunos/${studentId}/evolucao-visual/comparar`);
}

function optionalNumber(formData: FormData, name: string) {
  const value = formData.get(name);
  if (value === null || value === "") return null;
  const number = Number(value);
  return Number.isFinite(number) ? number : Number.NaN;
}

function sessionInputFromFormData(formData: FormData) {
  const sessionDate = String(formData.get("sessionDate") ?? "");
  return {
    sessionDate: new Date(`${sessionDate}T12:00:00`),
    bodyAssessmentMode: String(formData.get("bodyAssessmentMode") ?? "NONE") as BodyAssessmentLinkMode,
    bodyAssessmentId: String(formData.get("bodyAssessmentId") ?? "") || null,
    weightKg: optionalNumber(formData, "weightKg"),
    notes: String(formData.get("notes") ?? ""),
  };
}

function isUpload(value: FormDataEntryValue | null): value is File {
  return value instanceof File && value.size > 0 && value.name.length > 0;
}

function photosFromFormData(formData: FormData): VisualProgressPhotoUpload[] {
  const uploads: VisualProgressPhotoUpload[] = [];
  for (const angle of visualPhotoAngles) {
    const file = formData.get(`photo_${angle}`);
    if (isUpload(file)) uploads.push({ angle: angle as VisualPhotoAngleValue, file });
  }
  return uploads;
}

function removedPhotosFromFormData(formData: FormData) {
  return formData.getAll("removePhotoId").map(String).filter(Boolean);
}

export async function createVisualProgressSessionAction(
  studentId: string,
  formData: FormData,
): Promise<ActionResult<{ id: string }>> {
  try {
    const session = await createVisualProgressSessionForTrainer(
      await requireTrainerId(),
      studentId,
      sessionInputFromFormData(formData),
      photosFromFormData(formData),
    );
    refreshVisualProgress(studentId);
    return { success: true, data: { id: session.id }, message: "Sessão de fotos salva com sucesso." };
  } catch (error) {
    return {
      success: false,
      message: error instanceof Error ? error.message : "Não foi possível salvar a sessão de fotos.",
    };
  }
}

export async function updateVisualProgressSessionAction(
  studentId: string,
  sessionId: string,
  formData: FormData,
): Promise<ActionResult<{ id: string }>> {
  try {
    const session = await updateVisualProgressSessionForTrainer(
      await requireTrainerId(),
      studentId,
      sessionId,
      sessionInputFromFormData(formData),
      photosFromFormData(formData),
      removedPhotosFromFormData(formData),
    );
    refreshVisualProgress(studentId);
    return { success: true, data: { id: session.id }, message: "Sessão de fotos atualizada com sucesso." };
  } catch (error) {
    return {
      success: false,
      message: error instanceof Error ? error.message : "Não foi possível atualizar a sessão de fotos.",
    };
  }
}

export async function deleteVisualProgressSessionAction(
  studentId: string,
  sessionId: string,
): Promise<ActionResult> {
  try {
    await deleteVisualProgressSessionForTrainer(await requireTrainerId(), studentId, sessionId);
    refreshVisualProgress(studentId);
    return { success: true, message: "Sessão de fotos excluída com sucesso." };
  } catch {
    return { success: false, message: "Não foi possível excluir a sessão de fotos." };
  }
}

export async function saveVisualProgressComparisonAction(
  studentId: string,
  input: {
    initialSessionId: string;
    finalSessionId: string;
    visualPerception?: string | null;
    professionalComment?: string | null;
  },
): Promise<ActionResult<{ id: string }>> {
  try {
    const comparison = await saveVisualProgressComparisonForTrainer(
      await requireTrainerId(),
      studentId,
      {
        initialSessionId: input.initialSessionId,
        finalSessionId: input.finalSessionId,
        visualPerception: input.visualPerception as VisualPerception | null | undefined,
        professionalComment: input.professionalComment,
      },
    );
    refreshVisualProgress(studentId);
    return { success: true, data: { id: comparison.id }, message: "Comparação visual salva com sucesso." };
  } catch (error) {
    return {
      success: false,
      message: error instanceof Error ? error.message : "Não foi possível salvar a comparação visual.",
    };
  }
}
