import Link from "next/link";
import { ClipboardPlus, Dumbbell } from "lucide-react";
import { calculateAge } from "@/lib/calculations";

const sexLabels = { HOMEM: "Homem", MULHER: "Mulher", OUTRO: "Outro", NAO_INFORMADO: "Não informado" } as const;

type StudentHeaderData = {
  id: string;
  name: string;
  birthDate: Date;
  sex: keyof typeof sexLabels;
  heightCm: unknown;
  objective: string;
};

type StudentProfileTab = "summary" | "assessments" | "periodization" | "visual";

function initials(name: string) {
  return name.split(/\s+/).slice(0, 2).map((part) => part[0]).join("").toUpperCase();
}

function tabClass(active: boolean) {
  return `whitespace-nowrap rounded-lg px-3 py-2 ${active ? "bg-[#e7f3ef] text-primary" : "hover:bg-[#f4f7f5]"}`;
}

export function StudentProfileHeader({
  student,
  activeTab,
}: {
  student: StudentHeaderData;
  activeTab: StudentProfileTab;
}) {
  return (
    <section className="card overflow-hidden">
      <div className="h-24 bg-[linear-gradient(120deg,#0a3732,#17695f)]" />
      <div className="flex flex-col gap-4 px-5 pb-5 md:flex-row md:items-end md:px-7">
        <span className="-mt-9 flex size-18 items-center justify-center rounded-2xl border-4 border-white bg-accent text-xl font-bold text-primary-dark">
          {initials(student.name)}
        </span>
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-foreground">{student.name}</h1>
          <p className="mt-1 text-xs text-muted">
            {calculateAge(student.birthDate)} anos · {sexLabels[student.sex]} · {Number(student.heightCm)} cm · {student.objective}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link href={`/alunos/${student.id}/avaliacao`} className="btn-secondary">
            <ClipboardPlus size={15} /> Nova avaliação
          </Link>
          <Link href={`/alunos/${student.id}/periodizacao`} className="btn-primary">
            <Dumbbell size={15} /> Abrir treino
          </Link>
        </div>
      </div>
      <nav className="flex gap-1 overflow-x-auto border-t border-line px-4 py-2 text-xs font-bold text-muted md:px-7">
        <Link href={`/alunos/${student.id}`} className={tabClass(activeTab === "summary")}>Resumo</Link>
        <Link href={`/alunos/${student.id}/avaliacao`} className={tabClass(activeTab === "assessments")}>Avaliações</Link>
        <Link href={`/alunos/${student.id}/periodizacao`} className={tabClass(activeTab === "periodization")}>Periodização e treinos</Link>
        <Link href={`/alunos/${student.id}/evolucao-visual`} className={tabClass(activeTab === "visual")}>Evolução visual</Link>
      </nav>
    </section>
  );
}
