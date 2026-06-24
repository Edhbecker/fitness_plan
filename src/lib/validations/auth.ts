import { z } from "zod";

export const registerTrainerSchema = z
  .object({
    name: z.string().trim().min(2, "Informe seu nome.").max(120, "Nome muito longo."),
    email: z.string().trim().toLowerCase().email("Informe um e-mail válido.").max(254),
    password: z
      .string()
      .min(12, "A senha deve ter pelo menos 12 caracteres.")
      .max(128, "A senha deve ter no máximo 128 caracteres.")
      .regex(/[a-z]/, "Inclua uma letra minúscula.")
      .regex(/[A-Z]/, "Inclua uma letra maiúscula.")
      .regex(/[0-9]/, "Inclua um número.")
      .regex(/[^a-zA-Z0-9]/, "Inclua um símbolo."),
    passwordConfirmation: z.string(),
    acceptedTerms: z.boolean().refine((value) => value, "Confirme o uso profissional e a proteção dos dados."),
  })
  .refine((input) => input.password === input.passwordConfirmation, {
    message: "As senhas não coincidem.",
    path: ["passwordConfirmation"],
  });

export type RegisterTrainerInput = z.input<typeof registerTrainerSchema>;
