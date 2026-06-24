import { z } from "zod";

const optionalNonNegative = z.number().finite().nonnegative().optional();

export const createAssessmentSchema = z.object({
  assessmentDate: z
    .date()
    .refine((value) => !Number.isNaN(value.getTime()) && value <= new Date(), {
      message: "A data da avaliação deve ser válida e não pode estar no futuro.",
    }),
  weightKg: z.number().finite().positive("O peso deve ser maior que zero."),
  sexAtAssessment: z.enum(["HOMEM", "MULHER", "OUTRO", "NAO_INFORMADO"]).optional(),
  heightCmAtAssessment: z.number().finite().positive("A altura deve ser maior que zero.").optional(),
  chestSkinfold: optionalNonNegative.nullable(),
  axillarySkinfold: optionalNonNegative.nullable(),
  tricepsSkinfold: optionalNonNegative.nullable(),
  subscapularSkinfold: optionalNonNegative.nullable(),
  abdominalSkinfold: optionalNonNegative.nullable(),
  suprailiacSkinfold: optionalNonNegative.nullable(),
  thighSkinfold: optionalNonNegative.nullable(),
  bicepsSkinfold: optionalNonNegative,
  supraespinalSkinfold: optionalNonNegative,
  chestCircumference: optionalNonNegative,
  waistCircumference: optionalNonNegative,
  hipCircumference: optionalNonNegative,
  abdomenCircumference: optionalNonNegative,
  thighCircumference: optionalNonNegative,
  armCircumference: optionalNonNegative,
  notes: z.string().trim().optional(),
});
