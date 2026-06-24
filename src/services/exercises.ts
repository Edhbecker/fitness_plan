import { prisma } from "@/lib/prisma";
import { exerciseInputSchema, type ExerciseInput } from "@/lib/validations/exercise";
import { writeAuditLog } from "./audit";

export async function listExercisesForTrainer(trainerId: string) {
  return prisma.exercise.findMany({
    where: { trainerId, active: true },
    include: { aliases: { orderBy: { alias: "asc" } } },
    orderBy: { name: "asc" },
  });
}

export async function createExerciseForTrainer(trainerId: string, input: ExerciseInput) {
  const validated = exerciseInputSchema.parse(input);
  const aliases = [...new Set(validated.aliases.map((alias) => alias.trim()).filter(Boolean))];

  return prisma.$transaction(async (transaction) => {
    const exercise = await transaction.exercise.create({
      data: {
        trainerId,
        name: validated.name,
        primaryMuscleGroup: validated.primaryMuscleGroup,
        secondaryMuscleGroups: [],
        equipment: validated.equipment || null,
        type: validated.type,
        notes: validated.notes || null,
        aliases: { create: aliases.map((alias) => ({ alias })) },
      },
      include: { aliases: true },
    });
    await writeAuditLog(transaction, {
      trainerId,
      entityType: "Exercise",
      entityId: exercise.id,
      action: "EXERCISE_CREATED",
      newValue: { name: exercise.name, type: exercise.type },
    });
    return exercise;
  });
}
