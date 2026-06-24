import type { CalculationSex, Skinfolds } from "@/lib/calculations";

export type ActionResult<T = undefined> =
  | { success: true; data?: T; message: string }
  | { success: false; message: string; errors?: Record<string, string[]> };

export type AssessmentActionInput = Skinfolds & {
  assessmentDate: string;
  weightKg: number;
  sexAtAssessment: CalculationSex;
  heightCmAtAssessment: number;
  bicepsSkinfold?: number;
  supraespinalSkinfold?: number;
  chestCircumference?: number;
  waistCircumference?: number;
  hipCircumference?: number;
  abdomenCircumference?: number;
  thighCircumference?: number;
  armCircumference?: number;
  notes?: string;
};
