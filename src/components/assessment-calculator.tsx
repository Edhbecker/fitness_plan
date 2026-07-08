"use client";

import { Calculator, CheckCircle2, CircleAlert, Save } from "lucide-react";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { createAssessmentAction, updateAssessmentAction } from "@/app/actions/assessments";
import {
  calculateBasalMetabolicRate,
  calculateBodyDensity,
  calculateBodyFatPercentage,
  calculateFatMass,
  calculateLeanMass,
  calculateSkinfoldSum,
  type CalculationSex,
  type Skinfolds,
} from "@/lib/calculations";
import type { AssessmentActionInput } from "@/types/actions";

const skinfoldFields: { key: keyof Skinfolds; label: string }[] = [
  { key: "chestSkinfold", label: "Peitoral / toracica" },
  { key: "axillarySkinfold", label: "Axilar" },
  { key: "tricepsSkinfold", label: "Triceps" },
  { key: "subscapularSkinfold", label: "Subescapular" },
  { key: "abdominalSkinfold", label: "Abdominal" },
  { key: "suprailiacSkinfold", label: "Supra-iliaca" },
  { key: "thighSkinfold", label: "Coxa" },
];

const circumferenceFields = [
  ["chestCircumference", "Torax"],
  ["waistCircumference", "Cintura"],
  ["hipCircumference", "Quadril"],
  ["abdomenCircumference", "Abdomen"],
  ["thighCircumference", "Coxa"],
  ["armCircumference", "Braco"],
] as const;

export type EditableAssessment = {
  id: string;
  assessmentDate: string;
  weightKg: number;
  sexAtAssessment: CalculationSex;
  heightCmAtAssessment: number;
  chestSkinfold?: number | null;
  axillarySkinfold?: number | null;
  tricepsSkinfold?: number | null;
  subscapularSkinfold?: number | null;
  abdominalSkinfold?: number | null;
  suprailiacSkinfold?: number | null;
  thighSkinfold?: number | null;
  bicepsSkinfold?: number | null;
  supraespinalSkinfold?: number | null;
  chestCircumference?: number | null;
  waistCircumference?: number | null;
  hipCircumference?: number | null;
  abdomenCircumference?: number | null;
  thighCircumference?: number | null;
  armCircumference?: number | null;
  notes?: string | null;
};

