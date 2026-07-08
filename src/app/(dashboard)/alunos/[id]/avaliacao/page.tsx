import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronLeft, Pencil, Plus } from "lucide-react";
import { AssessmentCalculator, type EditableAssessment } from "@/components/assessment-calculator";
import { requireTrainerId } from "@/lib/auth/require-trainer";
import { calculateAge } from "@/lib/calculations";
import { getStudentAssessmentsForTrainer } from "@/services/assessments";

function dateInputValue(date: Date) {
  return date.toISOString().slice(0, 10);
}

function formatDate(date: Date) {
  return date.toLocaleDateString("pt-BR");
}

function numberOrNull(value: unknown) {
  return value === null || value === undefined ? null : Number(value);
}

function toEditableAssessment(assessment: NonNullable<Awaited<ReturnType<typeof getStudentAssessmentsForTrainer>>>["assessments"][number]): EditableAssessment {
  return {
    id: assessment.id,
    assessmentDate: dateInputValue(assessment.assessmentDate),
    weightKg: Number(assessment.weightKg),
    sexAtAssessment: assessment.sexAtAssessment,
    heightCmAtAssessment: Number(assessment.heightCmAtAssessment),
    chestSkinfold: numberOrNull(assessment.chestSkinfold),
    axillarySkinfold: numberOrNull(assessment.axillarySkinfold),
    tricepsSkinfold: numberOrNull(assessment.tricepsSkinfold),
    subscapularSkinfold: numberOrNull(assessment.subscapularSkinfold),
    abdominalSkinfold: numberOrNull(assessment.abdominalSkinfold),
    suprailiacSkinfold: numberOrNull(assessment.suprailiacSkinfold),
    thighSkinfold: numberOrNull(assessment.thighSkinfold),
    bicepsSkinfold: numberOrNull(assessment.bicepsSkinfold),
    supraespinalSkinfold: numberOrNull(assessment.supraespinalSkinfold),
    chestCircumference: numberOrNull(assessment.chestCircumference),
    waistCircumference: numberOrNull(assessment.waistCircumference),
    hipCircumference: numberOrNull(assessment.hipCircumference),
    abdomenCircumference: numberOrNull(assessment.abdomenCircumference),
    thighCircumference: numberOrNull(assessment.thighCircumference),
    armCircumference: numberOrNull(assessment.armCircumference),
    notes: assessment.notes,
  };
}

export default async function AssessmentPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams?: Promise<{ editar?: string }>;
}) {
  const { id } = await params;
  const query = searchParams ? await searchParams : {};
  const student = await getStudentAssessmentsForTrainer(await requireTrainerId(), id);
  if (!student) notFound();

  const selectedAssessment = query.editar
    ? student.assessments.find((assessment) => assessment.id === query.editar)
    : undefined;
  const editableAssessment = selectedAssessment ? toEditableAssessment(selectedAssessment) : undefined;

  return (
    <div className="space-y-6">
      <div>
        <Link href={`/alunos/${student.id}`} className="mb-4 inline-flex items-center gap-1 text-xs font-bold text-muted hover:text-primary">
          <ChevronLeft size={15} /> Voltar para {student.name}
        </Link>
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">{editableAssessment ? "Editar avaliacao corporal" : "Nova avaliacao corporal"}</h1>
            <p className="mt-1 text-sm text-muted">
              {editableAssessment ? "Atualize medidas ja registradas e salve as alteracoes." : "Registre medidas e confira os calculos antes de salvar."}
            </p>
          </div>
          {editableAssessment && (
            <Link href={`/alunos/${student.id}/avaliacao`} className="btn-secondary">
              <Plus size={15} /> Nova avaliacao
            </Link>
          )}
        </div>
      </div>

      {student.assessments.length > 0 && (
        <section className="card p-4">
          <div className="mb-3 flex items-center justify-between gap-3">
            <div>
              <h2 className="text-sm font-bold">Avaliacoes registradas</h2>
              <p className="mt-1 text-xs text-muted">Clique em editar para ajustar uma avaliacao existente.</p>
            </div>
          </div>
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            {student.assessments.map((assessment) => {
              const active = assessment.id === editableAssessment?.id;
              return (
                <article key={assessment.id} className={`rounded-2xl border p-4 ${active ? "border-primary bg-[#e9f6f2]" : "border-line bg-white"}`}>
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-xs font-bold text-muted">{formatDate(assessment.assessmentDate)}</p>
                      <p className="mt-1 text-lg font-bold">{Number(assessment.weightKg)} kg</p>
                      <p className="mt-1 text-xs text-muted">
                        {assessment.bodyFatPercentage === null ? "Gordura sem calculo" : `${Number(assessment.bodyFatPercentage)}% de gordura`}
                      </p>
                    </div>
                    <Link href={`/alunos/${student.id}/avaliacao?editar=${assessment.id}`} className="inline-flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-xs font-bold text-primary hover:bg-[#f4f7f5]">
                      <Pencil size={14} /> Editar
                    </Link>
                  </div>
                </article>
              );
            })}
          </div>
        </section>
      )}

      <AssessmentCalculator studentId={student.id} initialSex={student.sex} initialHeight={Number(student.heightCm)} initialAge={calculateAge(student.birthDate)} assessment={editableAssessment} />
    </div>
  );
}
