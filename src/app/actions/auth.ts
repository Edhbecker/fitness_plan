"use server";

import { Prisma } from "@prisma/client";
import { registerTrainerSchema, type RegisterTrainerInput } from "@/lib/validations/auth";
import { registerTrainer } from "@/services/users";
import type { ActionResult } from "@/types/actions";

export async function registerTrainerAction(input: RegisterTrainerInput): Promise<ActionResult> {
  const parsed = registerTrainerSchema.safeParse(input);
  if (!parsed.success) {
    return {
      success: false,
      message: "Revise os dados para criar sua conta.",
      errors: parsed.error.flatten().fieldErrors,
    };
  }

  try {
    await registerTrainer(parsed.data);
    return { success: true, message: "Conta criada com sucesso." };
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      return { success: false, message: "Este e-mail já possui uma conta." };
    }
    return { success: false, message: "Não foi possível criar a conta. Tente novamente." };
  }
}
