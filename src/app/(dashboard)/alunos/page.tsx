import Link from "next/link";
import { Plus } from "lucide-react";
import { StudentsList, type StudentListItem } from "@/components/students-list";
import { requireTrainerId } from "@/lib/auth/require-trainer";
import { calculateWeeklyAdherence } from "@/lib/calculations";
import { listStudentsForTrainer } from "@/services/students";

export default async function StudentsPage() {
  const students: StudentListItem[] = await listStudentsForTrainer(await requireTrainerId()).then((items) =>
    items.map((student) => {
      const days = student.periodizations[0]?.weeks.flatMap((week) => week.days).filter((day) => !day.isRestDay && day.plannedExercises.length > 0) ?? [];
      const statuses = days.flatMap((day) => day.workoutSessions[0] ? [day.workoutSessions[0].status] : []);
      return {
        id: student.id,
        name: student.name,
        initials: student.name.split(/\s+/).slice(0, 2).map((part) => part[0]).join("").toUpperCase(),
        contact: student.contact ?? "Sem contato",
        objective: student.objective,
        frequency: student.weeklyFrequency,
        latestWeight: student.assessments[0] ? Number(student.assessments[0].weightKg) : null,
        adherence: calculateWeeklyAdherence(days.length, statuses),
        status: student.status === "ACTIVE" ? "Ativo" as const : "Inativo" as const,
      };
    }),
  );

  return <div className="space-y-6"><div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between"><div><p className="text-xs font-bold uppercase tracking-[0.18em] text-accent">Gestão de alunos</p><h1 className="mt-2 text-3xl font-bold tracking-tight">Alunos</h1><p className="mt-1 text-sm text-muted">Acompanhe cadastros, avaliações e ciclos ativos.</p></div><Link href="/alunos/novo" className="btn-primary"><Plus size={17} /> Novo aluno</Link></div><StudentsList students={students} /></div>;
}
