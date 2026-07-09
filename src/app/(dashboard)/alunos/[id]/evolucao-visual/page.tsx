import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { CalendarDays, Camera, GitCompare, ImageIcon, Scale } from "lucide-react";
import { StudentProfileHeader } from "@/components/student-profile-header";
import { StatCard } from "@/components/ui/stat-card";
import { VisualProgressSessionActions } from "@/components/visual-progress/visual-progress-session-actions";
import { VisualProgressSessionForm, type VisualProgressSessionFormInitial } from "@/components/visual-progress/visual-progress-session-form";
import { requireTrainerId } from "@/lib/auth/require-trainer";
import {
  dateInputValue,
  formatVisualDate,
  visualPerceptionLabels,
  visualPhotoAngleLabels,
  visualPhotoAngles,
  visualProgressNotice,
  type VisualPhotoAngleValue,
} from "@/lib/visual-progress";
import { getVisualProgressPageForTrainer, toAssessmentOption } from "@/services/visual-progress";

function numberOrNull(value: unknown) {
  return value === null || value === undefined ? null : Number(value);
}

function daysBetween(start?: Date | null, end?: Date | null) {
  if (!start || !end) return 0;
  return Math.max(0, Math.ceil((end.getTime() - start.getTime()) / 86_400_000));
}

function toFormInitial(session: NonNullable<Awaited<ReturnType<typeof getVisualProgressPageForTrainer>>>["visualProgressSessions"][number]): VisualProgressSessionFormInitial {
  return {
    id: session.id,
    sessionDate: dateInputValue(session.sessionDate),
    bodyAssessmentId: session.bodyAssessmentId,
    weightKg: numberOrNull(session.weightKg),
    notes: session.notes,
    photos: session.photos.map((photo) => ({
      id: photo.id,
      angle: photo.angle as VisualPhotoAngleValue,
      fileUrl: photo.fileUrl,
      thumbnailUrl: photo.thumbnailUrl,
      fileName: photo.fileName,
    })),
  };
}

function metricDelta(initial?: unknown | null, final?: unknown | null, suffix = "") {
  if (initial === null || initial === undefined || final === null || final === undefined) return null;
  const delta = Number(final) - Number(initial);
  const sign = delta > 0 ? "+" : "";
  return `${sign}${delta.toFixed(1)}${suffix}`;
}

function VisualSummaryCard({
  comparison,
}: {
  comparison: NonNullable<Awaited<ReturnType<typeof getVisualProgressPageForTrainer>>>["visualProgressComparisons"][number] | undefined;
}) {
  const initial = comparison?.initialSession.bodyAssessment;
  const final = comparison?.finalSession.bodyAssessment;
  const hasMetrics = Boolean(initial && final);
  return (
    <section className="card p-5 md:p-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-accent">Resumo da evolução visual</p>
          <h2 className="mt-1 font-bold">Última comparação</h2>
        </div>
        <GitCompare className="text-primary" size={22} />
      </div>
      {!hasMetrics ? (
        <p className="mt-4 text-sm leading-6 text-muted">
          Cadastre pelo menos duas sessões com avaliações corporais vinculadas para gerar um resumo comparativo.
        </p>
      ) : (
        <div className="mt-4 grid gap-3 text-sm sm:grid-cols-2 xl:grid-cols-4">
          <MetricPill label="Peso" value={metricDelta(initial?.weightKg, final?.weightKg, " kg")} />
          <MetricPill label="Gordura corporal" value={metricDelta(initial?.bodyFatPercentage, final?.bodyFatPercentage, " p.p.")} />
          <MetricPill label="Massa magra" value={metricDelta(initial?.leanMassKg, final?.leanMassKg, " kg")} />
          <MetricPill label="Cintura" value={metricDelta(initial?.waistCircumference, final?.waistCircumference, " cm")} />
          <div className="rounded-xl bg-[#f4f7f5] p-3 sm:col-span-2 xl:col-span-4">
            <p className="text-xs font-bold text-muted">Percepção visual</p>
            <p className="mt-1 font-bold">{comparison?.visualPerception ? visualPerceptionLabels[comparison.visualPerception] : "Não informada"}</p>
          </div>
        </div>
      )}
    </section>
  );
}