function localDateValue() {
  const date = new Date();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${date.getFullYear()}-${month}-${day}`;
}

function optionalNumber(formData: FormData, name: string) {
  const value = formData.get(name);
  return value === null || value === "" ? undefined : Number(value);
}

function valueText(value?: number | null) {
  return value === null || value === undefined ? "" : String(value);
}

function initialSkinfolds(assessment?: EditableAssessment) {
  return Object.fromEntries(
    skinfoldFields.map(({ key }) => [key, valueText(assessment?.[key])]),
  ) as Record<string, string>;
}

export function AssessmentCalculator({
  studentId,
  initialSex,
  initialHeight,
  initialAge,
  assessment,
}: {
  studentId: string;
  initialSex: CalculationSex;
  initialHeight: number;
  initialAge: number;
  assessment?: EditableAssessment;
}) {
  const router = useRouter();
  const editing = Boolean(assessment);
  const [sex, setSex] = useState<CalculationSex>(assessment?.sexAtAssessment ?? initialSex);
  const [weight, setWeight] = useState(valueText(assessment?.weightKg));
  const [height, setHeight] = useState(valueText(assessment?.heightCmAtAssessment ?? initialHeight));
  const [skinfolds, setSkinfolds] = useState<Record<string, string>>(() => initialSkinfolds(assessment));
  const [message, setMessage] = useState("");
  const [success, setSuccess] = useState(false);
  const [saving, setSaving] = useState(false);

  const result = useMemo(() => {
    const parsed = Object.fromEntries(
      Object.entries(skinfolds).map(([key, value]) => [
        key,
        value === "" ? null : Number(value),
      ]),
    ) as Skinfolds;
    const sum = calculateSkinfoldSum(parsed);
    const density =
      sum.value === null ? null : calculateBodyDensity(sex, sum.value, initialAge);
    const fat = density === null ? null : calculateBodyFatPercentage(density);
    const fatMass = fat === null ? null : calculateFatMass(Number(weight), fat);
    return {
      sum,
      density,
      fat,
      fatMass,
      leanMass: fatMass === null ? null : calculateLeanMass(Number(weight), fatMass),
      bmr: calculateBasalMetabolicRate(sex, Number(weight), Number(height), initialAge),
    };
  }, [height, initialAge, sex, skinfolds, weight]);

  const cards = [
    ["GEB", result.bmr ? `${result.bmr.toLocaleString("pt-BR")} kcal` : "Nao aplicavel"],
    ["Soma de dobras", result.sum.value !== null ? `${result.sum.value} mm` : "Incompleto"],
    ["Gordura corporal", result.fat !== null ? `${result.fat}%` : "Nao calculado"],
    ["Massa magra", result.leanMass !== null ? `${result.leanMass} kg` : "Nao calculado"],
  ];

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setMessage("");
    setSuccess(false);
    const formData = new FormData(event.currentTarget);
    const payload: AssessmentActionInput = {
      assessmentDate: String(formData.get("assessmentDate")),
      weightKg: Number(weight),
      sexAtAssessment: sex,
      heightCmAtAssessment: Number(height),
      ...Object.fromEntries(
        skinfoldFields.map(({ key }) => [
          key,
          skinfolds[key] === "" || skinfolds[key] === undefined
            ? null
            : Number(skinfolds[key]),
        ]),
      ),
      bicepsSkinfold: optionalNumber(formData, "bicepsSkinfold"),
      supraespinalSkinfold: optionalNumber(formData, "supraespinalSkinfold"),
      chestCircumference: optionalNumber(formData, "chestCircumference"),
      waistCircumference: optionalNumber(formData, "waistCircumference"),
      hipCircumference: optionalNumber(formData, "hipCircumference"),
      abdomenCircumference: optionalNumber(formData, "abdomenCircumference"),
      thighCircumference: optionalNumber(formData, "thighCircumference"),
      armCircumference: optionalNumber(formData, "armCircumference"),
      notes: String(formData.get("notes") ?? ""),
    };
    const response = assessment
      ? await updateAssessmentAction(studentId, assessment.id, payload)
      : await createAssessmentAction(studentId, payload);
    setSaving(false);
    setSuccess(response.success);
    setMessage(response.message);
    if (response.success) router.refresh();
  }

  return (
    <form onSubmit={submit} className="grid gap-6 xl:grid-cols-[1.35fr_0.65fr]">
      <div className="space-y-6">
        {message && (
          <div className={`flex items-center gap-2 rounded-xl border px-4 py-3 text-sm font-semibold ${success ? "border-[#bddfd6] bg-[#e9f6f2] text-primary" : "border-red-200 bg-red-50 text-red-700"}`}>
            {success && <CheckCircle2 size={17} />} {message}
          </div>
        )}
        <section className="card p-5 md:p-7">
          <h2 className="font-bold">{editing ? "Editar dados da avaliacao" : "Dados da avaliacao"}</h2>
          <p className="mt-1 text-xs text-muted">Os indicadores sao recalculados enquanto voce preenche.</p>
          <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <label><span className="label">Data</span><input name="assessmentDate" type="date" className="field" defaultValue={assessment?.assessmentDate ?? localDateValue()} required /></label>
            <label><span className="label">Peso (kg)</span><input type="number" min="0.1" step="0.1" className="field" value={weight} onChange={(event) => setWeight(event.target.value)} required /></label>
            <label><span className="label">Altura (cm)</span><input type="number" min="0.1" step="0.1" className="field" value={height} onChange={(event) => setHeight(event.target.value)} required /></label>
            <label><span className="label">Idade snapshot</span><input type="number" className="field bg-background" value={initialAge} readOnly /></label>
            <label className="sm:col-span-2"><span className="label">Sexo usado na avaliacao</span><select className="field" value={sex} onChange={(event) => setSex(event.target.value as CalculationSex)}><option value="HOMEM">Homem</option><option value="MULHER">Mulher</option><option value="OUTRO">Outro</option><option value="NAO_INFORMADO">Nao informado</option></select></label>
          </div>
        </section>

        <section className="card p-5 md:p-7">
          <div className="flex items-start justify-between gap-4">
            <div><h2 className="font-bold">Protocolo de 7 dobras</h2><p className="mt-1 text-xs text-muted">Jackson & Pollock, conforme estrutura definida.</p></div>
            <span className="rounded-full bg-[#e7f3ef] px-3 py-1 text-[10px] font-bold text-primary">PROTOCOLO ATIVO</span>
          </div>
          <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {skinfoldFields.map((field) => (
              <label key={field.key}><span className="label">{field.label} (mm)</span><input type="number" min="0" step="0.1" className="field" value={skinfolds[field.key] ?? ""} onChange={(event) => setSkinfolds((current) => ({ ...current, [field.key]: event.target.value }))} /></label>
            ))}
            <label><span className="label">Bicipital extra (mm)</span><input name="bicepsSkinfold" type="number" min="0" step="0.1" className="field" placeholder="Opcional" defaultValue={valueText(assessment?.bicepsSkinfold)} /></label>
            <label><span className="label">Supraespinhal extra (mm)</span><input name="supraespinalSkinfold" type="number" min="0" step="0.1" className="field" placeholder="Opcional" defaultValue={valueText(assessment?.supraespinalSkinfold)} /></label>
          </div>
          {result.sum.missing.length > 0 && (
            <p className="mt-4 text-xs text-muted">
              Dobras pendentes: {result.sum.missing.map((key) => skinfoldFields.find((field) => field.key === key)?.label).join(", ")}.
            </p>
          )}
        </section>

        <section className="card p-5 md:p-7">
          <h2 className="font-bold">Circunferencias</h2>
          <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {circumferenceFields.map(([name, label]) => <label key={name}><span className="label">{label} (cm)</span><input name={name} type="number" min="0" step="0.1" className="field" placeholder="Opcional" defaultValue={valueText(assessment?.[name])} /></label>)}
          </div>
          <label className="mt-5 block"><span className="label">Observacoes</span><textarea name="notes" className="field min-h-24 resize-y" defaultValue={assessment?.notes ?? ""} /></label>
        </section>
      </div>

      <aside className="space-y-5 xl:sticky xl:top-24 xl:self-start">
        <section className="card overflow-hidden">
          <div className="bg-primary p-5 text-white"><div className="flex items-center gap-2"><Calculator size={18} /><h2 className="font-bold">Resultados calculados</h2></div><p className="mt-1 text-xs text-white/60">Previa em tempo real</p></div>
          <div className="grid grid-cols-2 gap-px bg-line">
            {cards.map(([label, value]) => <div key={label} className="bg-white p-4"><p className="text-[10px] font-bold uppercase tracking-wider text-muted">{label}</p><p className="mt-2 text-lg font-bold">{value}</p></div>)}
          </div>
          <div className="space-y-2 border-t border-line p-5 text-xs text-muted">
            <p className="flex justify-between"><span>Densidade corporal</span><strong className="text-foreground">{result.density ?? "-"}</strong></p>
            <p className="flex justify-between"><span>Massa gorda</span><strong className="text-foreground">{result.fatMass !== null ? `${result.fatMass} kg` : "-"}</strong></p>
          </div>
        </section>
        {(sex === "OUTRO" || sex === "NAO_INFORMADO") && <div className="flex gap-3 rounded-2xl border border-[#f2d0b4] bg-[#fff5ec] p-4 text-xs leading-5 text-[#98541e]"><CircleAlert size={18} className="shrink-0" />Nao foi possivel calcular automaticamente. Selecione Homem ou Mulher para aplicar esta formula especifica.</div>}
        <button type="submit" disabled={saving} className="btn-primary w-full disabled:opacity-60"><Save size={16} /> {saving ? "Salvando..." : editing ? "Salvar alteracoes" : "Salvar avaliacao"}</button>
      </aside>
    </form>
  );
}
