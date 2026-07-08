"use client";

import Link from "next/link";
import { ArrowDownUp, CalendarDays, ChevronDown, Filter, Pencil, Search, Scale } from "lucide-react";
import { useMemo, useState } from "react";

type AssessmentListItem = {
  id: string;
  assessmentDate: string;
  displayDate: string;
  weightKg: number;
  bodyFatPercentage: number | null;
  leanMassKg: number | null;
  waistCircumference: number | null;
  notes: string | null;
};

type SortMode = "recent" | "oldest" | "weight-desc" | "weight-asc" | "fat-desc" | "fat-asc";
type FilterMode = "all" | "with-fat" | "without-fat" | "with-notes";

const sortLabels: Record<SortMode, string> = {
  recent: "Mais recentes",
  oldest: "Mais antigas",
  "weight-desc": "Maior peso",
  "weight-asc": "Menor peso",
  "fat-desc": "Maior gordura",
  "fat-asc": "Menor gordura",
};

const filterLabels: Record<FilterMode, string> = {
  all: "Todas",
  "with-fat": "Com gordura calculada",
  "without-fat": "Sem cálculo de gordura",
  "with-notes": "Com observações",
};

function normalize(value: string) {
  return value.toLocaleLowerCase("pt-BR").normalize("NFD").replace(/\p{Diacritic}/gu, "");
}

function formatMetric(value: number | null, suffix: string) {
  return value === null ? "-" : `${value}${suffix}`;
}