function MetricPill({ label, value }: { label: string; value: string | null }) {
  return (
    <div className="rounded-xl bg-[#f4f7f5] p-3">
      <p className="text-xs font-bold text-muted">{label}</p>
      <p className="mt-1 font-bold">{value ?? "Sem dados"}</p>
    </div>
  );
}

export default async function VisualProgressPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams?: Promise<{ nova?: string; editar?: string; sessao?: string }>;
}) {
  const { id } = await params;
  const query = searchParams ? await searchParams : {};
  const student = await getVisualProgressPageForTrainer(await requireTrainerId(), id);
  if (!student) notFound();

  const sessions = student.visualProgressSessions;
  const latestSession = sessions[0] ?? null;
  const firstSession = sessions.at(-1) ?? null;
  const latestWithAssessment = sessions.find((session) => session.bodyAssessment);
  const latestComparison = student.visualProgressComparisons[0];
  const editingSession = query.editar ? sessions.find((session) => session.id === query.editar) : undefined;
  const viewingSession = query.sessao ? sessions.find((session) => session.id === query.sessao) : undefined;
  const showForm = query.nova === "1" || Boolean(editingSession);
  const assessments = student.assessments.map(toAssessmentOption);

  return (
    <div className="space-y-6">
      <StudentProfileHeader student={student} activeTab="visual" />

      <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-accent">Fotos de evolução</p>
          <h1 className="mt-1 text-3xl font-bold tracking-tight">Evolução visual</h1>
          <p className="mt-1 text-sm text-muted">Histórico visual por data e comparação lado a lado entre sessões.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link href={`/alunos/${student.id}/evolucao-visual?nova=1`} className="btn-primary">
            <Camera size={16} /> Nova sessão de fotos
          </Link>
          <Link href={`/alunos/${student.id}/evolucao-visual/comparar`} className="btn-secondary">
            <GitCompare size={16} /> Comparar sessões
          </Link>
        </div>
      </div>

      <div className="rounded-2xl border border-[#f1d3b9] bg-[#fffaf5] p-4 text-sm leading-6 text-[#8a4b1c]">
        {visualProgressNotice}
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Total de sessões" value={String(sessions.length)} detail="Histórico visual do aluno" icon={ImageIcon} />
        <StatCard label="Primeira sessão" value={firstSession ? formatVisualDate(firstSession.sessionDate) : "Sem registros"} detail="Início do acompanhamento" icon={CalendarDays} tone="orange" />
        <StatCard label="Última sessão" value={latestSession ? formatVisualDate(latestSession.sessionDate) : "Sem registros"} detail="Último registro" icon={Camera} />
        <StatCard label="Dias de acompanhamento" value={`${daysBetween(firstSession?.sessionDate, latestSession?.sessionDate)} dias`} detail={latestWithAssessment ? `Com avaliação em ${formatVisualDate(latestWithAssessment.sessionDate)}` : "Sem avaliação vinculada"} icon={Scale} tone="blue" />
      </div>

      <VisualSummaryCard comparison={latestComparison} />

      {showForm && (
        <VisualProgressSessionForm
          studentId={student.id}
          assessments={assessments}
          initialSession={editingSession ? toFormInitial(editingSession) : undefined}
        />
      )}

      {viewingSession && <SessionDetail session={viewingSession} />}

      {sessions.length === 0 && !showForm ? (
        <section className="card flex min-h-72 flex-col items-center justify-center p-8 text-center">
          <Camera className="text-primary" size={38} />
          <h2 className="mt-4 text-xl font-bold">Nenhuma sessão de fotos registrada</h2>
          <p className="mt-2 max-w-lg text-sm leading-6 text-muted">
            Cadastre fotos do aluno para acompanhar a evolução visual ao longo do processo.
          </p>
          <Link href={`/alunos/${student.id}/evolucao-visual?nova=1`} className="btn-primary mt-5">
            Cadastrar primeira sessão
          </Link>
        </section>
      ) : (
        <section className="space-y-4">
          <div>
            <h2 className="text-xl font-bold">Histórico de sessões</h2>
            <p className="mt-1 text-sm text-muted">Sessões exibidas da mais recente para a mais antiga.</p>
          </div>
          <div className="grid gap-4 xl:grid-cols-2">
            {sessions.map((session) => <SessionCard key={session.id} session={session} studentId={student.id} />)}
          </div>
        </section>
      )}
    </div>
  );
}

