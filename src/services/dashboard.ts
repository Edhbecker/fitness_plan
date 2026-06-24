import { calculateWeeklyAdherence } from "@/lib/calculations";
import { prisma } from "@/lib/prisma";

export async function getDashboardForTrainer(trainerId: string) {
  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const weekStart = new Date(now);
  weekStart.setDate(now.getDate() - ((now.getDay() + 6) % 7));
  weekStart.setHours(0, 0, 0, 0);
  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekStart.getDate() + 7);

  const [students, weeklySessions] = await Promise.all([
    prisma.student.findMany({
      where: { trainerId },
      orderBy: { name: "asc" },
      include: {
        assessments: { orderBy: { assessmentDate: "desc" }, take: 1 },
        periodizations: {
          where: { status: { not: "CANCELLED" } },
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
                      take: 1,
                      include: { performedExercises: true },
                    },
                  },
                },
              },
            },
          },
        },
      },
    }),
    prisma.workoutSession.findMany({
      where: { trainerId, performedDate: { gte: weekStart, lt: weekEnd } },
      select: { status: true },
    }),
  ]);

  const activeStudents = students.filter((student) => student.status === "ACTIVE");
  const weekTotals = new Map<number, { planned: number; performed: number; prescribed: number; statuses: Array<"COMPLETED" | "PARTIAL" | "MISSED"> }>();
  let totalPlannedDays = 0;
  const totalStatuses: Array<"COMPLETED" | "PARTIAL" | "MISSED"> = [];

  for (const student of activeStudents) {
    for (const week of student.periodizations[0]?.weeks ?? []) {
      const aggregate = weekTotals.get(week.weekNumber) ?? { planned: 0, performed: 0, prescribed: 0, statuses: [] };
      for (const day of week.days) {
        aggregate.planned += day.plannedExercises.reduce((sum, exercise) => sum + Number(exercise.volume), 0);
        aggregate.performed += day.workoutSessions[0]?.performedExercises.reduce((sum, exercise) => sum + Number(exercise.volume), 0) ?? 0;
        if (!day.isRestDay && day.plannedExercises.length > 0) {
          aggregate.prescribed += 1;
          totalPlannedDays += 1;
          if (day.workoutSessions[0]) {
            aggregate.statuses.push(day.workoutSessions[0].status);
            totalStatuses.push(day.workoutSessions[0].status);
          }
        }
      }
      weekTotals.set(week.weekNumber, aggregate);
    }
  }

  const attention: Array<{ studentId: string; name: string; detail: string; tone: "orange" | "red" }> = [];
  for (const student of activeStudents) {
    const periodization = student.periodizations[0];
    const assessment = student.assessments[0];
    if (!periodization) {
      attention.push({ studentId: student.id, name: student.name, detail: "Sem treino ativo", tone: "red" });
    } else {
      const daysToEnd = Math.ceil((periodization.endDate.getTime() - now.getTime()) / 86_400_000);
      if (daysToEnd >= 0 && daysToEnd <= 14) attention.push({ studentId: student.id, name: student.name, detail: `Periodização termina em ${daysToEnd} dias`, tone: "orange" });
    }
    if (assessment) {
      const assessmentAge = Math.floor((now.getTime() - assessment.assessmentDate.getTime()) / 86_400_000);
      if (assessmentAge > 60) attention.push({ studentId: student.id, name: student.name, detail: `Avaliação corporal há ${assessmentAge} dias`, tone: "orange" });
    }
  }

  return {
    activeStudents: activeStudents.length,
    newThisMonth: students.filter((student) => student.createdAt >= monthStart).length,
    weeklySessions: weeklySessions.length,
    completedWeeklySessions: weeklySessions.filter((session) => session.status === "COMPLETED").length,
    adherence: calculateWeeklyAdherence(totalPlannedDays, totalStatuses),
    totalPerformedVolume: [...weekTotals.values()].reduce((sum, week) => sum + week.performed, 0),
    training: [...weekTotals.entries()].sort(([a], [b]) => a - b).slice(0, 8).map(([week, value]) => ({
      week: `S${week}`, planned: value.planned, performed: value.performed, intensity: 0,
      adherence: calculateWeeklyAdherence(value.prescribed, value.statuses),
    })),
    attention: attention.slice(0, 5),
    students: activeStudents.slice(0, 5).map((student) => {
      const days = student.periodizations[0]?.weeks.flatMap((week) => week.days).filter((day) => !day.isRestDay && day.plannedExercises.length > 0) ?? [];
      const statuses = days.flatMap((day) => day.workoutSessions[0] ? [day.workoutSessions[0].status] : []);
      return {
        id: student.id,
        name: student.name,
        initials: student.name.split(/\s+/).slice(0, 2).map((part) => part[0]).join("").toUpperCase(),
        objective: student.objective,
        frequency: student.weeklyFrequency,
        adherence: calculateWeeklyAdherence(days.length, statuses),
        latestWeight: student.assessments[0] ? Number(student.assessments[0].weightKg) : null,
      };
    }),
  };
}
