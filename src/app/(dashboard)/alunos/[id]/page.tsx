import Link from "next/link";
import { notFound } from "next/navigation";
import { Activity, AlertTriangle, ArrowRight, CalendarDays, ClipboardPlus, Dumbbell, Scale, TrendingUp } from "lucide-react";
import { BodyChart, type BodyChartItem } from "@/components/charts/body-chart";
import { TrainingChart, type TrainingChartItem } from "@/components/charts/training-chart";
import { StatCard } from "@/components/ui/stat-card";
import { requireTrainerId } from "@/lib/auth/require-trainer";
import { calculateAge, calculateWeeklyAdherence } from "@/lib/calculations";
import { getStudentProfileForTrainer } from "@/services/students";

const sexLabels = { HOMEM: "Homem", MULHER: "Mulher", OUTRO: "Outro", NAO_INFORMADO: "Não informado" } as const;

function formatShortDate(date: Date) {
  return new Intl.DateTimeFormat("pt-BR", { day: "2-digit", month: "short" }).format(date).replace(".", "");
}

export default async function StudentProfilePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const student = await getStudentProfileForTrainer(await requireTrainerId(), id);
  if (!student) notFound();

  const assessments = student.assessments;
  const firstAssessment = assessments[0];
  const latestAssessment = assessments.at(-1);
  const periodization = student.periodizations[0];
  const bodyData: BodyChartItem[] = assessments.map((assessment) => ({
    date: formatShortDate(assessment.assessmentDate),
    weight: Number(assessment.weightKg),
    fat: assessment.bodyFatPercentage === null ? null : Number(assessment.bodyFatPercentage),
    lean: assessment.leanMassKg === null ? null : Number(assessment.leanMassKg),
    waist: assessment.waistCircumference === null ? null : Number(assessment.waistCircumference),
  }));
  const trainingData: TrainingChartItem[] = periodization?.weeks.map((week) => {
    const plannedDays = week.days.filter((day) => !day.isRestDay && day.plannedExercises.length > 0);
    const statuses = plannedDays.flatMap((day) => day.workoutSessions[0] ? [day.workoutSessions[0].status] : []);
    return {
      week: `S${week.weekNumber}`,
      planned: week.days.flatMap((day) => day.plannedExercises).reduce((sum, exercise) => sum + Number(exercise.volume), 0),
      performed: week.days.flatMap((day) => day.workoutSessions[0]?.performedExercises ?? []).reduce((sum, exercise) => sum + Number(exercise.volume), 0),
      intensity: 0,
      adherence: calculateWeeklyAdherence(plannedDays.length, statuses),
    };
  }) ?? [];
  const plannedDays = periodization?.weeks.flatMap((week) => week.days.filter((day) => !day.isRestDay && day.plannedExercises.length > 0)) ?? [];
  const statuses = plannedDays.flatMap((day) => day.workoutSessions[0] ? [day.workoutSessions[0].status] : []);
  const currentWeight = latestAssessment ? Number(latestAssessment.weightKg) : null;
  const initialWeight = student.initialWeightKg !== null ? Number(student.initialWeightKg) : firstAssessment ? Number(firstAssessment.weightKg) : null;
  const latestFat = latestAssessment?.bodyFatPercentage === null || latestAssessment?.bodyFatPercentage === undefined ? null : Number(latestAssessment.bodyFatPercentage);
  const latestLean = latestAssessment?.leanMassKg === null || latestAssessment?.leanMassKg === undefined ? null : Number(latestAssessment.leanMassKg);
  const health = student.healthHistory[0];
  const healthAlert = health ? health.chronicDisease || health.medicationUse || health.surgeryHistory || health.fractureHistory || health.familyCardioHistory : false;
  const initials = student.name.split(/\s+/).slice(0, 2).map((part) => part[0]).join("").toUpperCase();

  return (
    <div id="resumo" className="space-y-6">
      <section className="card overflow-hidden">
        <div className="h-24 bg-[linear-gradient(120deg,#0a3732,#17695f)]" />
        <div className="-mt-9 flex flex-col gap-4 px-5 pb-5 md:flex-row md:items-end md:px-7"><span className="flex size-18 items-center justify-center rounded-2xl border-4 border-white bg-accent text-xl font-bold text-primary-dark">{initials}</span><div className="flex-1"><h1 className="text-2xl font-bold">{student.name}</h1><p className="mt-1 text-xs text-muted">{calculateAge(student.birthDate)} anos · {sexLabels[student.sex]} · {Number(student.heightCm)} cm · {student.objective}</p></div><div className="flex flex-wrap gap-2"><Link href={`/alunos/${student.id}/avaliacao`} className="btn-secondary"><ClipboardPlus size={15} /> Nova avaliação</Link><Link href={`/alunos/${student.id}/periodizacao`} className="btn-primary"><Dumbbell size={15} /> Abrir treino</Link></div></div>
        <nav className="flex gap-1 overflow-x-auto border-t border-line px-4 py-2 text-xs font-bold text-muted md:px-7"><a href="#resumo" className="whitespace-nowrap rounded-lg bg-[#e7f3ef] px-3 py-2 text-primary">Resumo</a><Link href={`/alunos/${student.id}/avaliacao`} className="whitespace-nowrap rounded-lg px-3 py-2 hover:bg-[#f4f7f5]">Avaliações</Link><Link href={`/alunos/${student.id}/periodizacao`} className="whitespace-nowrap rounded-lg px-3 py-2 hover:bg-[#f4f7f5]">Periodização e treinos</Link></nav>
      </section>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Peso atual" value={currentWeight === null ? "Sem dados" : `${currentWeight} kg`} detail={currentWeight !== null && initialWeight !== null ? `${(currentWeight - initialWeight).toFixed(1)} kg desde o início` : "Cadastre uma avaliação"} icon={Scale} />
        <StatCard label="Gordura corporal" value={latestFat === null ? "Sem dados" : `${latestFat}%`} detail="Última avaliação" icon={Activity} tone="orange" />
        <StatCard label="Massa magra" value={latestLean === null ? "Sem dados" : `${latestLean} kg`} detail="Última avaliação" icon={TrendingUp} />
        <StatCard label="Aderência geral" value={`${calculateWeeklyAdherence(plannedDays.length, statuses)}%`} detail={`${statuses.length} sessões registradas`} icon={CalendarDays} tone="blue" />
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.35fr_0.65fr]">
        <section className="card p-5 md:p-6"><div className="flex items-center justify-between"><div><h2 className="font-bold">Evolução corporal</h2><p className="mt-1 text-xs text-muted">Peso e percentual de gordura</p></div><Link href={`/alunos/${student.id}/avaliacao`} className="text-xs font-bold text-primary">Nova avaliação</Link></div><div className="mt-4">{bodyData.length ? <BodyChart data={bodyData} /> : <EmptyState text="Nenhuma avaliação corporal registrada." />}</div></section>
        <aside className="space-y-4"><div className={`card p-5 ${healthAlert ? "border-[#f1d3b9] bg-[#fffaf5]" : ""}`}><div className="flex gap-3"><AlertTriangle className={`shrink-0 ${healthAlert ? "text-accent" : "text-muted"}`} size={20} /><div><h3 className="text-sm font-bold">{healthAlert ? "Revisar anamnese" : "Anamnese"}</h3><p className="mt-1 text-xs leading-5 text-muted">{health ? `Última versão: ${health.versionDate.toLocaleDateString("pt-BR")}.` : "Nenhuma anamnese registrada."}</p></div></div></div><div className="card p-5"><p className="text-[10px] font-bold uppercase tracking-wider text-accent">Periodização atual</p><h3 className="mt-2 font-bold">{periodization?.name ?? "Nenhuma periodização criada"}</h3><p className="mt-1 text-xs text-muted">{periodization ? `${periodization.totalWeeks} semanas · termina em ${periodization.endDate.toLocaleDateString("pt-BR")}` : "Crie o primeiro ciclo de treinamento."}</p><Link href={`/alunos/${student.id}/periodizacao`} className="mt-4 flex items-center justify-between text-xs font-bold text-primary">Abrir periodização <ArrowRight size={14} /></Link></div></aside>
      </div>

      <section className="card p-5 md:p-6"><div><h2 className="font-bold">Treinamento planejado x realizado</h2><p className="mt-1 text-xs text-muted">Volume semanal do ciclo atual</p></div><div className="mt-4">{trainingData.length ? <TrainingChart data={trainingData} /> : <EmptyState text="Nenhuma periodização com exercícios registrada." />}</div></section>
    </div>
  );
}

function EmptyState({ text }: { text: string }) {
  return <div className="flex h-[250px] items-center justify-center rounded-xl bg-[#f3f7f5] text-sm text-muted">{text}</div>;
}