function SessionCard({
  session,
  studentId,
}: {
  session: NonNullable<Awaited<ReturnType<typeof getVisualProgressPageForTrainer>>>["visualProgressSessions"][number];
  studentId: string;
}) {
  return (
    <article className="card p-5">
      <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-accent">Sessão visual</p>
          <h3 className="mt-1 text-lg font-bold">{formatVisualDate(session.sessionDate)}</h3>
          <p className="mt-1 text-xs text-muted">
            {session.weightKg ? `${Number(session.weightKg)} kg · ` : ""}
            {session.bodyAssessment ? `Avaliação vinculada em ${formatVisualDate(session.bodyAssessment.assessmentDate)}` : "Esta sessão não possui avaliação corporal vinculada."}
          </p>
        </div>
        <VisualProgressSessionActions studentId={studentId} sessionId={session.id} />
      </div>

      {session.notes && <p className="mt-4 rounded-xl bg-[#f4f7f5] p-3 text-sm leading-6 text-muted">{session.notes}</p>}

      <div className="mt-4 grid grid-cols-2 gap-3 md:grid-cols-3">
        {session.photos.map((photo) => (
          <div key={photo.id} className="overflow-hidden rounded-xl border border-line bg-[#f4f7f5]">
            <div className="relative aspect-[4/3]">
              <Image src={photo.thumbnailUrl} alt={photo.fileName} fill sizes="220px" className="object-cover" unoptimized loading="lazy" />
            </div>
            <div className="px-3 py-2 text-[11px] font-bold text-muted">{visualPhotoAngleLabels[photo.angle as VisualPhotoAngleValue]}</div>
          </div>
        ))}
      </div>
      <p className="mt-3 text-xs font-bold text-muted">{session.photos.length} foto(s) registrada(s)</p>
    </article>
  );
}

function SessionDetail({
  session,
}: {
  session: NonNullable<Awaited<ReturnType<typeof getVisualProgressPageForTrainer>>>["visualProgressSessions"][number];
}) {
  return (
    <section className="card p-5 md:p-6">
      <div className="flex flex-col gap-2 md:flex-row md:items-start md:justify-between">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-accent">Detalhes da sessão</p>
          <h2 className="mt-1 text-xl font-bold">{formatVisualDate(session.sessionDate)}</h2>
          <p className="mt-1 text-sm text-muted">
            {session.bodyAssessment ? `Avaliação vinculada: ${formatVisualDate(session.bodyAssessment.assessmentDate)}` : "Esta sessão não possui avaliação corporal vinculada."}
          </p>
        </div>
        {session.weightKg && <span className="rounded-full bg-[#e7f3ef] px-3 py-1 text-xs font-bold text-primary">{Number(session.weightKg)} kg</span>}
      </div>
      {session.notes && <p className="mt-4 rounded-xl bg-[#f4f7f5] p-4 text-sm leading-6 text-muted">{session.notes}</p>}
      <div className="mt-5 grid gap-4 md:grid-cols-2">
        {visualPhotoAngles.map((angle) => {
          const photo = session.photos.find((item) => item.angle === angle);
          return (
            <div key={angle} className="rounded-2xl border border-line bg-white p-3">
              <p className="mb-3 text-sm font-bold">{visualPhotoAngleLabels[angle]}</p>
              {photo ? (
                <div className="relative aspect-[4/3] overflow-hidden rounded-xl bg-[#f4f7f5]">
                  <Image src={photo.fileUrl} alt={photo.fileName} fill sizes="560px" className="object-contain" unoptimized loading="lazy" />
                </div>
              ) : (
                <div className="flex aspect-[4/3] items-center justify-center rounded-xl bg-[#f4f7f5] px-5 text-center text-sm text-muted">
                  Foto não registrada para este ângulo.
                </div>
              )}
            </div>
          );
        })}
      </div>
    </section>
  );
}
