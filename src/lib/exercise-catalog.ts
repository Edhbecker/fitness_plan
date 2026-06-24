import type { ExerciseType } from "@prisma/client";

export const starterExerciseCatalog: Array<{
  name: string;
  primaryMuscleGroup: string;
  equipment: string;
  type: ExerciseType;
}> = [
  { name: "Agachamento", primaryMuscleGroup: "Pernas", equipment: "Barra", type: "FORCA" },
  { name: "Supino reto", primaryMuscleGroup: "Peitoral", equipment: "Barra", type: "FORCA" },
  { name: "Supino inclinado", primaryMuscleGroup: "Peitoral", equipment: "Halteres", type: "FORCA" },
  { name: "Remada baixa", primaryMuscleGroup: "Costas", equipment: "Máquina", type: "FORCA" },
  { name: "Puxada frontal", primaryMuscleGroup: "Costas", equipment: "Máquina", type: "FORCA" },
  { name: "Barra fixa", primaryMuscleGroup: "Costas", equipment: "Peso corporal", type: "FORCA" },
  { name: "Elevação lateral", primaryMuscleGroup: "Ombros", equipment: "Halteres", type: "FORCA" },
  { name: "Desenvolvimento", primaryMuscleGroup: "Ombros", equipment: "Halteres", type: "FORCA" },
  { name: "Rosca direta", primaryMuscleGroup: "Bíceps", equipment: "Barra", type: "FORCA" },
  { name: "Rosca alternada", primaryMuscleGroup: "Bíceps", equipment: "Halteres", type: "FORCA" },
  { name: "Tríceps corda", primaryMuscleGroup: "Tríceps", equipment: "Polia", type: "FORCA" },
  { name: "Leg press", primaryMuscleGroup: "Pernas", equipment: "Máquina", type: "FORCA" },
  { name: "Cadeira extensora", primaryMuscleGroup: "Quadríceps", equipment: "Máquina", type: "FORCA" },
  { name: "Mesa flexora", primaryMuscleGroup: "Posteriores", equipment: "Máquina", type: "FORCA" },
  { name: "Stiff", primaryMuscleGroup: "Posteriores", equipment: "Barra", type: "FORCA" },
  { name: "Panturrilha em pé", primaryMuscleGroup: "Panturrilha", equipment: "Máquina", type: "FORCA" },
];
