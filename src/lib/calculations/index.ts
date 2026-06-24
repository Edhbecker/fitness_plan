export type CalculationSex = "HOMEM" | "MULHER" | "OUTRO" | "NAO_INFORMADO";

export type Skinfolds = {
  chestSkinfold?: number | null;
  axillarySkinfold?: number | null;
  tricepsSkinfold?: number | null;
  subscapularSkinfold?: number | null;
  abdominalSkinfold?: number | null;
  suprailiacSkinfold?: number | null;
  thighSkinfold?: number | null;
};

export type WorkoutStatus = "COMPLETED" | "PARTIAL" | "MISSED";

export const requiredSkinfolds: (keyof Skinfolds)[] = [
  "chestSkinfold",
  "axillarySkinfold",
  "tricepsSkinfold",
  "subscapularSkinfold",
  "abdominalSkinfold",
  "suprailiacSkinfold",
  "thighSkinfold",
];

const round = (value: number, digits = 2) => {
  const factor = 10 ** digits;
  return Math.round((value + Number.EPSILON) * factor) / factor;
};

const isFiniteNumber = (value: number) => Number.isFinite(value);

export function calculateAge(birthDate: Date, atDate = new Date()) {
  if (
    Number.isNaN(birthDate.getTime()) ||
    Number.isNaN(atDate.getTime()) ||
    birthDate > atDate
  ) {
    throw new RangeError("A data de nascimento deve ser válida e não pode estar no futuro.");
  }

  let age = atDate.getFullYear() - birthDate.getFullYear();
  const monthDifference = atDate.getMonth() - birthDate.getMonth();
  if (
    monthDifference < 0 ||
    (monthDifference === 0 && atDate.getDate() < birthDate.getDate())
  ) {
    age -= 1;
  }
  return age;
}

export function calculateBasalMetabolicRate(
  sex: CalculationSex,
  weightKg: number,
  heightCm: number,
  age: number,
) {
  if (
    !isFiniteNumber(weightKg) ||
    !isFiniteNumber(heightCm) ||
    !isFiniteNumber(age) ||
    weightKg <= 0 ||
    heightCm <= 0 ||
    age < 0
  ) {
    return null;
  }
  if (sex === "HOMEM") {
    return round(88.362 + 13.397 * weightKg + 4.799 * heightCm - 5.677 * age);
  }
  if (sex === "MULHER") {
    return round(447.593 + 9.247 * weightKg + 3.098 * heightCm - 4.33 * age);
  }
  return null;
}

export function calculateSkinfoldSum(skinfolds: Skinfolds) {
  const missing = requiredSkinfolds.filter((key) => {
    const value = skinfolds[key];
    return value === null || value === undefined || !isFiniteNumber(value) || value < 0;
  });
  if (missing.length > 0) return { value: null, missing };
  const value = requiredSkinfolds.reduce(
    (total, key) => total + Number(skinfolds[key]),
    0,
  );
  return { value: round(value), missing: [] };
}

export function calculateBodyDensity(
  sex: CalculationSex,
  skinfoldSum: number,
  age: number,
) {
  if (
    !isFiniteNumber(skinfoldSum) ||
    !isFiniteNumber(age) ||
    skinfoldSum < 0 ||
    age < 0
  ) {
    return null;
  }
  if (sex === "HOMEM") {
    return round(
      1.112 -
        0.00043499 * skinfoldSum +
        0.00000055 * skinfoldSum ** 2 -
        0.00028826 * age,
      5,
    );
  }
  if (sex === "MULHER") {
    return round(
      1.097 -
        0.00046971 * skinfoldSum +
        0.00000056 * skinfoldSum ** 2 -
        0.00012828 * age,
      5,
    );
  }
  return null;
}

export function calculateBodyFatPercentage(bodyDensity: number) {
  if (!isFiniteNumber(bodyDensity) || bodyDensity <= 0) return null;
  const percentage = round(495 / bodyDensity - 450);
  return percentage >= 0 && percentage <= 100 ? percentage : null;
}

export function calculateFatMass(weightKg: number, bodyFatPercentage: number) {
  if (
    !isFiniteNumber(weightKg) ||
    !isFiniteNumber(bodyFatPercentage) ||
    weightKg <= 0 ||
    bodyFatPercentage < 0 ||
    bodyFatPercentage > 100
  ) {
    return null;
  }
  return round(weightKg * (bodyFatPercentage / 100));
}

export function calculateLeanMass(weightKg: number, fatMassKg: number) {
  if (
    !isFiniteNumber(weightKg) ||
    !isFiniteNumber(fatMassKg) ||
    weightKg <= 0 ||
    fatMassKg < 0 ||
    fatMassKg > weightKg
  ) {
    return null;
  }
  return round(weightKg - fatMassKg);
}

export function calculateTrainingVolume(sets: number, reps: number, loadKg: number) {
  if (
    !isFiniteNumber(sets) ||
    !isFiniteNumber(reps) ||
    !isFiniteNumber(loadKg) ||
    sets < 0 ||
    reps < 0 ||
    loadKg < 0
  ) {
    return 0;
  }
  return round(sets * reps * loadKg);
}

export function calculateEstimatedOneRm(loadKg: number, reps: number) {
  if (!isFiniteNumber(loadKg) || !isFiniteNumber(reps) || loadKg <= 0 || reps < 0) {
    return null;
  }
  return round(loadKg * (1 + 0.0333 * reps));
}

export function calculateIntensityPercentage(
  loadKg: number,
  estimatedOneRmKg?: number | null,
  registeredOneRmKg?: number | null,
) {
  const oneRm = registeredOneRmKg || estimatedOneRmKg;
  if (
    !isFiniteNumber(loadKg) ||
    loadKg < 0 ||
    !oneRm ||
    !isFiniteNumber(oneRm) ||
    oneRm <= 0
  ) {
    return null;
  }
  return round((loadKg / oneRm) * 100);
}

export function calculateWeeklyAdherence(
  plannedSessions: number,
  statuses: WorkoutStatus[],
) {
  if (!Number.isInteger(plannedSessions) || plannedSessions <= 0) return 0;
  const score = statuses.reduce((total, status) => {
    if (status === "COMPLETED") return total + 1;
    if (status === "PARTIAL") return total + 0.5;
    return total;
  }, 0);
  return Math.min(round((score / plannedSessions) * 100), 100);
}

export function calculateWeeklyTrainingSummary(
  planned: { volume: number; intensityPercentage?: number | null }[],
  performed: { volume: number; intensityPercentage?: number | null }[],
) {
  const average = (items: { intensityPercentage?: number | null }[]) => {
    const valid = items
      .map((item) => item.intensityPercentage)
      .filter((value): value is number => value !== null && value !== undefined);
    return valid.length ? round(valid.reduce((a, b) => a + b, 0) / valid.length) : null;
  };
  return {
    plannedVolume: round(planned.reduce((sum, item) => sum + item.volume, 0)),
    performedVolume: round(performed.reduce((sum, item) => sum + item.volume, 0)),
    plannedAverageIntensity: average(planned),
    performedAverageIntensity: average(performed),
  };
}
