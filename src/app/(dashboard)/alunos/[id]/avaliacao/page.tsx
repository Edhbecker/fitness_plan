import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronLeft } from "lucide-react";
import { AssessmentCalculator } from "@/components/assessment-calculator";
import { requireTrainerId } from "@/lib/auth/require-trainer";
import { calculateAge } from "@/lib/calculations";
import { getStudentForTrainer } from "@/services/students";

export default async function AssessmentPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const student = await getStudentForTrainer(await requireTrainerId(), id);
  if (!student) notFound();

  return (
    <div className="space-y-6">
      <div><Link href={`/alunos/${student.id}`} className="mb-4 inline-flex items-center gap-1 text-xs font-bold text-muted hover:text-primary"><ChevronLeft size={15} /> Voltar para {student.name}</Link><h1 className="text-3xl font-bold tracking-tight">Nova avaliação corporal</h1><p className="mt-1 text-sm text-muted">Registre medidas e confira os cálculos antes de salvar.</p></div>
      <AssessmentCalculator studentId={student.id} initialSex={student.sex} initialHeight={Number(student.heightCm)} initialAge={calculateAge(student.birthDate)} />
    </div>
  );
}
