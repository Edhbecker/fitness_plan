import { z } from "zod";

export const createPeriodizationSchema = z.object({
  studentId: z.string().min(1),
  name: z.string().trim().min(2, "Informe o nome da periodização."),
  objective: z.string().trim().min(1, "Informe o objetivo da periodização."),
  startDate: z.date().refine((value) => !Number.isNaN(value.getTime()), {
    message: "Informe uma data inicial válida.",
  }),
  totalWeeks: z.number().int().min(1, "O total de semanas deve ser maior que zero.").max(52, "O ciclo pode ter no máximo 52 semanas.").optional(),
  notes: z.string().trim().optional(),
});
