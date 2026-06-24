import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { StudentForm } from "@/components/student-form";

export default function NewStudentPage() {
  return <div className="mx-auto max-w-5xl space-y-6"><div><Link href="/alunos" className="mb-4 inline-flex items-center gap-1 text-xs font-bold text-muted hover:text-primary"><ChevronLeft size={15} /> Voltar para alunos</Link><h1 className="text-3xl font-bold tracking-tight">Cadastrar aluno</h1><p className="mt-1 text-sm text-muted">Comece pelos dados essenciais. Peso atual virá da avaliação mais recente.</p></div><StudentForm /></div>;
}
