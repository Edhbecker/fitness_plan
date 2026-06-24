import { PrismaClient } from "@prisma/client";
import { z } from "zod";
import { loadProjectEnv } from "./load-env.mjs";

loadProjectEnv();

const input = z.object({ DELETE_USER_EMAIL: z.string().trim().toLowerCase().email() }).safeParse(process.env);
if (!input.success) {
  console.error("Configure DELETE_USER_EMAIL com a conta que deve ser removida.");
  process.exit(1);
}

const prisma = new PrismaClient();
try {
  const user = await prisma.user.findUnique({
    where: { email: input.data.DELETE_USER_EMAIL },
    include: { _count: { select: { students: true, periodizations: true, workoutSessions: true } } },
  });

  if (!user) throw new Error("Conta nao encontrada.");
  if (user._count.students || user._count.periodizations || user._count.workoutSessions) {
    throw new Error("A conta possui dados vinculados e nao pode ser removida por este comando.");
  }

  await prisma.$transaction([
    prisma.auditLog.deleteMany({ where: { trainerId: user.id } }),
    prisma.exercise.deleteMany({ where: { trainerId: user.id } }),
    prisma.user.delete({ where: { id: user.id } }),
  ]);

  console.log("Conta sem dados vinculados removida com sucesso.");
} catch (error) {
  console.error(error.message);
  process.exitCode = 1;
} finally {
  await prisma.$disconnect();
}
