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

function buildAssessmentData(
  student: { birthDate: Date; sex: Sex; heightCm: unknown },
  input: CreateAssessmentInput,
) {
  const ageAtAssessment = calculateAge(student.birthDate, input.assessmentDate);
  const sexAtAssessment = input.sexAtAssessment ?? student.sex;
  const heightCmAtAssessment = input.heightCmAtAssessment ?? Number(student.heightCm);
  const skinfoldSum = calculateSkinfoldSum(input).value;
  const bodyDensity =
    skinfoldSum === null ? null : calculateBodyDensity(sexAtAssessment, skinfoldSum, ageAtAssessment);
  const bodyFatPercentage =
    bodyDensity === null ? null : calculateBodyFatPercentage(bodyDensity);
  const fatMassKg =
    bodyFatPercentage === null
      ? null
      : calculateFatMass(input.weightKg, bodyFatPercentage);
  const leanMassKg =
    fatMassKg === null ? null : calculateLeanMass(input.weightKg, fatMassKg);
  const basalMetabolicRate = calculateBasalMetabolicRate(
    sexAtAssessment,
    input.weightKg,
    heightCmAtAssessment,
    ageAtAssessment,
  );

  return {
    assessmentDate: input.assessmentDate,
    weightKg: input.weightKg,
    sexAtAssessment,
    heightCmAtAssessment,
    chestSkinfold: input.chestSkinfold,
    axillarySkinfold: input.axillarySkinfold,
    tricepsSkinfold: input.tricepsSkinfold,
    subscapularSkinfold: input.subscapularSkinfold,
    abdominalSkinfold: input.abdominalSkinfold,
    suprailiacSkinfold: input.suprailiacSkinfold,
    thighSkinfold: input.thighSkinfold,
    bicepsSkinfold: input.bicepsSkinfold ?? null,
    supraespinalSkinfold: input.supraespinalSkinfold ?? null,
    chestCircumference: input.chestCircumference ?? null,
    waistCircumference: input.waistCircumference ?? null,
    hipCircumference: input.hipCircumference ?? null,
    abdomenCircumference: input.abdomenCircumference ?? null,
    thighCircumference: input.thighCircumference ?? null,
    armCircumference: input.armCircumference ?? null,
    notes: input.notes ?? "",
    ageAtAssessment,
    skinfoldSum,
    bodyDensity,
    bodyFatPercentage,
    fatMassKg,
    leanMassKg,
    basalMetabolicRate,
  };
}

export async function getStudentAssessmentsForTrainer(trainerId: string, studentId: string) {
  return prisma.student.findFirst({
    where: { id: studentId, trainerId },
    include: {
      assessments: { orderBy: { assessmentDate: "desc" } },
    },
  });
}

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

    const assessmentData = buildAssessmentData(student, validatedInput);

    const assessment = await transaction.bodyAssessment.create({
      data: {
        studentId: student.id,
        protocolId: protocol.id,
        ...assessmentData,
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

export async function updateAssessmentForTrainer(
  trainerId: string,
  studentId: string,
  assessmentId: string,
  input: CreateAssessmentInput,
) {
  const validatedInput = createAssessmentSchema.parse(input);
  return prisma.$transaction(async (transaction) => {
    const current = await transaction.bodyAssessment.findFirstOrThrow({
      where: {
        id: assessmentId,
        student: { id: studentId, trainerId },
      },
      include: { student: true },
    });
    const assessmentData = buildAssessmentData(current.student, validatedInput);
    const assessment = await transaction.bodyAssessment.update({
      where: { id: current.id },
      data: assessmentData,
    });

    await writeAuditLog(transaction, {
      trainerId,
      entityType: "BodyAssessment",
      entityId: assessment.id,
      action: "ASSESSMENT_UPDATED",
      oldValue: {
        studentId,
        assessmentDate: current.assessmentDate.toISOString(),
        weightKg: Number(current.weightKg),
      },
      newValue: {
        studentId,
        assessmentDate: assessment.assessmentDate.toISOString(),
        weightKg: Number(assessment.weightKg),
      },
    });
    return assessment;
  });
}
