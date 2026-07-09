"use client";

import Link from "next/link";
import { Eye, GitCompare, Pencil, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { deleteVisualProgressSessionAction } from "@/app/actions/visual-progress";

export function VisualProgressSessionActions({
  studentId,
  sessionId,
}: {
  studentId: string;
  sessionId: string;
}) {
  const router = useRouter();
  const [deleting, setDeleting] = useState(false);
  const [message, setMessage] = useState("");

  async function removeSession() {
    if (!confirm("Excluir esta sessão de fotos? Ela deixará de aparecer no histórico, mas será preservada para auditoria.")) return;
    setDeleting(true);
    setMessage("");
    const result = await deleteVisualProgressSessionAction(studentId, sessionId);
    setDeleting(false);
    setMessage(result.success ? "" : result.message);
    if (result.success) router.refresh();
  }

  return (
    <div>
      <div className="flex flex-wrap gap-2">
        <Link href={`/alunos/${studentId}/evolucao-visual?sessao=${sessionId}`} className="btn-secondary text-xs">
          <Eye size={14} /> Visualizar
        </Link>
        <Link href={`/alunos/${studentId}/evolucao-visual/comparar?final=${sessionId}`} className="btn-secondary text-xs">
          <GitCompare size={14} /> Comparar
        </Link>
        <Link href={`/alunos/${studentId}/evolucao-visual?editar=${sessionId}`} className="btn-secondary text-xs">
          <Pencil size={14} /> Editar
        </Link>
        <button type="button" onClick={removeSession} disabled={deleting} className="inline-flex items-center gap-1 rounded-xl px-3 py-2 text-xs font-bold text-red-600 hover:bg-red-50 disabled:opacity-60">
          <Trash2 size={14} /> {deleting ? "Excluindo..." : "Excluir"}
        </button>
      </div>
      {message && <p className="mt-2 text-xs font-semibold text-red-600">{message}</p>}
    </div>
  );
}
