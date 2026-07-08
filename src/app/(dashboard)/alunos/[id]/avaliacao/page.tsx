import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronLeft, Plus } from "lucide-react";
import { AssessmentCalculator, type EditableAssessment } from "@/components/assessment-calculator";
import { AssessmentList } from "@/components/assessment-list";
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

function toListAssessment(assessment: NonNullable<Awaited<ReturnType<typeof getStudentAssessmentsForTrainer>>>["assessments"][number]) {
  return {
    id: assessment.id,
    assessmentDate: dateInputValue(assessment.assessmentDate),
    displayDate: formatDate(assessment.assessmentDate),
    weightKg: Number(assessment.weightKg),
    bodyFatPercentage: numberOrNull(assessment.bodyFatPercentage),
    leanMassKg: numberOrNull(assessment.leanMassKg),
    waistCircumference: numberOrNull(assessment.waistCircumference),
    notes: assessment.notes,
  };
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

      {student.assessments.length > 0 && <AssessmentList assessments={student.assessments.map(toListAssessment)} studentId={student.id} selectedAssessmentId={editableAssessment?.id} />}

      <AssessmentCalculator key={editableAssessment?.id ?? "new-assessment"} studentId={student.id} initialSex={student.sex} initialHeight={Number(student.heightCm)} initialAge={calculateAge(student.birthDate)} assessment={editableAssessment} />
    </div>
  );
}
