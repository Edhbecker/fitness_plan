import Link from "next/link";
import { Activity, ArrowRight, CalendarDays, CircleAlert, Dumbbell, TrendingUp, Users } from "lucide-react";
import { auth } from "@/auth";
import { TrainingChart } from "@/components/charts/training-chart";
import { TodayLabel } from "@/components/today-label";
import { StatCard } from "@/components/ui/stat-card";
import { requireTrainerId } from "@/lib/auth/require-trainer";
import { getDashboardForTrainer } from "@/services/dashboard";

export default async function DashboardPage() {
  const session = await auth();
  const data = await getDashboardForTrainer(await requireTrainerId());

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div><TodayLabel /><h1 className="mt-2 text-3xl font-bold tracking-tight">Olá, {session?.user?.name?.split(/\s+/)[0] ?? "profissional"}.</h1><p className="mt-1 text-sm text-muted">Aqui está o pulso dos seus alunos hoje.</p></div>
        <Link href="/alunos/novo" className="btn-primary"><Users size={17} /> Novo aluno</Link>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Alunos ativos" value={String(data.activeStudents)} detail={`+${data.newThisMonth} neste mês`} icon={Users} />
        <StatCard label="Sessões na semana" value={String(data.weeklySessions)} detail={`${data.completedWeeklySessions} já concluídas`} icon={CalendarDays} tone="blue" />
        <StatCard label="Aderência média" value={`${data.adherence}%`} detail="nos ciclos em acompanhamento" icon={TrendingUp} />
        <StatCard label="Volume realizado" value={`${Math.round(data.totalPerformedVolume / 1000)} mil kg`} detail="nos ciclos atuais" icon={Dumbbell} tone="orange" />
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.6fr_0.8fr]">
        <section className="card p-5 md:p-6">
          <div className="mb-4 flex items-start justify-between"><div><h2 className="font-bold">Evolução do treinamento</h2><p className="mt-1 text-xs text-muted">Volume planejado x realizado por semana</p></div><span className="rounded-full bg-[#e7f3ef] px-3 py-1 text-[11px] font-bold text-primary">Ciclos atuais</span></div>
          {data.training.length ? <TrainingChart data={data.training} /> : <EmptyState text="Crie uma periodização para visualizar a evolução." />}
        </section>
        <section className="card p-5 md:p-6">
          <div className="flex items-center justify-between"><div><h2 className="font-bold">Pontos de atenção</h2><p className="mt-1 text-xs text-muted">Prioridades para revisar</p></div><CircleAlert size={19} className="text-accent" /></div>
          <div className="mt-5 space-y-3">{data.attention.map((item) => <Link href={`/alunos/${item.studentId}`} key={`${item.studentId}-${item.detail}`} className="block rounded-2xl border border-line p-4 hover:bg-[#fbfcfc]"><div className="flex items-start gap-3"><span className={`mt-1 size-2 rounded-full ${item.tone === "red" ? "bg-red-500" : "bg-accent"}`} /><div><p className="text-sm font-bold">{item.name}</p><p className="mt-1 text-xs text-muted">{item.detail}</p></div></div></Link>)}{data.attention.length === 0 && <p className="text-xs text-muted">Nenhum ponto urgente identificado.</p>}</div>
        </section>
      </div>

      <section className="card overflow-hidden">
        <div className="flex items-center justify-between border-b border-line px-5 py-4 md:px-6"><div><h2 className="font-bold">Alunos em acompanhamento</h2><p className="mt-1 text-xs text-muted">Resumo dos ciclos ativos</p></div><Link href="/alunos" className="btn-secondary">Ver todos <ArrowRight size={14} /></Link></div>
        {data.students.length ? <div className="overflow-x-auto"><table className="w-full min-w-[700px] text-left text-sm"><thead className="bg-[#f8faf9] text-[10px] uppercase tracking-wider text-muted"><tr><th className="px-6 py-3">Aluno</th><th>Objetivo</th><th>Frequência</th><th>Aderência</th><th>Último peso</th><th /></tr></thead><tbody>{data.students.map((student) => <tr key={student.id} className="border-t border-line/70"><td className="px-6 py-4"><div className="flex items-center gap-3"><span className="flex size-9 items-center justify-center rounded-xl bg-[#e7f3ef] text-xs font-bold text-primary">{student.initials}</span><strong>{student.name}</strong></div></td><td>{student.objective}</td><td>{student.frequency}x por semana</td><td><span className="font-bold text-primary">{student.adherence}%</span></td><td>{student.latestWeight === null ? "Sem avaliação" : `${student.latestWeight} kg`}</td><td className="pr-6 text-right"><Link href={`/alunos/${student.id}`} className="text-xs font-bold text-primary">Abrir perfil</Link></td></tr>)}</tbody></table></div> : <div className="p-8 text-center text-sm text-muted">Cadastre seu primeiro aluno para iniciar o acompanhamento.</div>}
      </section>

      <div className="flex items-start gap-3 rounded-2xl border border-[#d5e6e1] bg-[#eaf4f1] p-4 text-xs leading-5 text-[#42645c]"><Activity size={17} className="mt-0.5 shrink-0" />As informações registradas devem ser analisadas por profissional habilitado. O sistema organiza dados e cálculos de acompanhamento e não realiza diagnóstico médico ou decisão clínica.</div>
    </div>
  );
}

function EmptyState({ text }: { text: string }) {
  return <div className="flex h-[285px] items-center justify-center rounded-xl bg-[#f3f7f5] text-sm text-muted">{text}</div>;
}
