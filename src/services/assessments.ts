import { type Sex } from "@prisma/client";
import {
  calculateAge,
  calculateBasalMetabolicRate,
  calculateBodyDensity,
  calculateBodyFatPercentage,
  calculateFatMass,
  calculateLeanMass,
  calculateSkinfoldSum,
  type Skinfolds,
} from "@/lib/calculations";
import { prisma } from "@/lib/prisma";
import { createAssessmentSchema } from "@/lib/validations/assessment";
import { writeAuditLog } from "./audit";

export type CreateAssessmentInput = Skinfolds & {
  assessmentDate: Date;
  weightKg: number;
  sexAtAssessment?: Sex;
  heightCmAtAssessment?: number;
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

export async function createAssessmentForTrainer(
  trainerId: string,
  studentId: string,
  input: CreateAssessmentInput,
) {
  const validatedInput = createAssessmentSchema.parse(input);
  return prisma.$transaction(async (transaction) => {
    const student = await transaction.student.findFirstOrThrow({
      where: { id: studentId, trainerId },
    });
    const protocol = await transaction.bodyCompositionProtocol.findFirstOrThrow({
      where: { active: true },
      orderBy: { createdAt: "asc" },
    });

    const ageAtAssessment = calculateAge(student.birthDate, validatedInput.assessmentDate);
    const sexAtAssessment = validatedInput.sexAtAssessment ?? student.sex;
    const heightCmAtAssessment = validatedInput.heightCmAtAssessment ?? Number(student.heightCm);
    const skinfoldSum = calculateSkinfoldSum(validatedInput).value;
    const bodyDensity =
      skinfoldSum === null ? null : calculateBodyDensity(sexAtAssessment, skinfoldSum, ageAtAssessment);
    const bodyFatPercentage =
      bodyDensity === null ? null : calculateBodyFatPercentage(bodyDensity);
    const fatMassKg =
      bodyFatPercentage === null
        ? null
        : calculateFatMass(validatedInput.weightKg, bodyFatPercentage);
    const leanMassKg =
      fatMassKg === null ? null : calculateLeanMass(validatedInput.weightKg, fatMassKg);
    const basalMetabolicRate = calculateBasalMetabolicRate(
      sexAtAssessment,
      validatedInput.weightKg,
      heightCmAtAssessment,
      ageAtAssessment,
    );

    const assessment = await transaction.bodyAssessment.create({
      data: {
        studentId: student.id,
        protocolId: protocol.id,
        ...validatedInput,
        ageAtAssessment,
        sexAtAssessment,
        heightCmAtAssessment,
        skinfoldSum,
        bodyDensity,
        bodyFatPercentage,
        fatMassKg,
        leanMassKg,
        basalMetabolicRate,
      },
    });

    await writeAuditLog(transaction, {
      trainerId,
      entityType: "BodyAssessment",
      entityId: assessment.id,
      action: "ASSESSMENT_CREATED",
      newValue: {
        studentId,
        assessmentDate: assessment.assessmentDate.toISOString(),
        weightKg: Number(assessment.weightKg),
      },
    });
    return assessment;
  });
}
