"use client";

import Image from "next/image";
import { CheckCircle2, ImagePlus, Save, Trash2, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import {
  createVisualProgressSessionAction,
  updateVisualProgressSessionAction,
} from "@/app/actions/visual-progress";
import {
  visualPhotoAngleLabels,
  visualPhotoAngles,
  visualProgressAllowedMimeTypes,
  type VisualPhotoAngleValue,
} from "@/lib/visual-progress";

export type VisualProgressAssessmentOption = {
  id: string;
  label: string;
};

export type VisualProgressSessionFormInitial = {
  id: string;
  sessionDate: string;
  bodyAssessmentId: string | null;
  weightKg: number | null;
  notes: string | null;
  photos: Array<{
    id: string;
    angle: VisualPhotoAngleValue;
    fileUrl: string;
    thumbnailUrl: string;
    fileName: string;
  }>;
};

export function VisualProgressSessionForm({
  studentId,
  assessments,
  initialSession,
}: {
  studentId: string;
  assessments: VisualProgressAssessmentOption[];
  initialSession?: VisualProgressSessionFormInitial;
}) {
  const router = useRouter();
  const fileRefs = useRef<Record<string, HTMLInputElement | null>>({});
  const [message, setMessage] = useState("");
  const [success, setSuccess] = useState(false);
  const [saving, setSaving] = useState(false);
  const [bodyAssessmentMode, setBodyAssessmentMode] = useState(initialSession?.bodyAssessmentId ? "SELECT" : "NEAREST");
  const [removedPhotos, setRemovedPhotos] = useState<string[]>([]);
  const [previews, setPreviews] = useState<Partial<Record<VisualPhotoAngleValue, string>>>({});
  const editing = Boolean(initialSession);

  useEffect(() => {
    return () => {
      Object.values(previews).forEach((url) => {
        if (url) URL.revokeObjectURL(url);
      });
    };
  }, [previews]);

  function existingPhoto(angle: VisualPhotoAngleValue) {
    return initialSession?.photos.find((photo) => photo.angle === angle && !removedPhotos.includes(photo.id));
  }

  function setFilePreview(angle: VisualPhotoAngleValue, file?: File) {
    setPreviews((current) => {
      if (current[angle]) URL.revokeObjectURL(current[angle]);
      return { ...current, [angle]: file ? URL.createObjectURL(file) : undefined };
    });
  }

  function clearFile(angle: VisualPhotoAngleValue) {
    const input = fileRefs.current[angle];
    if (input) input.value = "";
    setFilePreview(angle);
  }

  function toggleRemovedPhoto(photoId: string) {
    setRemovedPhotos((current) => current.includes(photoId) ? current.filter((id) => id !== photoId) : [...current, photoId]);
  }

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage("");
    setSuccess(false);
    const formData = new FormData(event.currentTarget);
    const newPhotos = visualPhotoAngles.filter((angle) => {
      const file = formData.get(`photo_${angle}`);
      return file instanceof File && file.size > 0;
    }).length;
    const activeExisting = initialSession?.photos.filter((photo) => {
      const file = formData.get(`photo_${photo.angle}`);
      const replacing = file instanceof File && file.size > 0;
      return !removedPhotos.includes(photo.id) && !replacing;
    })?.length ?? 0;
    if (newPhotos + activeExisting < 1) {
      setMessage("Envie pelo menos uma foto da sessão.");
      return;
    }

    for (const photoId of removedPhotos) formData.append("removePhotoId", photoId);
    setSaving(true);
    const result = initialSession
      ? await updateVisualProgressSessionAction(studentId, initialSession.id, formData)
      : await createVisualProgressSessionAction(studentId, formData);
    setSaving(false);
    setSuccess(result.success);
    setMessage(result.message);
    if (result.success) {
      router.push(`/alunos/${studentId}/evolucao-visual`);
      router.refresh();
    }
  }

  return (
    <form onSubmit={submit} className="card p-5 md:p-7">
      <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-accent">
            {editing ? "Editar sessão" : "Nova sessão"}
          </p>
          <h2 className="mt-1 text-xl font-bold">{editing ? "Editar sessão de fotos" : "Cadastrar sessão de fotos"}</h2>
          <p className="mt-1 text-sm text-muted">Registre fotos por ângulo sem gerar análise automática por imagem.</p>
        </div>
        <button type="button" onClick={() => router.push(`/alunos/${studentId}/evolucao-visual`)} className="btn-secondary">
          <X size={16} /> Cancelar
        </button>
      </div>

      {message && (
        <div className={`mt-5 flex items-center gap-2 rounded-xl border px-4 py-3 text-sm font-semibold ${success ? "border-[#bddfd6] bg-[#e9f6f2] text-primary" : "border-red-200 bg-red-50 text-red-700"}`}>
          {success && <CheckCircle2 size={17} />} {message}
        </div>
      )}

      <div className="mt-6 grid gap-5 md:grid-cols-2">
        <label>
          <span className="label">Data da sessão</span>
          <input name="sessionDate" type="date" className="field" defaultValue={initialSession?.sessionDate} required />
        </label>
        <label>
          <span className="label">Peso no dia (opcional)</span>
          <input name="weightKg" type="number" min="0.1" step="0.1" className="field" defaultValue={initialSession?.weightKg ?? ""} placeholder="Ex.: 83.5" />
        </label>
        <label>
          <span className="label">Avaliação corporal vinculada</span>
          <select name="bodyAssessmentMode" className="field" value={bodyAssessmentMode} onChange={(event) => setBodyAssessmentMode(event.target.value)}>
            <option value="NEAREST">Usar avaliação mais próxima da data</option>
            <option value="SELECT">Selecionar avaliação existente</option>
            <option value="NONE">Nenhuma avaliação vinculada</option>
          </select>
        </label>
        {bodyAssessmentMode === "SELECT" && (
          <label>
            <span className="label">Selecione a avaliação</span>
            <select name="bodyAssessmentId" className="field" defaultValue={initialSession?.bodyAssessmentId ?? ""}>
              <option value="">Selecione</option>
              {assessments.map((assessment) => <option key={assessment.id} value={assessment.id}>{assessment.label}</option>)}
            </select>
          </label>
        )}
        <label className="md:col-span-2">
          <span className="label">Observações gerais</span>
          <textarea name="notes" className="field min-h-24 resize-y" defaultValue={initialSession?.notes ?? ""} placeholder="Contexto, postura, iluminação, orientação profissional..." />
        </label>
      </div>

      <div className="mt-7">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h3 className="font-bold">Fotos por ângulo</h3>
            <p className="mt-1 text-xs text-muted">JPG, PNG ou WEBP. Máximo de 5 MB por imagem.</p>
          </div>
          <ImagePlus className="text-primary" size={22} />
        </div>

        <div className="mt-4 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {visualPhotoAngles.map((angle) => {
            const currentPhoto = existingPhoto(angle);
            const preview = previews[angle];
            return (
              <div key={angle} className="rounded-2xl border border-line bg-[#fbfcfc] p-3">
                <div className="flex items-center justify-between gap-3">
                  <p className="text-sm font-bold">{visualPhotoAngleLabels[angle]}</p>
                  {currentPhoto && (
                    <button type="button" onClick={() => toggleRemovedPhoto(currentPhoto.id)} className="text-xs font-bold text-red-600 hover:text-red-700">
                      <Trash2 className="inline" size={13} /> Remover
                    </button>
                  )}
                </div>

                <div className="mt-3 flex aspect-[4/3] items-center justify-center overflow-hidden rounded-xl bg-[#edf3f1]">
                  {preview ? (
                    <Image src={preview} alt={`Preview ${visualPhotoAngleLabels[angle]}`} width={480} height={360} className="h-full w-full object-cover" unoptimized />
                  ) : currentPhoto ? (
                    <Image src={currentPhoto.thumbnailUrl} alt={currentPhoto.fileName} width={480} height={360} className="h-full w-full object-cover" unoptimized />
                  ) : (
                    <span className="px-4 text-center text-xs text-muted">Foto não selecionada</span>
                  )}
                </div>

                <div className="mt-3 flex flex-wrap items-center gap-2">
                  <label className="btn-secondary cursor-pointer text-xs">
                    {currentPhoto ? "Substituir foto" : "Selecionar foto"}
                    <input
                      ref={(element) => { fileRefs.current[angle] = element; }}
                      name={`photo_${angle}`}
                      type="file"
                      accept={visualProgressAllowedMimeTypes.join(",")}
                      className="sr-only"
                      onChange={(event) => setFilePreview(angle, event.target.files?.[0])}
                    />
                  </label>
                  {preview && (
                    <button type="button" onClick={() => clearFile(angle)} className="text-xs font-bold text-muted hover:text-primary">
                      Limpar seleção
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="mt-7 flex justify-end">
        <button type="submit" disabled={saving} className="btn-primary min-w-44 disabled:opacity-60">
          <Save size={16} /> {saving ? "Salvando..." : editing ? "Salvar sessão" : "Salvar sessão"}
        </button>
      </div>
    </form>
  );
}
