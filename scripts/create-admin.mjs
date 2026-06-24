import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { loadProjectEnv } from "./load-env.mjs";

loadProjectEnv();

const input = z
  .object({
    ADMIN_NAME: z.string().trim().min(2),
    ADMIN_EMAIL: z.string().trim().email(),
    ADMIN_PASSWORD: z
      .string()
      .min(12)
      .regex(/[a-z]/)
      .regex(/[A-Z]/)
      .regex(/[0-9]/)
      .regex(/[^a-zA-Z0-9]/),
  })
  .safeParse(process.env);

if (!input.success) {
  console.error(
    "Configure ADMIN_NAME, ADMIN_EMAIL e uma ADMIN_PASSWORD com pelo menos 12 caracteres, letras maiusculas/minusculas, numero e simbolo.",
  );
  process.exit(1);
}

const prisma = new PrismaClient();

try {
  const passwordHash = await bcrypt.hash(input.data.ADMIN_PASSWORD, 12);
  const user = await prisma.user.upsert({
    where: { email: input.data.ADMIN_EMAIL },
    update: {
      name: input.data.ADMIN_NAME,
      passwordHash,
      role: "ADMIN",
    },
    create: {
      name: input.data.ADMIN_NAME,
      email: input.data.ADMIN_EMAIL,
      passwordHash,
      role: "ADMIN",
    },
  });

  console.log(`Administrador criado ou atualizado com sucesso: ${user.email}`);
} finally {
  await prisma.$disconnect();
}
