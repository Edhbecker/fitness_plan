import { AppShell } from "@/components/app-shell";
import { auth } from "@/auth";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  return <AppShell userName={session?.user?.name ?? "Profissional"} userRole={session?.user?.role === "ADMIN" ? "Administrador" : "Personal trainer"}>{children}</AppShell>;
}
