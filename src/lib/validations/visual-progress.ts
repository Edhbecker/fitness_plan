import { z } from "zod";
import { visualPhotoAngles } from "@/lib/visual-progress";

export const bodyAssessmentLinkModes = ["SELECT", "NEAREST", "NONE"] as const;

export const visualProgressSessionSchema = z.object({
  sessionDate: z
    .date()
    .refine((value) => !Number.isNaN(value.getTime()) && value <= new Date(), {
      message: "A data da sessão deve ser válida e não pode estar no futuro.",
    }),
  bodyAssessmentMode: z.enum(bodyAssessmentLinkModes),
  bodyAssessmentId: z.string().optional().nullable(),
  weightKg: z.number().finite().positive("O peso deve ser maior que zero.").optional().nullable(),
  notes: z.string().trim().max(1000, "Use até 1000 caracteres.").optional().nullable(),
});

export const visualProgressComparisonSchema = z.object({
  initialSessionId: z.string().min(1, "Selecione a sessão inicial."),
  finalSessionId: z.string().min(1, "Selecione a sessão final."),
  visualPerception: z
    .enum([
      "NO_PERCEPTIBLE_CHANGE",
      "SLIGHT_EVOLUTION",
      "MODERATE_EVOLUTION",
      "EVIDENT_EVOLUTION",
    ])
    .optional()
    .nullable(),
  professionalComment: z.string().trim().max(1500, "Use até 1500 caracteres.").optional().nullable(),
}).refine((value) => value.initialSessionId !== value.finalSessionId, {
  path: ["finalSessionId"],
  message: "Selecione duas sessões diferentes.",
});

export const visualProgressPhotoAngleSchema = z.enum(visualPhotoAngles);
