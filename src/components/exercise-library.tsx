"use client";

import { Dumbbell, Plus, Search, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { FormEvent, useMemo, useState, useTransition } from "react";
import { createExerciseAction } from "@/app/actions/exercises";
import type { ExerciseInput } from "@/lib/validations/exercise";

export type ExerciseListItem = {
  id: string;
  name: string;
  group: string;
  equipment: string;
  type: string;
  aliases: string[];
};

export function ExerciseLibrary({ exercises }: { exercises: ExerciseListItem[] }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [query, setQuery] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [message, setMessage] = useState("");
  const filtered = useMemo(() => {
    const normalized = query.toLocaleLowerCase("pt-BR");
    return exercises.filter((exercise) =>
      [exercise.name, exercise.group, ...exercise.aliases].some((value) =>
        value.toLocaleLowerCase("pt-BR").includes(normalized),
      ),
    );
  }, [exercises, query]);

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formElement = event.currentTarget;
    const form = new FormData(formElement);
    startTransition(async () => {
      const result = await createExerciseAction({
        name: String(form.get("name") ?? ""),
        primaryMuscleGroup: String(form.get("group") ?? ""),
        equipment: String(form.get("equipment") ?? ""),
        type: String(form.get("type") ?? "FORCA") as ExerciseInput["type"],
        aliases: String(form.get("aliases") ?? "").split(",").map((item) => item.trim()).filter(Boolean),
        notes: String(form.get("notes") ?? ""),
      });
      setMessage(result.message);
      if (result.success) {
        formElement.reset();
        setShowForm(false);
        router.refresh();
      }
    });
  }

  return (
    <div className="space-y-5">
      <div className="card flex flex-col gap-3 p-4 sm:flex-row">
        <label className="relative flex-1"><span className="sr-only">Buscar exercício</span><Search className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-muted" size={16} /><input className="field field-icon-left" placeholder="Buscar por nome, grupo ou alias..." value={query} onChange={(event) => setQuery(event.target.value)} /></label>
        <button type="button" className="btn-primary" onClick={() => setShowForm((value) => !value)}>{showForm ? <X size={16} /> : <Plus size={16} />} {showForm ? "Fechar" : "Novo exercício"}</button>
      </div>

      {showForm && (
        <form onSubmit={submit} className="card grid gap-4 p-5 md:grid-cols-2 xl:grid-cols-3">
          <label className="text-xs font-bold">Nome<input name="name" required minLength={2} className="field mt-2" /></label>
          <label className="text-xs font-bold">Grupo muscular<input name="group" required minLength={2} className="field mt-2" /></label>
          <label className="text-xs font-bold">Equipamento<input name="equipment" className="field mt-2" /></label>
          <label className="text-xs font-bold">Tipo<select name="type" className="field mt-2"><option value="FORCA">Força</option><option value="MOBILIDADE">Mobilidade</option><option value="CARDIO">Cardio</option><option value="ALONGAMENTO">Alongamento</option><option value="FUNCIONAL">Funcional</option><option value="OUTRO">Outro</option></select></label>
          <label className="text-xs font-bold md:col-span-2">Aliases, separados por vírgula<input name="aliases" className="field mt-2" /></label>
          <label className="text-xs font-bold md:col-span-2 xl:col-span-3">Observações<textarea name="notes" className="field mt-2 min-h-20" /></label>
          <div className="flex items-center gap-3 md:col-span-2 xl:col-span-3"><button disabled={pending} className="btn-primary">{pending ? "Salvando..." : "Salvar exercício"}</button>{message && <p className="text-xs text-muted">{message}</p>}</div>
        </form>
      )}

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {filtered.map((exercise) => (
          <article key={exercise.id} className="card flex items-start gap-4 p-5">
            <span className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-[#e7f3ef] text-primary"><Dumbbell size={20} /></span>
            <div className="min-w-0"><h3 className="font-bold">{exercise.name}</h3><p className="mt-1 text-xs text-muted">{exercise.group} · {exercise.equipment}</p><div className="mt-3 flex flex-wrap gap-2"><span className="rounded-full bg-[#f2f5f4] px-2.5 py-1 text-[10px] font-bold text-muted">{exercise.type}</span>{exercise.aliases.map((alias) => <span key={alias} className="rounded-full bg-[#fff0e3] px-2.5 py-1 text-[10px] font-bold text-[#a65b24]">Alias: {alias}</span>)}</div></div>
          </article>
        ))}
        {filtered.length === 0 && <p className="text-sm text-muted">Nenhum exercício encontrado.</p>}
      </div>
    </div>
  );
}
