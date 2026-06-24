import { Prisma, type PrismaClient } from "@prisma/client";

type DatabaseClient = PrismaClient | Prisma.TransactionClient;

export async function writeAuditLog(
  database: DatabaseClient,
  input: {
    trainerId: string;
    entityType: string;
    entityId: string;
    action: string;
    oldValue?: Prisma.InputJsonValue;
    newValue?: Prisma.InputJsonValue;
  },
) {
  return database.auditLog.create({
    data: {
      trainerId: input.trainerId,
      entityType: input.entityType,
      entityId: input.entityId,
      action: input.action,
      ...(input.oldValue !== undefined ? { oldValue: input.oldValue } : {}),
      ...(input.newValue !== undefined ? { newValue: input.newValue } : {}),
    },
  });
}
