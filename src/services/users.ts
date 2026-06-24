import bcrypt from "bcryptjs";
import { starterExerciseCatalog } from "@/lib/exercise-catalog";
import { prisma } from "@/lib/prisma";
import { registerTrainerSchema, type RegisterTrainerInput } from "@/lib/validations/auth";
import {
  passwordChangeSchema,
  profileDetailsSchema,
  type PasswordChangeInput,
  type ProfileDetailsInput,
} from "@/lib/validations/profile";
import { writeAuditLog } from "./audit";

export class InvalidCurrentPasswordError extends Error {
  constructor() {
    super("Senha atual incorreta.");
  }
}

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

export async function getUserProfileForTrainer(userId: string) {
  return prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      name: true,
      email: true,
      birthDate: true,
      role: true,
      createdAt: true,
    },
  });
}

export async function updateUserProfileForTrainer(userId: string, input: ProfileDetailsInput) {
  const validated = profileDetailsSchema.parse(input);
  const current = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, name: true, email: true, birthDate: true },
  });

  if (!current) throw new Error("Conta nao encontrada.");

  const birthDate = validated.birthDate ? new Date(`${validated.birthDate}T12:00:00`) : null;
  const user = await prisma.user.update({
    where: { id: userId },
    data: {
      name: validated.name,
      email: validated.email,
      birthDate,
    },
    select: { id: true, name: true, email: true, birthDate: true, role: true },
  });

  await writeAuditLog(prisma, {
    trainerId: userId,
    entityType: "User",
    entityId: userId,
    action: "PROFILE_UPDATED",
    oldValue: {
      name: current.name,
      email: current.email,
      birthDate: current.birthDate?.toISOString() ?? null,
    },
    newValue: {
      name: user.name,
      email: user.email,
      birthDate: user.birthDate?.toISOString() ?? null,
    },
  });

  return user;
}

export async function updateUserPasswordForTrainer(userId: string, input: PasswordChangeInput) {
  const validated = passwordChangeSchema.parse(input);
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, passwordHash: true },
  });

  if (!user) throw new Error("Conta nao encontrada.");
  if (!(await bcrypt.compare(validated.currentPassword, user.passwordHash))) {
    throw new InvalidCurrentPasswordError();
  }

  const passwordHash = await bcrypt.hash(validated.newPassword, 12);
  await prisma.$transaction([
    prisma.user.update({
      where: { id: userId },
      data: { passwordHash },
      select: { id: true },
    }),
    prisma.auditLog.create({
      data: {
        trainerId: userId,
        entityType: "User",
        entityId: userId,
        action: "PASSWORD_UPDATED",
        newValue: { passwordChanged: true },
      },
    }),
  ]);
}
