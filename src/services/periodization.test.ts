import { describe, expect, it } from "vitest";
import { generatePeriodizationCalendar } from "./periodization";

describe("generatePeriodizationCalendar", () => {
  it("gera 12 semanas e 7 dias por semana", () => {
    const result = generatePeriodizationCalendar(new Date("2026-06-15T12:00:00"), 12);
    expect(result.weeks).toHaveLength(12);
    expect(result.weeks.every((week) => week.days.length === 7)).toBe(true);
    expect(result.weeks[11].weekNumber).toBe(12);
    expect(result.endDate.toISOString().slice(0, 10)).toBe("2026-09-06");
  });

  it("rejeita duração inválida", () => {
    expect(() => generatePeriodizationCalendar(new Date("2026-06-15T12:00:00"), 0)).toThrow();
  });

  it("rejeita data inicial inválida ou fora de uma segunda-feira", () => {
    expect(() => generatePeriodizationCalendar(new Date("invalid"))).toThrow(
      "A data inicial da periodização deve ser válida.",
    );
    expect(() => generatePeriodizationCalendar(new Date("2026-06-16T12:00:00"))).toThrow(
      "A data inicial da periodização deve ser uma segunda-feira.",
    );
  });
});
