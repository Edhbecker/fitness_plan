import { z } from "zod";
import { emailSchema, strongPasswordSchema } from "./auth";

const optionalPastDateString = z.preprocess(
  (value) => {
    if (typeof value !== "string") return value;
    const trimmed = value.trim();
    return trimmed.length ? trimmed : undefined;
  },
  z
    .string()
    .refine((value) => {
      const date = new Date(`${value}T12:00:00`);
      return !Number.isNaN(date.getTime()) && date <= new Date();
    }, "A data de nascimento deve ser valida e nao pode estar no futuro.")
    .optional(),
);

export const profileDetailsSchema = z.object({
  name: z.string().trim().min(2, "Informe seu nome.").max(120, "Nome muito longo."),
  email: emailSchema,
  birthDate: optionalPastDateString,
});

export const passwordChangeSchema = z
  .object({
    currentPassword: z.string().min(1, "Informe a senha atual.").max(128, "Senha muito longa."),
    newPassword: strongPasswordSchema,
    passwordConfirmation: z.string(),
  })
  .refine((input) => input.newPassword === input.passwordConfirmation, {
    message: "As senhas nao coincidem.",
    path: ["passwordConfirmation"],
  });

export type ProfileDetailsInput = z.input<typeof profileDetailsSchema>;
export type PasswordChangeInput = z.input<typeof passwordChangeSchema>;
