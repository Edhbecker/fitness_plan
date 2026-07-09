import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, CalendarDays, GitCompare } from "lucide-react";
import { StudentProfileHeader } from "@/components/student-profile-header";
import {
  VisualProgressComparisonSelectors,
  VisualProgressProfessionalReview,
} from "@/components/visual-progress/visual-progress-comparison-controls";
import { requireTrainerId } from "@/lib/auth/require-trainer";
import {
  formatVisualDate,
  visualPhotoAngleLabels,
  visualPhotoAngles,
  visualProgressNotice,
  type VisualPhotoAngleValue,
} from "@/lib/visual-progress";
import { getVisualProgressComparisonPageForTrainer } from "@/services/visual-progress";

type ComparisonSession = NonNullable<Awaited<ReturnType<typeof getVisualProgressComparisonPageForTrainer>>>["sessions"][number];

function numberOrNull(value: unknown) {
  return value === null || value === undefined ? null : Number(value);
}

function formatValue(value: unknown | null | undefined, suffix: string) {
  const number = numberOrNull(value);
  return number === null ? "Sem dados" : `${number}${suffix}`;
}

function formatDifference(initial: unknown | null | undefined, final: unknown | null | undefined, suffix: string) {
  const start = numberOrNull(initial);
  const end = numberOrNull(final);
  if (start === null || end === null) return "Sem dados";
  const delta = end - start;
  return `${delta > 0 ? "+" : ""}${delta.toFixed(1)}${suffix}`;
}

function daysBetween(initial?: Date | null, final?: Date | null) {
  if (!initial || !final) return 0;
  return Math.abs(Math.ceil((final.getTime() - initial.getTime()) / 86_400_000));
}

const metricRows = [
  ["Peso", "weightKg", " kg"],
  ["Gordura corporal", "bodyFatPercentage", " p.p."],
  ["Massa gorda", "fatMassKg", " kg"],
  ["Massa magra", "leanMassKg", " kg"],
  ["Cintura", "waistCircumference", " cm"],
  ["Braço", "armCircumference", " cm"],
  ["Coxa", "thighCircumference", " cm"],
  ["Abdômen", "abdomenCircumference", " cm"],
] as const;

