import { describe, expect, it } from "vitest";
import { registerTrainerSchema } from "./auth";
import { createAssessmentSchema } from "./assessment";
import { studentSchema } from "./student";
import { exerciseMetricsSchema } from "./workout";

describe("validações de entrada", () => {
  it("aceita cadastro profissional com senha forte", () => {
    expect(registerTrainerSchema.safeParse({
      name: "Profissional Teste",
      email: "PROFISSIONAL@EXEMPLO.COM",
      password: "SenhaSegura@123",
      passwordConfirmation: "SenhaSegura@123",
      acceptedTerms: true,
    }).success).toBe(true);
  });

  it("rejeita cadastro com senha fraca ou confirmação divergente", () => {
    expect(registerTrainerSchema.safeParse({
      name: "Profissional Teste",
      email: "profissional@exemplo.com",
      password: "fraca",
      passwordConfirmation: "diferente",
      acceptedTerms: true,
    }).success).toBe(false);
  });

  it("aceita peso inicial vazio no cadastro de aluno", () => {
    const result = studentSchema.parse({
      name: "Marina Souza",
      birthDate: "1995-01-10",
      sex: "MULHER",
      heightCm: "165",
      initialWeightKg: "",
      objective: "Hipertrofia",
      weeklyFrequency: "4",
    });
    expect(result.initialWeightKg).toBeUndefined();
  });

  it("rejeita data de nascimento futura", () => {
    expect(() => studentSchema.parse({
      name: "Pessoa Teste",
      birthDate: "2999-01-01",
      sex: "NAO_INFORMADO",
      heightCm: 170,
      objective: "Saúde",
      weeklyFrequency: 3,
    })).toThrow();
  });

  it("rejeita avaliação futura e métricas negativas", () => {
    expect(() => createAssessmentSchema.parse({ assessmentDate: new Date("2999-01-01"), weightKg: 70 })).toThrow();
    expect(() => exerciseMetricsSchema.parse({ sets: 3, reps: -1, loadKg: 20 })).toThrow();
  });
});
