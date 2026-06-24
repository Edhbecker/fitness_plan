import { PrismaClient } from "@prisma/client";
import { loadProjectEnv, printEnvSource } from "./load-env.mjs";

const envInfo = loadProjectEnv();
const prisma = new PrismaClient();

try {
  const [users, activeProtocols, exercises] = await Promise.all([
    prisma.user.count(),
    prisma.bodyCompositionProtocol.count({ where: { active: true } }),
    prisma.exercise.count(),
  ]);

  console.log("Conexao Prisma com o Supabase confirmada.");
  printEnvSource(envInfo);
  console.table({ users, activeProtocols, exercises });
} catch (error) {
  console.error("Nao foi possivel consultar o banco pelo Prisma.");
  console.error(error.message);
  printEnvSource(envInfo, console.error);
  console.error("Verifique as conexoes Supabase e a saida TCP nas portas 6543 e 5432.");
  process.exitCode = 1;
} finally {
  await prisma.$disconnect();
}