export default async function VisualProgressComparePage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams?: Promise<{ inicial?: string; final?: string }>;
}) {
  const { id } = await params;
  const query = searchParams ? await searchParams : {};
  const data = await getVisualProgressComparisonPageForTrainer(await requireTrainerId(), id, query.inicial, query.final);
  if (!data) notFound();

  const { student, sessions, existingComparison } = data;
  const initialSession = data.initialSession as ComparisonSession | null;
  const finalSession = data.finalSession as ComparisonSession | null;
  const sessionOptions = sessions.map((session) => ({
    id: session.id,
    label: `${formatVisualDate(session.sessionDate)} · ${session.photos.length} foto(s)`,
  }));
  const initialAssessment = initialSession?.bodyAssessment;
  const finalAssessment = finalSession?.bodyAssessment;
  const hasMetricData = Boolean(initialAssessment && finalAssessment);
  const sameSession = initialSession?.id && initialSession.id === finalSession?.id;

  return (
    <div className="space-y-6">
      <StudentProfileHeader student={student} activeTab="visual" />

      <div>
        <Link href={`/alunos/${student.id}/evolucao-visual`} className="mb-4 inline-flex items-center gap-1 text-xs font-bold text-muted hover:text-primary">
          <ArrowLeft size={15} /> Voltar para evolução visual
        </Link>
        <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-accent">Comparação visual</p>
            <h1 className="mt-1 text-3xl font-bold tracking-tight">Comparação visual</h1>
            <p className="mt-1 text-sm text-muted">
              {initialSession && finalSession
                ? `${formatVisualDate(initialSession.sessionDate)} até ${formatVisualDate(finalSession.sessionDate)} · ${daysBetween(initialSession.sessionDate, finalSession.sessionDate)} dias`
                : "Selecione duas sessões para comparar."}
            </p>
          </div>
          <span className="inline-flex w-fit items-center gap-2 rounded-full bg-[#e7f3ef] px-3 py-1 text-xs font-bold text-primary">
            <CalendarDays size={14} /> {sessions.length} sessões disponíveis
          </span>
        </div>
      </div>

      <div className="rounded-2xl border border-[#f1d3b9] bg-[#fffaf5] p-4 text-sm leading-6 text-[#8a4b1c]">
        {visualProgressNotice}
      </div>

      {sessions.length < 2 ? (
        <section className="card flex min-h-72 flex-col items-center justify-center p-8 text-center">
          <GitCompare className="text-primary" size={38} />
          <h2 className="mt-4 text-xl font-bold">Cadastre pelo menos duas sessões</h2>
          <p className="mt-2 max-w-lg text-sm leading-6 text-muted">
            A comparação visual precisa de uma sessão inicial e uma sessão final.
          </p>
          <Link href={`/alunos/${student.id}/evolucao-visual?nova=1`} className="btn-primary mt-5">Nova sessão de fotos</Link>
        </section>
      ) : (
        <>
          <VisualProgressComparisonSelectors
            studentId={student.id}
            sessions={sessionOptions}
            initialSessionId={initialSession?.id}
            finalSessionId={finalSession?.id}
          />

          {sameSession && (
            <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm font-semibold text-red-700">
              Selecione duas sessões diferentes para salvar uma comparação.
            </div>
          )}

          {!hasMetricData && (
            <div className="rounded-2xl border border-line bg-white p-4 text-sm leading-6 text-muted">
              Esta comparação não possui dados corporais completos vinculados. Vincule avaliações corporais às sessões para exibir métricas comparativas.
            </div>
          )}

          {hasMetricData && (
            <section className="card p-5 md:p-6">
              <h2 className="font-bold">Métricas corporais vinculadas</h2>
              <p className="mt-1 text-xs text-muted">Dados oficiais vindos das avaliações corporais vinculadas às sessões.</p>
              <div className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
                {metricRows.map(([label, key, suffix]) => (
                  <div key={key} className="rounded-2xl border border-line bg-[#fbfcfc] p-4">
                    <p className="text-xs font-bold text-muted">{label}</p>
                    <p className="mt-2 text-sm font-bold">{formatValue(initialAssessment?.[key], suffix)} → {formatValue(finalAssessment?.[key], suffix)}</p>
                    <p className="mt-1 text-xs text-muted">Diferença: <strong className="text-foreground">{formatDifference(initialAssessment?.[key], finalAssessment?.[key], suffix)}</strong></p>
                  </div>
                ))}
              </div>
            </section>
          )}

          {initialSession && finalSession && (
            <>
              <section className="space-y-4">
                <div>
                  <h2 className="text-xl font-bold">Fotos lado a lado</h2>
                  <p className="mt-1 text-sm text-muted">Comparação por ângulo, sem análise automática por imagem.</p>
                </div>
                {visualPhotoAngles.map((angle) => (
                  <AngleComparison key={angle} angle={angle} initialSession={initialSession} finalSession={finalSession} />
                ))}
              </section>

              {!sameSession && (
                <VisualProgressProfessionalReview
                  studentId={student.id}
                  initialSessionId={initialSession.id}
                  finalSessionId={finalSession.id}
                  initialPerception={existingComparison?.visualPerception}
                  initialComment={existingComparison?.professionalComment}
                />
              )}
            </>
          )}
        </>
      )}
    </div>
  );
}

function AngleComparison({
  angle,
  initialSession,
  finalSession,
}: {
  angle: VisualPhotoAngleValue;
  initialSession: ComparisonSession;
  finalSession: ComparisonSession;
}) {
  const initialPhoto = initialSession.photos.find((photo) => photo.angle === angle);
  const finalPhoto = finalSession.photos.find((photo) => photo.angle === angle);
  return (
    <section className="card overflow-hidden">
      <div className="border-b border-line bg-[#fbfcfc] px-5 py-4">
        <h3 className="font-bold">{visualPhotoAngleLabels[angle]}</h3>
      </div>
      <div className="grid gap-px bg-line md:grid-cols-2">
        <PhotoPanel label="Antes" date={initialSession.sessionDate} photo={initialPhoto} />
        <PhotoPanel label="Depois" date={finalSession.sessionDate} photo={finalPhoto} />
      </div>
    </section>
  );
}

function PhotoPanel({
  label,
  date,
  photo,
}: {
  label: string;
  date: Date;
  photo?: ComparisonSession["photos"][number];
}) {
  return (
    <div className="bg-white p-4">
      <div className="mb-3 flex items-center justify-between">
        <p className="text-xs font-bold uppercase tracking-[0.14em] text-accent">{label}</p>
        <p className="text-xs font-bold text-muted">{formatVisualDate(date)}</p>
      </div>
      {photo ? (
        <div className="relative aspect-[4/3] overflow-hidden rounded-2xl bg-[#f4f7f5]">
          <Image src={photo.fileUrl} alt={photo.fileName} fill sizes="720px" className="object-contain" unoptimized loading="lazy" />
        </div>
      ) : (
        <div className="flex aspect-[4/3] items-center justify-center rounded-2xl bg-[#f4f7f5] px-6 text-center text-sm text-muted">
          Foto não registrada para este ângulo.
        </div>
      )}
    </div>
  );
}
