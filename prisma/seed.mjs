import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const protocol = await prisma.bodyCompositionProtocol.upsert({
    where: { name: "Jackson & Pollock 7 Dobras" },
    update: { active: true, description: "Protocolo de sete dobras para acompanhamento profissional." },
    create: {
      name: "Jackson & Pollock 7 Dobras",
      description: "Protocolo de sete dobras para acompanhamento profissional.",
      requiredSkinfolds: ["chestSkinfold", "axillarySkinfold", "tricepsSkinfold", "subscapularSkinfold", "abdominalSkinfold", "suprailiacSkinfold", "thighSkinfold"],
    },
  });
  await prisma.bodyCompositionProtocol.updateMany({
    where: { id: { not: protocol.id } },
    data: { active: false },
  });
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
