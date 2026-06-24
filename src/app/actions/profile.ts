"use server";

import { Prisma } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { requireTrainerId } from "@/lib/auth/require-trainer";
import {
  passwordChangeSchema,
  profileDetailsSchema,
  type PasswordChangeInput,
  type ProfileDetailsInput,
} from "@/lib/validations/profile";
import {
  InvalidCurrentPasswordError,
  updateUserPasswordForTrainer,
  updateUserProfileForTrainer,
} from "@/services/users";
import type { ActionResult } from "@/types/actions";

export async function updateProfileAction(input: ProfileDetailsInput): Promise<ActionResult> {
  const parsed = profileDetailsSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, message: "Revise os dados do perfil.", errors: parsed.error.flatten().fieldErrors };
  }

  try {
    await updateUserProfileForTrainer(await requireTrainerId(), parsed.data);
    revalidatePath("/");
    revalidatePath("/perfil");
    return { success: true, message: "Perfil atualizado com sucesso." };
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      return { success: false, message: "Este e-mail ja esta em uso por outra conta." };
    }
    return { success: false, message: "Nao foi possivel atualizar o perfil." };
  }
}

export async function updatePasswordAction(input: PasswordChangeInput): Promise<ActionResult> {
  const parsed = passwordChangeSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, message: "Revise os dados da senha.", errors: parsed.error.flatten().fieldErrors };
  }

  try {
    await updateUserPasswordForTrainer(await requireTrainerId(), parsed.data);
    return { success: true, message: "Senha alterada com sucesso." };
  } catch (error) {
    if (error instanceof InvalidCurrentPasswordError) {
      return { success: false, message: "Senha atual incorreta.", errors: { currentPassword: ["Senha atual incorreta."] } };
    }
    return { success: false, message: "Nao foi possivel alterar a senha." };
  }
}
