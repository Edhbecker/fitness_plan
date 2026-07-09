export const visualPhotoAngles = [
  "FRONT",
  "BACK",
  "RIGHT_SIDE",
  "LEFT_SIDE",
  "OPTIONAL_1",
  "OPTIONAL_2",
] as const;

export type VisualPhotoAngleValue = (typeof visualPhotoAngles)[number];

export const visualPhotoAngleLabels: Record<VisualPhotoAngleValue, string> = {
  FRONT: "Frente",
  BACK: "Costas",
  RIGHT_SIDE: "Lateral direita",
  LEFT_SIDE: "Lateral esquerda",
  OPTIONAL_1: "Opcional 1",
  OPTIONAL_2: "Opcional 2",
};

export const visualPerceptionLabels = {
  NO_PERCEPTIBLE_CHANGE: "Sem alteração perceptível",
  SLIGHT_EVOLUTION: "Leve evolução",
  MODERATE_EVOLUTION: "Evolução moderada",
  EVIDENT_EVOLUTION: "Evolução evidente",
} as const;

export const visualProgressNotice =
  "As imagens registradas são usadas apenas para acompanhamento visual pelo profissional habilitado. O sistema não realiza diagnóstico, medição automática ou análise corporal por imagem.";

export const visualProgressMaxFileSize = 5 * 1024 * 1024;

export const visualProgressAllowedMimeTypes = [
  "image/jpeg",
  "image/png",
  "image/webp",
] as const;

export function formatVisualDate(date: Date | string) {
  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date(date)).replace(".", "");
}

export function dateInputValue(date: Date) {
  return date.toISOString().slice(0, 10);
}
