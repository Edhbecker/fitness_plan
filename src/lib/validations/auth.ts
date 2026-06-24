import { z } from "zod";

export const emailSchema = z
  .string()
  .trim()
  .toLowerCase()
  .min(1, "Informe seu e-mail.")
  .max(254, "E-mail muito longo.")
  .email("Informe um e-mail valido.")
  .regex(/^[^\s@]+@[^\s@]+\.[^\s@]+$/, "Informe um e-mail com dominio valido.");

export const strongPasswordSchema = z
  .string()
  .min(12, "A senha deve ter pelo menos 12 caracteres.")
  .max(128, "A senha deve ter no maximo 128 caracteres.")
  .regex(/[a-z]/, "Inclua uma letra minuscula.")
  .regex(/[A-Z]/, "Inclua uma letra maiuscula.")
  .regex(/[0-9]/, "Inclua um numero.")
  .regex(/[^a-zA-Z0-9]/, "Inclua um simbolo.");

export const registerTrainerSchema = z
  .object({
    name: z.string().trim().min(2, "Informe seu nome.").max(120, "Nome muito longo."),
    email: emailSchema,
    password: strongPasswordSchema,
    passwordConfirmation: z.string(),
    acceptedTerms: z.boolean().refine((value) => value, "Confirme o uso profissional e a protecao dos dados."),
  })
  .refine((input) => input.password === input.passwordConfirmation, {
    message: "As senhas nao coincidem.",
    path: ["passwordConfirmation"],
  });

export type RegisterTrainerInput = z.input<typeof registerTrainerSchema>;
