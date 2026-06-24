import { addDays, isMonday, isValid } from "date-fns";

export const dayNames = [
  "MONDAY",
  "TUESDAY",
  "WEDNESDAY",
  "THURSDAY",
  "FRIDAY",
  "SATURDAY",
  "SUNDAY",
] as const;

export type GeneratedTrainingDay = {
  dayOfWeek: (typeof dayNames)[number];
  date: Date;
  isRestDay: boolean;
};

export type GeneratedTrainingWeek = {
  weekNumber: number;
  startDate: Date;
  endDate: Date;
  days: GeneratedTrainingDay[];
};

export function generatePeriodizationCalendar(startDate: Date, totalWeeks = 12) {
  if (!isValid(startDate)) {
    throw new Error("A data inicial da periodização deve ser válida.");
  }
  if (!isMonday(startDate)) {
    throw new Error("A data inicial da periodização deve ser uma segunda-feira.");
  }
  if (totalWeeks <= 0 || !Number.isInteger(totalWeeks)) {
    throw new Error("O total de semanas deve ser um inteiro maior que zero.");
  }

  const weeks: GeneratedTrainingWeek[] = Array.from({ length: totalWeeks }, (_, weekIndex) => {
    const weekStart = addDays(startDate, weekIndex * 7);
    return {
      weekNumber: weekIndex + 1,
      startDate: weekStart,
      endDate: addDays(weekStart, 6),
      days: dayNames.map((dayOfWeek, dayIndex) => ({
        dayOfWeek,
        date: addDays(weekStart, dayIndex),
        isRestDay: false,
      })),
    };
  });

  return {
    startDate,
    endDate: addDays(startDate, totalWeeks * 7 - 1),
    totalWeeks,
    weeks,
  };
}
