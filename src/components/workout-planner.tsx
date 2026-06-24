"use client";

import { Check, ChevronDown, Dumbbell, Plus, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { FormEvent, useMemo, useState, useTransition } from "react";
import {
  addPlannedExerciseAction,
  createPeriodizationAction,
  registerWorkoutAction,
} from "@/app/actions/periodizations";

type PlannerExercise = {
  id: string;
  name: string;
  sets: number;
  reps: number;
  loadKg: number;
  volume: number;
  intensityPercentage: number | null;
};

type PlannerDay = {
  id: string;
  dayOfWeek: string;
  date: string;
  isRestDay: boolean;
  status: "COMPLETED" | "PARTIAL" | "MISSED" | null;
  performedVolume: number;
  exercises: PlannerExercise[];
};

export type PlannerPeriodization = {
  id: string;
  name: string;
  objective: string;
  totalWeeks: number;
  weeks: Array<{ id: string; weekNumber: number; startDate: string; endDate: string; days: PlannerDay[] }>;
};

export type PlannerExerciseOption = { id: string; name: string };

const dayLabels: Record<string, string> = {
  MONDAY: "Segunda-feira", TUESDAY: "Terça-feira", WEDNESDAY: "Quarta-feira",
  THURSDAY: "Quinta-feira", FRIDAY: "Sexta-feira", SATURDAY: "Sábado", SUNDAY: "Domingo",
};
const statusLabels = { COMPLETED: "Concluído", PARTIAL: "Parcial", MISSED: "Não realizado" } as const;

export function WorkoutPlanner({
  studentId,
  periodization,
  exerciseOptions,
}: {
  studentId: string;
  periodization: PlannerPeriodization | null;
  exerciseOptions: PlannerExerciseOption[];
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [weekNumber, setWeekNumber] = useState(1);
  const [showExerciseForm, setShowExerciseForm] = useState(false);
  const [message, setMessage] = useState("");
  const week = periodization?.weeks.find((item) => item.weekNumber === weekNumber) ?? periodization?.weeks[0];
  const totals = useMemo(() => {
    const days = week?.days ?? [];
    const planned = days.flatMap((day) => day.exercises).reduce((sum, exercise) => sum + exercise.volume, 0);
    const performed = days.reduce((sum, day) => sum + day.performedVolume, 0);
    const prescribed = days.filter((day) => day.exercises.length > 0).length;
    const completed = days.filter((day) => day.status === "COMPLETED").length;
    return { planned, performed, adherence: prescribed ? Math.round((completed / prescribed) * 100) : 0 };
  }, [week]);

  function submitCycle(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    startTransition(async () => {
      const result = await createPeriodizationAction(studentId, {
        name: String(form.get("name") ?? ""),
        objective: String(form.get("objective") ?? ""),
        startDate: String(form.get("startDate") ?? ""),
        totalWeeks: Number(form.get("totalWeeks") ?? 12),
        notes: String(form.get("notes") ?? ""),
      });
      setMessage(result.message);
      if (result.success) router.refresh();
    });
  }

  function submitExercise(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    startTransition(async () => {
      const oneRm = Number(form.get("oneRm") ?? 0);
      const result = await addPlannedExerciseAction(studentId, {
        trainingDayId: String(form.get("trainingDayId") ?? ""),
        exerciseId: String(form.get("exerciseId") ?? ""),
        sets: Number(form.get("sets") ?? 0),
        reps: Number(form.get("reps") ?? 0),
        loadKg: Number(form.get("loadKg") ?? 0),
        registeredOneRmKg: oneRm > 0 ? oneRm : null,
        restSeconds: Number(form.get("restSeconds") ?? 60),
      });
      setMessage(result.message);
      if (result.success) {
        setShowExerciseForm(false);
        router.refresh();
      }
    });
  }

  function register(dayId: string, status: "COMPLETED" | "PARTIAL" | "MISSED") {
    startTransition(async () => {
      const result = await registerWorkoutAction(studentId, dayId, status);
      setMessage(result.message);
      if (result.success) router.refresh();
    });
  }

  if (!periodization) {
    return (
      <form onSubmit={submitCycle} className="card grid gap-4 p-5 md:grid-cols-2">
        <div className="md:col-span-2"><h2 className="text-xl font-bold">Criar primeiro ciclo</h2><p className="mt-1 text-xs text-muted">A data inicial precisa ser uma segunda-feira.</p></div>
        <label className="text-xs font-bold">Nome<input name="name" required className="field mt-2" placeholder="Ciclo de hipertrofia" /></label>
        <label className="text-xs font-bold">Objetivo<input name="objective" required className="field mt-2" /></label>
        <label className="text-xs font-bold">Início<input name="startDate" required type="date" className="field mt-2" /></label>
        <label className="text-xs font-bold">Semanas<input name="totalWeeks" required type="number" min={1} max={52} defaultValue={12} className="field mt-2" /></label>
        <label className="text-xs font-bold md:col-span-2">Observações<textarea name="notes" className="field mt-2 min-h-20" /></label>
        <div className="flex items-center gap-3 md:col-span-2"><button disabled={pending} className="btn-primary">{pending ? "Criando..." : "Criar periodização"}</button>{message && <p className="text-xs text-muted">{message}</p>}</div>
      </form>
    );
  }

  return (
    <div className="space-y-5">
      <section className="card flex flex-col gap-4 p-5 md:flex-row md:items-center md:justify-between">
        <div><p className="text-[10px] font-bold uppercase tracking-[0.18em] text-accent">{periodization.name} · {periodization.totalWeeks} semanas</p><h2 className="mt-1 text-xl font-bold">Semana {week?.weekNumber}</h2><p className="mt-1 text-xs text-muted">{week ? `${formatDate(week.startDate)} a ${formatDate(week.endDate)}` : periodization.objective}</p></div>
        <div className="flex flex-wrap gap-2">
          <label className="relative"><select value={week?.weekNumber ?? 1} onChange={(event) => setWeekNumber(Number(event.target.value))} className="btn-secondary appearance-none pr-8">{periodization.weeks.map((item) => <option key={item.id} value={item.weekNumber}>Semana {item.weekNumber}</option>)}</select><ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2" size={14} /></label>
          <button type="button" className="btn-primary" onClick={() => setShowExerciseForm((value) => !value)}>{showExerciseForm ? <X size={15} /> : <Plus size={15} />} {showExerciseForm ? "Fechar" : "Adicionar exercício"}</button>
        </div>
      </section>

      {showExerciseForm && (
        <form onSubmit={submitExercise} className="card grid gap-4 p-5 sm:grid-cols-2 xl:grid-cols-4">
          <label className="text-xs font-bold">Dia<select required name="trainingDayId" className="field mt-2">{week?.days.map((day) => <option key={day.id} value={day.id}>{dayLabels[day.dayOfWeek] ?? day.dayOfWeek} · {formatDate(day.date)}</option>)}</select></label>
          <label className="text-xs font-bold">Exercício<select required name="exerciseId" className="field mt-2"><option value="">Selecione</option>{exerciseOptions.map((exercise) => <option key={exercise.id} value={exercise.id}>{exercise.name}</option>)}</select></label>
          <label className="text-xs font-bold">Séries<input required name="sets" type="number" min={1} defaultValue={3} className="field mt-2" /></label>
          <label className="text-xs font-bold">Repetições<input required name="reps" type="number" min={1} defaultValue={10} className="field mt-2" /></label>
          <label className="text-xs font-bold">Carga (kg)<input required name="loadKg" type="number" min={0} step="0.1" defaultValue={0} className="field mt-2" /></label>
          <label className="text-xs font-bold">1RM registrado (kg)<input name="oneRm" type="number" min={0} step="0.1" className="field mt-2" /></label>
          <label className="text-xs font-bold">Descanso (segundos)<input required name="restSeconds" type="number" min={0} defaultValue={60} className="field mt-2" /></label>
          <div className="flex items-end"><button disabled={pending || exerciseOptions.length === 0} className="btn-primary">{pending ? "Salvando..." : "Adicionar ao treino"}</button></div>
          {exerciseOptions.length === 0 && <p className="text-xs text-red-600 sm:col-span-2 xl:col-span-4">Cadastre um exercício na biblioteca antes de montar o treino.</p>}
        </form>
      )}

      {message && <p className="rounded-xl bg-[#eaf4f1] px-4 py-3 text-xs text-primary">{message}</p>}

      <div className="grid gap-4 md:grid-cols-3">
        <Summary label="Volume planejado" value={`${totals.planned.toLocaleString("pt-BR")} kg`} />
        <Summary label="Volume realizado" value={`${totals.performed.toLocaleString("pt-BR")} kg`} accent />
        <Summary label="Aderência semanal" value={`${totals.adherence}%`} accent />
      </div>

      <div className="grid gap-5 2xl:grid-cols-2">
        {week?.days.map((day) => (
          <article key={day.id} className="card overflow-hidden">
            <header className="flex items-start justify-between border-b border-line bg-[#f9fbfa] p-5"><div><h3 className="font-bold">{dayLabels[day.dayOfWeek] ?? day.dayOfWeek}</h3><p className="mt-1 text-xs text-muted">{formatDate(day.date)}</p></div><span className="rounded-full bg-[#f1f3f2] px-2.5 py-1 text-[10px] font-bold text-muted">{day.status ? statusLabels[day.status] : day.exercises.length ? "Planejado" : "Descanso"}</span></header>
            {day.exercises.length ? (
              <div>
                <div className="overflow-x-auto"><table className="w-full min-w-[560px] text-left text-xs"><thead className="text-[9px] uppercase tracking-wider text-muted"><tr><th className="px-5 py-3">Exercício</th><th>Séries</th><th>Reps</th><th>Carga</th><th>Volume</th><th>Int.</th></tr></thead><tbody>{day.exercises.map((exercise) => <tr key={exercise.id} className="border-t border-line/60"><td className="px-5 py-3 font-bold">{exercise.name}</td><td>{exercise.sets}</td><td>{exercise.reps}</td><td>{exercise.loadKg} kg</td><td>{exercise.volume.toLocaleString("pt-BR")}</td><td>{exercise.intensityPercentage === null ? "—" : `${exercise.intensityPercentage}%`}</td></tr>)}</tbody></table></div>
                <footer className="flex flex-col gap-3 border-t border-line bg-[#fbfcfc] px-5 py-4"><div className="text-xs text-muted"><strong className="text-foreground">{day.exercises.reduce((sum, exercise) => sum + exercise.volume, 0).toLocaleString("pt-BR")} kg</strong> de volume planejado</div>{day.status ? <span className="flex items-center gap-2 text-xs font-bold text-primary"><Check size={15} /> Execução registrada</span> : <div className="flex flex-wrap gap-2"><button disabled={pending} onClick={() => register(day.id, "COMPLETED")} className="btn-primary"><Dumbbell size={15} /> Concluído</button><button disabled={pending} onClick={() => register(day.id, "PARTIAL")} className="btn-secondary">Parcial</button><button disabled={pending} onClick={() => register(day.id, "MISSED")} className="btn-secondary">Não realizado</button></div>}</footer>
              </div>
            ) : <div className="p-8 text-center text-xs text-muted">Dia sem exercícios prescritos. Não entra no cálculo de aderência.</div>}
          </article>
        ))}
      </div>
    </div>
  );
}

function Summary({ label, value, accent }: { label: string; value: string; accent?: boolean }) {
  return <div className="card p-4"><p className="text-[10px] font-bold uppercase tracking-wider text-muted">{label}</p><p className={`mt-2 text-xl font-bold ${accent ? "text-primary" : ""}`}>{value}</p></div>;
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("pt-BR", { day: "2-digit", month: "short", year: "numeric", timeZone: "UTC" }).format(new Date(value)).replace(".", "");
}
