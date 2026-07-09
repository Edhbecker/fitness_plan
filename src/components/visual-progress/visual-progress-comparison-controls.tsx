"use client";

import { Save } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { saveVisualProgressComparisonAction } from "@/app/actions/visual-progress";
import { visualPerceptionLabels } from "@/lib/visual-progress";

type SessionOption = {
  id: string;
  label: string;
};

export function VisualProgressComparisonSelectors({
  studentId,
  sessions,
  initialSessionId,
  finalSessionId,
}: {
  studentId: string;
  sessions: SessionOption[];
  initialSessionId?: string;
  finalSessionId?: string;
}) {
  const router = useRouter();

  function update(next: { initial?: string; final?: string }) {
    const params = new URLSearchParams();
    params.set("inicial", next.initial ?? initialSessionId ?? "");
    params.set("final", next.final ?? finalSessionId ?? "");
    router.push(`/alunos/${studentId}/evolucao-visual/comparar?${params.toString()}`);
  }

  return (
    <div className="card grid gap-4 p-5 md:grid-cols-2">
      <label>
        <span className="label">Sessão inicial</span>
        <select className="field" value={initialSessionId ?? ""} onChange={(event) => update({ initial: event.target.value })}>
          {sessions.map((session) => <option key={session.id} value={session.id}>{session.label}</option>)}
        </select>
      </label>
      <label>
        <span className="label">Sessão final</span>
        <select className="field" value={finalSessionId ?? ""} onChange={(event) => update({ final: event.target.value })}>
          {sessions.map((session) => <option key={session.id} value={session.id}>{session.label}</option>)}
        </select>
      </label>
    </div>
  );
}

export function VisualProgressProfessionalReview({
  studentId,
  initialSessionId,
  finalSessionId,
  initialPerception,
  initialComment,
}: {
  studentId: string;
  initialSessionId: string;
  finalSessionId: string;
  initialPerception?: string | null;
  initialComment?: string | null;
}) {
  const [visualPerception, setVisualPerception] = useState(initialPerception ?? "");
  const [professionalComment, setProfessionalComment] = useState(initialComment ?? "");
  const [message, setMessage] = useState("");
  const [success, setSuccess] = useState(false);
  const [saving, setSaving] = useState(false);

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setMessage("");
    setSuccess(false);
    const result = await saveVisualProgressComparisonAction(studentId, {
      initialSessionId,
      finalSessionId,
      visualPerception: visualPerception || null,
      professionalComment,
    });
    setSaving(false);
    setSuccess(result.success);
    setMessage(result.message);
  }

  return (
    <form onSubmit={submit} className="card p-5 md:p-6">
      <h2 className="font-bold">Análise manual do personal</h2>
      <p className="mt-1 text-xs text-muted">Registre apenas sua percepção profissional. O sistema não calcula evolução por imagem.</p>
      {message && <div className={`mt-4 rounded-xl border px-4 py-3 text-sm font-semibold ${success ? "border-[#bddfd6] bg-[#e9f6f2] text-primary" : "border-red-200 bg-red-50 text-red-700"}`}>{message}</div>}
      <div className="mt-5 grid gap-4 md:grid-cols-2">
        <label>
          <span className="label">Percepção visual do personal</span>
          <select className="field" value={visualPerception} onChange={(event) => setVisualPerception(event.target.value)}>
            <option value="">Não informar agora</option>
            {Object.entries(visualPerceptionLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
          </select>
        </label>
        <label className="md:col-span-2">
          <span className="label">Comentário profissional sobre a evolução visual</span>
          <textarea className="field min-h-28 resize-y" value={professionalComment} onChange={(event) => setProfessionalComment(event.target.value)} placeholder="Ex.: melhora visual em definição abdominal, postura e volume..." />
        </label>
      </div>
      <div className="mt-5 flex justify-end">
        <button type="submit" className="btn-primary" disabled={saving}>
          <Save size={16} /> {saving ? "Salvando..." : "Salvar análise"}
        </button>
      </div>
    </form>
  );
}
