import bcrypt from "bcryptjs";
import { starterExerciseCatalog } from "@/lib/exercise-catalog";
import { prisma } from "@/lib/prisma";
import { registerTrainerSchema, type RegisterTrainerInput } from "@/lib/validations/auth";
import { writeAuditLog } from "./audit";

export async function registerTrainer(input: RegisterTrainerInput) {
  const validated = registerTrainerSchema.parse(input);
  const passwordHash = await bcrypt.hash(validated.password, 12);

  return prisma.$transaction(async (transaction) => {
    const user = await transaction.user.create({
      data: {
        name: validated.name,
        email: validated.email,
        passwordHash,
        role: "TRAINER",
        exercises: {
          create: starterExerciseCatalog.map((exercise) => ({
            ...exercise,
            secondaryMuscleGroups: [],
          })),
        },
      },
    });
    await writeAuditLog(transaction, {
      trainerId: user.id,
      entityType: "User",
      entityId: user.id,
      action: "TRAINER_REGISTERED",
      newValue: { email: user.email, role: user.role },
    });
    return user;
  });
}
