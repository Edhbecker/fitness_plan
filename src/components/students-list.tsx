"use client";

import Link from "next/link";
import { Filter, Search, UserRoundX } from "lucide-react";
import { useRouter } from "next/navigation";
import { useMemo, useState, useTransition } from "react";
import { deactivateStudentAction } from "@/app/actions/students";

const filters = ["Todos", "Ativo", "Inativo"] as const;

export type StudentListItem = {
  id: string;
  name: string;
  initials: string;
  contact: string;
  objective: string;
  frequency: number;
  latestWeight: number | null;
  adherence: number;
  status: "Ativo" | "Inativo";
};

export function StudentsList({ students }: { students: StudentListItem[] }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [query, setQuery] = useState("");
  const [filterIndex, setFilterIndex] = useState(0);
  const status = filters[filterIndex];
  const filteredStudents = useMemo(() => {
    const normalizedQuery = query.trim().toLocaleLowerCase("pt-BR");
    return students.filter((student) => {
      const matchesQuery =
        !normalizedQuery ||
        [student.name, student.contact, student.objective].some((value) =>
          value.toLocaleLowerCase("pt-BR").includes(normalizedQuery),
        );
      const matchesStatus = status === "Todos" || student.status === status;
      return matchesQuery && matchesStatus;
    });
  }, [query, status, students]);

  return (
    <>
      <div className="card flex flex-col gap-3 p-4 sm:flex-row">
        <label className="relative flex-1">
          <span className="sr-only">Buscar aluno</span>
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" size={16} />
          <input
            className="field pl-9"
            placeholder="Buscar aluno..."
            value={query}
            onChange={(event) => setQuery(event.target.value)}
          />
        </label>
        <button
          type="button"
          className="btn-secondary"
          onClick={() => setFilterIndex((current) => (current + 1) % filters.length)}
        >
          <Filter size={15} /> {status}
        </button>
      </div>

      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[820px] text-left text-sm">
            <thead className="bg-[#f8faf9] text-[10px] uppercase tracking-wider text-muted">
              <tr>
                <th className="px-6 py-3">Aluno</th>
                <th>Objetivo</th>
                <th>Frequência</th>
                <th>Último peso</th>
                <th>Aderência</th>
                <th>Status</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {filteredStudents.map((student) => (
                <tr key={student.id} className="border-t border-line/70 hover:bg-[#fbfcfc]">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <span className="flex size-10 items-center justify-center rounded-xl bg-[#e7f3ef] text-xs font-bold text-primary">
                        {student.initials}
                      </span>
                      <div>
                        <strong>{student.name}</strong>
                        <p className="mt-0.5 text-[11px] text-muted">{student.contact}</p>
                      </div>
                    </div>
                  </td>
                  <td>{student.objective}</td>
                  <td>{student.frequency}x / semana</td>
                  <td>{student.latestWeight !== null ? `${student.latestWeight} kg` : "Sem avaliação"}</td>
                  <td><strong className="text-primary">{student.adherence}%</strong></td>
                  <td>
                    <span className={`rounded-full px-2.5 py-1 text-[10px] font-bold ${student.status === "Ativo" ? "bg-[#e6f5ef] text-[#167052]" : "bg-[#f1f3f2] text-muted"}`}>
                      {student.status}
                    </span>
                  </td>
                  <td className="pr-6 text-right">
                    <div className="flex items-center justify-end gap-3">
                      {student.status === "Ativo" && (
                        <button
                          type="button"
                          disabled={pending}
                          className="text-xs font-bold text-red-600 disabled:opacity-50"
                          onClick={() => {
                            if (!window.confirm(`Desativar ${student.name}?`)) return;
                            startTransition(async () => {
                              await deactivateStudentAction(student.id);
                              router.refresh();
                            });
                          }}
                        >
                          <UserRoundX className="inline" size={14} /> Desativar
                        </button>
                      )}
                      <Link href={`/alunos/${student.id}`} className="text-xs font-bold text-primary">
                        Ver perfil
                      </Link>
                    </div>
                  </td>
                </tr>
              ))}
              {filteredStudents.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-6 py-10 text-center text-sm text-muted">
                    Nenhum aluno encontrado com esses filtros.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}
