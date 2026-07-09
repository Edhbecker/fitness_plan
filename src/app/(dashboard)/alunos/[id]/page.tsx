import Link from "next/link";
import { notFound } from "next/navigation";
import { Activity, AlertTriangle, ArrowRight, CalendarDays, Camera, Scale, TrendingUp } from "lucide-react";
import { BodyChart, type BodyChartItem } from "@/components/charts/body-chart";
import { TrainingChart, type TrainingChartItem } from "@/components/charts/training-chart";
import { StudentProfileHeader } from "@/components/student-profile-header";
import { StatCard } from "@/components/ui/stat-card";
import { requireTrainerId } from "@/lib/auth/require-trainer";
import { calculateWeeklyAdherence } from "@/lib/calculations";
import { formatVisualDate, visualPerceptionLabels } from "@/lib/visual-progress";
import { getStudentProfileForTrainer } from "@/services/students";
import { getVisualProgressSummaryForTrainer } from "@/services/visual-progress";

function formatShortDate(date: Date) {
  return new Intl.DateTimeFormat("pt-BR", { day: "2-digit", month: "short" }).format(date).replace(".", "");
}

export default async function StudentProfilePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const trainerId = await requireTrainerId();
  const [student, visualSummary] = await Promise.all([
    getStudentProfileForTrainer(trainerId, id),
    getVisualProgressSummaryForTrainer(trainerId, id),
  ]);
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
  const visualComparisonLabel = visualSummary.latestComparison?.visualPerception
    ? visualPerceptionLabels[visualSummary.latestComparison.visualPerception]
    : visualSummary.latestComparison
      ? "Comparação registrada"
      : "Sem comparação";

  return (
    <div id="resumo" className="space-y-6">
      <StudentProfileHeader student={student} activeTab="summary" />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Peso atual" value={currentWeight === null ? "Sem dados" : `${currentWeight} kg`} detail={currentWeight !== null && initialWeight !== null ? `${(currentWeight - initialWeight).toFixed(1)} kg desde o início` : "Cadastre uma avaliação"} icon={Scale} />
        <StatCard label="Gordura corporal" value={latestFat === null ? "Sem dados" : `${latestFat}%`} detail="Última avaliação" icon={Activity} tone="orange" />
        <StatCard label="Massa magra" value={latestLean === null ? "Sem dados" : `${latestLean} kg`} detail="Última avaliação" icon={TrendingUp} />
        <StatCard label="Aderência geral" value={`${calculateWeeklyAdherence(plannedDays.length, statuses)}%`} detail={`${statuses.length} sessões registradas`} icon={CalendarDays} tone="blue" />
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.35fr_0.65fr]">
        <section className="card p-5 md:p-6"><div><h2 className="font-bold">Evolução corporal</h2><p className="mt-1 text-xs text-muted">Peso e percentual de gordura</p></div><div className="mt-4">{bodyData.length ? <BodyChart data={bodyData} /> : <EmptyState text="Nenhuma avaliação corporal registrada." />}</div></section>
        <aside className="space-y-4"><div className={`card p-5 ${healthAlert ? "border-[#f1d3b9] bg-[#fffaf5]" : ""}`}><div className="flex gap-3"><AlertTriangle className={`shrink-0 ${healthAlert ? "text-accent" : "text-muted"}`} size={20} /><div><h3 className="text-sm font-bold">{healthAlert ? "Revisar anamnese" : "Anamnese"}</h3><p className="mt-1 text-xs leading-5 text-muted">{health ? `Última versão: ${health.versionDate.toLocaleDateString("pt-BR")}.` : "Nenhuma anamnese registrada."}</p></div></div></div><div className="card p-5"><p className="text-[10px] font-bold uppercase tracking-wider text-accent">Periodização atual</p><h3 className="mt-2 font-bold">{periodization?.name ?? "Nenhuma periodização criada"}</h3><p className="mt-1 text-xs text-muted">{periodization ? `${periodization.totalWeeks} semanas · termina em ${periodization.endDate.toLocaleDateString("pt-BR")}` : "Crie o primeiro ciclo de treinamento."}</p><Link href={`/alunos/${student.id}/periodizacao`} className="mt-4 flex items-center justify-between text-xs font-bold text-primary">Abrir periodização <ArrowRight size={14} /></Link></div><div className="card p-5"><div className="flex items-start gap-3"><span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-[#fff0e3] text-[#c86720]"><Camera size={19} /></span><div><p className="text-[10px] font-bold uppercase tracking-wider text-accent">Evolução visual</p><h3 className="mt-2 font-bold">{visualSummary.latestSessionDate ? formatVisualDate(visualSummary.latestSessionDate) : "Sem registros"}</h3><p className="mt-1 text-xs leading-5 text-muted">Total de sessões: {visualSummary.totalSessions}. Última comparação: {visualComparisonLabel}.</p></div></div><Link href={`/alunos/${student.id}/evolucao-visual`} className="mt-4 flex items-center justify-between text-xs font-bold text-primary">Ver evolução visual <ArrowRight size={14} /></Link></div></aside>
      </div>

      <section className="card p-5 md:p-6"><div><h2 className="font-bold">Treinamento planejado x realizado</h2><p className="mt-1 text-xs text-muted">Volume semanal do ciclo atual</p></div><div className="mt-4">{trainingData.length ? <TrainingChart data={trainingData} /> : <EmptyState text="Nenhuma periodização com exercícios registrada." />}</div></section>
    </div>
  );
}

function EmptyState({ text }: { text: string }) {
  return <div className="flex h-[250px] items-center justify-center rounded-xl bg-[#f3f7f5] text-sm text-muted">{text}</div>;
}