export function AssessmentList({
  assessments,
  studentId,
  selectedAssessmentId,
}: {
  assessments: AssessmentListItem[];
  studentId: string;
  selectedAssessmentId?: string;
}) {
  const [query, setQuery] = useState("");
  const [sortMode, setSortMode] = useState<SortMode>("recent");
  const [filterMode, setFilterMode] = useState<FilterMode>("all");

  const filteredAssessments = useMemo(() => {
    const normalizedQuery = normalize(query.trim());
    return assessments
      .filter((assessment) => {
        if (filterMode === "with-fat" && assessment.bodyFatPercentage === null) return false;
        if (filterMode === "without-fat" && assessment.bodyFatPercentage !== null) return false;
        if (filterMode === "with-notes" && !assessment.notes?.trim()) return false;

        if (!normalizedQuery) return true;
        const searchable = normalize([
          assessment.displayDate,
          assessment.assessmentDate,
          `${assessment.weightKg} kg`,
          assessment.bodyFatPercentage === null ? "sem calculo gordura" : `${assessment.bodyFatPercentage} gordura`,
          assessment.leanMassKg === null ? "" : `${assessment.leanMassKg} massa magra`,
          assessment.waistCircumference === null ? "" : `${assessment.waistCircumference} cintura`,
          assessment.notes ?? "",
        ].join(" "));
        return searchable.includes(normalizedQuery);
      })
      .sort((a, b) => {
        if (sortMode === "recent") return b.assessmentDate.localeCompare(a.assessmentDate);
        if (sortMode === "oldest") return a.assessmentDate.localeCompare(b.assessmentDate);
        if (sortMode === "weight-desc") return b.weightKg - a.weightKg;
        if (sortMode === "weight-asc") return a.weightKg - b.weightKg;
        if (sortMode === "fat-desc") return (b.bodyFatPercentage ?? -1) - (a.bodyFatPercentage ?? -1);
        return (a.bodyFatPercentage ?? Number.MAX_SAFE_INTEGER) - (b.bodyFatPercentage ?? Number.MAX_SAFE_INTEGER);
      });
  }, [assessments, filterMode, query, sortMode]);

  return (
    <section className="card overflow-hidden">
      <div className="border-b border-line bg-[#fbfcfc] p-4 md:p-5">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-accent">Histórico corporal</p>
            <h2 className="mt-1 text-lg font-bold">Avaliações registradas</h2>
            <p className="mt-1 text-xs text-muted">
              Busque, filtre e ordene para encontrar rapidamente a avaliação que precisa alterar.
            </p>
          </div>
          <span className="w-fit rounded-full bg-[#e7f3ef] px-3 py-1 text-[11px] font-bold text-primary">
            {filteredAssessments.length} de {assessments.length} avaliações
          </span>
        </div>

        <div className="mt-4 grid gap-3 lg:grid-cols-[1fr_220px_220px]">
          <label className="relative">
            <span className="sr-only">Buscar avaliação</span>
            <Search className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-muted" size={16} />
            <input
              className="field field-icon-left"
              placeholder="Buscar por data, peso, gordura, cintura ou observação..."
              value={query}
              onChange={(event) => setQuery(event.target.value)}
            />
          </label>

          <label className="relative">
            <span className="sr-only">Filtrar avaliações</span>
            <Filter className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-muted" size={16} />
            <select className="field field-icon-left field-select appearance-none" value={filterMode} onChange={(event) => setFilterMode(event.target.value as FilterMode)}>
              {Object.entries(filterLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
            </select>
            <ChevronDown className="pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 text-muted" size={16} />
          </label>

          <label className="relative">
            <span className="sr-only">Ordenar avaliações</span>
            <ArrowDownUp className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-muted" size={16} />
            <select className="field field-icon-left field-select appearance-none" value={sortMode} onChange={(event) => setSortMode(event.target.value as SortMode)}>
              {Object.entries(sortLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
            </select>
            <ChevronDown className="pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 text-muted" size={16} />
          </label>
        </div>
      </div>

      <div className="grid gap-3 p-4 md:grid-cols-2 xl:grid-cols-3">
        {filteredAssessments.map((assessment) => {
          const active = assessment.id === selectedAssessmentId;
          return (
            <article key={assessment.id} className={`rounded-2xl border p-4 transition ${active ? "border-primary bg-[#e9f6f2] shadow-sm" : "border-line bg-white hover:border-[#9bc1ba] hover:shadow-sm"}`}>
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="flex items-center gap-1.5 text-xs font-bold text-muted"><CalendarDays size={14} /> {assessment.displayDate}</p>
                  <p className="mt-2 flex items-center gap-2 text-2xl font-bold"><Scale size={18} className="text-primary" /> {assessment.weightKg} kg</p>
                </div>
                <Link href={`/alunos/${studentId}/avaliacao?editar=${assessment.id}`} className="inline-flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-xs font-bold text-primary hover:bg-[#f4f7f5]">
                  <Pencil size={14} /> Editar
                </Link>
              </div>

              <div className="mt-4 grid grid-cols-3 gap-2 text-xs">
                <div className="rounded-xl bg-[#f4f7f5] p-2">
                  <p className="font-bold text-muted">Gordura</p>
                  <p className="mt-1 font-bold text-foreground">{formatMetric(assessment.bodyFatPercentage, "%")}</p>
                </div>
                <div className="rounded-xl bg-[#f4f7f5] p-2">
                  <p className="font-bold text-muted">Magra</p>
                  <p className="mt-1 font-bold text-foreground">{formatMetric(assessment.leanMassKg, " kg")}</p>
                </div>
                <div className="rounded-xl bg-[#f4f7f5] p-2">
                  <p className="font-bold text-muted">Cintura</p>
                  <p className="mt-1 font-bold text-foreground">{formatMetric(assessment.waistCircumference, " cm")}</p>
                </div>
              </div>

              {assessment.notes?.trim() && <p className="mt-3 max-h-10 overflow-hidden break-words text-xs leading-5 text-muted">{assessment.notes}</p>}
            </article>
          );
        })}

        {filteredAssessments.length === 0 && (
          <div className="rounded-2xl border border-dashed border-line bg-white p-6 text-center text-sm text-muted md:col-span-2 xl:col-span-3">
            Nenhuma avaliação encontrada com os filtros atuais.
          </div>
        )}
      </div>
    </section>
  );
}
