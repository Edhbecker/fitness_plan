import { AppShell } from "@/components/app-shell";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  const user = session?.user?.id
    ? await prisma.user.findUnique({
        where: { id: session.user.id },
        select: { name: true, role: true },
      })
    : null;
  const role = user?.role ?? session?.user?.role;

  return <AppShell userName={user?.name ?? session?.user?.name ?? "Profissional"} userRole={role === "ADMIN" ? "Administrador" : "Personal trainer"}>{children}</AppShell>;
}
