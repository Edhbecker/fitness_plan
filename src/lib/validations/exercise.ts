import { z } from "zod";

export const exerciseInputSchema = z.object({
  name: z.string().trim().min(2, "Informe o nome do exercício."),
  primaryMuscleGroup: z.string().trim().min(2, "Informe o grupo muscular."),
  equipment: z.string().trim().optional(),
  type: z.enum(["FORCA", "MOBILIDADE", "CARDIO", "ALONGAMENTO", "FUNCIONAL", "OUTRO"]),
  aliases: z.array(z.string().trim().min(2)).default([]),
  notes: z.string().trim().optional(),
});

export type ExerciseInput = z.infer<typeof exerciseInputSchema>;
