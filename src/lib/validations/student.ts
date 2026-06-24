import { z } from "zod";

const optionalPositiveNumber = z.preprocess(
  (value) => (value === "" || value === null || value === undefined ? undefined : value),
  z.coerce.number().positive("O peso inicial deve ser maior que zero.").optional(),
);

const validPastDateString = z
  .string()
  .min(1, "Informe a data de nascimento.")
  .refine((value) => {
    const date = new Date(`${value}T12:00:00`);
    return !Number.isNaN(date.getTime()) && date <= new Date();
  }, "A data de nascimento deve ser válida e não pode estar no futuro.");

export const studentSchema = z.object({
  name: z.string().trim().min(2, "Informe o nome do aluno."),
  contact: z.string().trim().optional(),
  birthDate: validPastDateString,
  sex: z.enum(["HOMEM", "MULHER", "OUTRO", "NAO_INFORMADO"]),
  heightCm: z.coerce.number().positive("A altura deve ser maior que zero."),
  initialWeightKg: optionalPositiveNumber,
  objective: z.string().trim().min(1, "Informe o objetivo."),
  weeklyFrequency: z.coerce.number().int().min(1).max(7),
  notes: z.string().trim().optional(),
});

export type StudentFormInput = z.input<typeof studentSchema>;
export type StudentInput = z.output<typeof studentSchema>;

export const createStudentSchema = studentSchema.extend({
  birthDate: z
    .date()
    .refine((value) => !Number.isNaN(value.getTime()) && value <= new Date(), {
      message: "A data de nascimento deve ser válida e não pode estar no futuro.",
    }),
  heightCm: z.number().finite().positive("A altura deve ser maior que zero."),
  initialWeightKg: z.number().finite().positive("O peso inicial deve ser maior que zero.").optional(),
});
