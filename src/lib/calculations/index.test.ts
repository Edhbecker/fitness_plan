import { describe, expect, it } from "vitest";
import {
  calculateAge,
  calculateBasalMetabolicRate,
  calculateBodyDensity,
  calculateBodyFatPercentage,
  calculateEstimatedOneRm,
  calculateFatMass,
  calculateIntensityPercentage,
  calculateLeanMass,
  calculateSkinfoldSum,
  calculateTrainingVolume,
  calculateWeeklyAdherence,
} from ".";

describe("cálculos corporais", () => {
  it("calcula idade e rejeita nascimento futuro", () => {
    expect(calculateAge(new Date("1990-06-12"), new Date("2026-06-11"))).toBe(35);
    expect(() => calculateAge(new Date("2027-01-01"), new Date("2026-06-11"))).toThrow(
      RangeError,
    );
  });

  it("calcula GEB para homem", () => {
    expect(calculateBasalMetabolicRate("HOMEM", 80, 180, 30)).toBe(1853.63);
  });

  it("calcula GEB para mulher", () => {
    expect(calculateBasalMetabolicRate("MULHER", 65, 165, 30)).toBe(1429.92);
  });

  it("não calcula GEB para sexo não aplicável", () => {
    expect(calculateBasalMetabolicRate("OUTRO", 70, 170, 30)).toBeNull();
  });

  it("calcula soma de sete dobras", () => {
    expect(
      calculateSkinfoldSum({
        chestSkinfold: 10,
        axillarySkinfold: 11,
        tricepsSkinfold: 12,
        subscapularSkinfold: 13,
        abdominalSkinfold: 14,
        suprailiacSkinfold: 15,
        thighSkinfold: 16,
      }).value,
    ).toBe(91);
  });

  it("calcula densidade para homem e mulher", () => {
    expect(calculateBodyDensity("HOMEM", 91, 30)).toBe(1.06832);
    expect(calculateBodyDensity("MULHER", 91, 30)).toBe(1.05505);
  });

  it("calcula percentual, massa gorda e massa magra", () => {
    const fatPercentage = calculateBodyFatPercentage(1.06838);
    expect(fatPercentage).toBe(13.32);
    expect(calculateFatMass(80, fatPercentage!)).toBe(10.66);
    expect(calculateLeanMass(80, 10.66)).toBe(69.34);
  });

  it("rejeita entradas corporais não finitas ou fisiologicamente inválidas", () => {
    expect(calculateBasalMetabolicRate("HOMEM", Number.NaN, 180, 30)).toBeNull();
    expect(calculateSkinfoldSum({ chestSkinfold: Number.POSITIVE_INFINITY }).value).toBeNull();
    expect(calculateBodyFatPercentage(0.5)).toBeNull();
    expect(calculateFatMass(80, 101)).toBeNull();
    expect(calculateLeanMass(80, 81)).toBeNull();
  });
});

describe("cálculos de treinamento", () => {
  it("calcula volume e 1RM estimado", () => {
    expect(calculateTrainingVolume(4, 10, 80)).toBe(3200);
    expect(calculateEstimatedOneRm(80, 10)).toBe(106.64);
  });

  it("prioriza 1RM registrado para intensidade", () => {
    expect(calculateIntensityPercentage(80, 106.64, 120)).toBe(66.67);
    expect(calculateIntensityPercentage(80, 106.64)).toBe(75.02);
  });

  it("calcula aderência semanal ponderada", () => {
    expect(calculateWeeklyAdherence(4, ["COMPLETED", "COMPLETED", "PARTIAL", "MISSED"])).toBe(
      62.5,
    );
  });

  it("nunca permite aderência acima de 100%", () => {
    expect(calculateWeeklyAdherence(1, ["COMPLETED", "COMPLETED"])).toBe(100);
  });

  it("rejeita métricas de treino não finitas", () => {
    expect(calculateTrainingVolume(4, 10, Number.NaN)).toBe(0);
    expect(calculateEstimatedOneRm(Number.POSITIVE_INFINITY, 10)).toBeNull();
    expect(calculateIntensityPercentage(80, Number.NaN)).toBeNull();
  });
});
