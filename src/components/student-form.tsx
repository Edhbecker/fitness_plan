"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { CheckCircle2, Save } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { createStudentAction } from "@/app/actions/students";
import {
  studentSchema,
  type StudentFormInput,
  type StudentInput,
} from "@/lib/validations/student";

export function StudentForm() {
  const router = useRouter();
  const [saved, setSaved] = useState(false);
  const [message, setMessage] = useState("");
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<StudentFormInput, unknown, StudentInput>({
    resolver: zodResolver(studentSchema),
    defaultValues: { weeklyFrequency: 3, sex: "NAO_INFORMADO" },
  });

  const onSubmit = async (data: StudentInput) => {
    setSaved(false);
    setMessage("");
    const result = await createStudentAction(data);
    setMessage(result.message);
    if (!result.success) return;
    setSaved(true);
    if (result.data?.id) {
      router.push(`/alunos/${result.data.id}`);
      router.refresh();
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="card p-5 md:p-7">
      {saved && (
        <div className="mb-6 flex items-center gap-2 rounded-xl border border-[#bddfd6] bg-[#e9f6f2] px-4 py-3 text-sm font-semibold text-primary">
          <CheckCircle2 size={17} /> {message}
        </div>
      )}
      {!saved && message && (
        <div className="mb-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">
          {message}
        </div>
      )}
      <div className="grid gap-5 md:grid-cols-2">
        <Field label="Nome completo" error={errors.name?.message}>
          <input className="field" placeholder="Nome do aluno" {...register("name")} />
        </Field>
        <Field label="Contato" error={errors.contact?.message}>
          <input className="field" placeholder="Telefone ou e-mail" {...register("contact")} />
        </Field>
        <Field label="Data de nascimento" error={errors.birthDate?.message}>
          <input type="date" className="field" {...register("birthDate")} />
        </Field>
        <Field label="Sexo para fórmulas específicas" error={errors.sex?.message}>
          <select className="field" {...register("sex")}>
            <option value="NAO_INFORMADO">Não informado</option>
            <option value="HOMEM">Homem</option>
            <option value="MULHER">Mulher</option>
            <option value="OUTRO">Outro</option>
          </select>
        </Field>
        <Field label="Altura (cm)" error={errors.heightCm?.message}>
          <input type="number" step="0.1" className="field" placeholder="Ex.: 172" {...register("heightCm")} />
        </Field>
        <Field label="Peso inicial (kg)" error={errors.initialWeightKg?.message}>
          <input type="number" step="0.1" className="field" placeholder="Opcional" {...register("initialWeightKg")} />
        </Field>
        <Field label="Objetivo principal" error={errors.objective?.message}>
          <select className="field" {...register("objective")}>
            <option value="">Selecione</option>
            <option>Hipertrofia</option><option>Emagrecimento</option><option>Força</option>
            <option>Condicionamento físico</option><option>Saúde geral</option><option>Reabilitação</option>
          </select>
        </Field>
        <Field label="Frequência semanal" error={errors.weeklyFrequency?.message}>
          <select className="field" {...register("weeklyFrequency")}>
            {[1, 2, 3, 4, 5, 6, 7].map((value) => <option key={value} value={value}>{value}x por semana</option>)}
          </select>
        </Field>
        <div className="md:col-span-2">
          <Field label="Observações gerais" error={errors.notes?.message}>
            <textarea className="field min-h-28 resize-y" placeholder="Preferências, contexto e observações..." {...register("notes")} />
          </Field>
        </div>
      </div>
      <div className="mt-7 flex justify-end">
        <button type="submit" className="btn-primary min-w-40" disabled={isSubmitting}>
          <Save size={16} /> {isSubmitting ? "Salvando..." : "Salvar aluno"}
        </button>
      </div>
    </form>
  );
}

function Field({ label, error, children }: { label: string; error?: string; children: React.ReactNode }) {
  return (
    <label>
      <span className="label">{label}</span>
      {children}
      {error && <span className="mt-1 block text-xs font-semibold text-red-600">{error}</span>}
    </label>
  );
}
