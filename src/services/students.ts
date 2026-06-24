import { type Sex } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { createStudentSchema } from "@/lib/validations/student";
import { writeAuditLog } from "./audit";

export type CreateStudentInput = {
  name: string;
  contact?: string;
  birthDate: Date;
  sex: Sex;
  heightCm: number;
  initialWeightKg?: number;
  objective: string;
  weeklyFrequency: number;
  notes?: string;
};

export async function listStudentsForTrainer(trainerId: string) {
  return prisma.student.findMany({
    where: { trainerId },
    include: {
      assessments: {
        orderBy: { assessmentDate: "desc" },
        take: 1,
        select: { weightKg: true, assessmentDate: true },
      },
      periodizations: {
        where: { status: { not: "CANCELLED" } },
        orderBy: { startDate: "desc" },
        take: 1,
        include: {
          weeks: {
            include: {
              days: {
                include: {
                  plannedExercises: { select: { id: true } },
                  workoutSessions: {
                    orderBy: { performedDate: "desc" },
                    take: 1,
                    select: { status: true },
                  },
                },
              },
            },
          },
        },
      },
    },
    orderBy: { name: "asc" },
  });
}

export async function getStudentForTrainer(trainerId: string, studentId: string) {
  return prisma.student.findFirst({
    where: { id: studentId, trainerId },
  });
}

export async function getStudentProfileForTrainer(trainerId: string, studentId: string) {
  return prisma.student.findFirst({
    where: { id: studentId, trainerId },
    include: {
      assessments: { orderBy: { assessmentDate: "asc" } },
      healthHistory: { orderBy: { versionDate: "desc" }, take: 1 },
      periodizations: {
        orderBy: { startDate: "desc" },
        take: 1,
        include: {
          weeks: {
            orderBy: { weekNumber: "asc" },
            include: {
              days: {
                include: {
                  plannedExercises: true,
                  workoutSessions: {
                    orderBy: { performedDate: "desc" },
                    include: { performedExercises: true },
                  },
                },
              },
            },
          },
        },
      },
    },
  });
}

export async function createStudentForTrainer(trainerId: string, input: CreateStudentInput) {
  const validatedInput = createStudentSchema.parse(input);
  return prisma.$transaction(async (transaction) => {
    const student = await transaction.student.create({
      data: { trainerId, ...validatedInput },
    });
    await writeAuditLog(transaction, {
      trainerId,
      entityType: "Student",
      entityId: student.id,
      action: "STUDENT_CREATED",
      newValue: { name: student.name, status: student.status },
    });
    return student;
  });
}

export async function deactivateStudentForTrainer(trainerId: string, studentId: string) {
  return prisma.$transaction(async (transaction) => {
    const current = await transaction.student.findFirstOrThrow({
      where: { id: studentId, trainerId },
    });
    const student = await transaction.student.update({
      where: { id: current.id },
      data: { status: "INACTIVE", deactivatedAt: new Date() },
    });
    await writeAuditLog(transaction, {
      trainerId,
      entityType: "Student",
      entityId: student.id,
      action: "STUDENT_DEACTIVATED",
      oldValue: { status: current.status },
      newValue: { status: student.status },
    });
    return student;
  });
}
