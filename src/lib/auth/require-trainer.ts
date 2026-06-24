import "server-only";

import { auth } from "@/auth";

export async function requireTrainerId() {
  const session = await auth();
  if (!session?.user?.id) {
    throw new Error("Não autorizado.");
  }
  return session.user.id;
}
