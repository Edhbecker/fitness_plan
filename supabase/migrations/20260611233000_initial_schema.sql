-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('TRAINER', 'ADMIN');

-- CreateEnum
CREATE TYPE "Sex" AS ENUM ('HOMEM', 'MULHER', 'OUTRO', 'NAO_INFORMADO');

-- CreateEnum
CREATE TYPE "StudentStatus" AS ENUM ('ACTIVE', 'INACTIVE');

-- CreateEnum
CREATE TYPE "ExerciseType" AS ENUM ('FORCA', 'MOBILIDADE', 'CARDIO', 'ALONGAMENTO', 'FUNCIONAL', 'OUTRO');

-- CreateEnum
CREATE TYPE "PeriodizationStatus" AS ENUM ('PLANNING', 'ACTIVE', 'COMPLETED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "DayOfWeek" AS ENUM ('MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY', 'SUNDAY');

-- CreateEnum
CREATE TYPE "WorkoutStatus" AS ENUM ('COMPLETED', 'PARTIAL', 'MISSED');

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "role" "UserRole" NOT NULL DEFAULT 'TRAINER',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Student" (
    "id" TEXT NOT NULL,
    "trainerId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "contact" TEXT,
    "birthDate" TIMESTAMP(3) NOT NULL,
    "sex" "Sex" NOT NULL,
    "heightCm" DECIMAL(6,2) NOT NULL,
    "initialWeightKg" DECIMAL(6,2),
    "objective" TEXT NOT NULL,
    "weeklyFrequency" INTEGER NOT NULL,
    "notes" TEXT,
    "status" "StudentStatus" NOT NULL DEFAULT 'ACTIVE',
    "deactivatedAt" TIMESTAMP(3),
    "anonymizedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Student_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "HealthHistoryVersion" (
    "id" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "versionDate" TIMESTAMP(3) NOT NULL,
    "chronicDisease" BOOLEAN NOT NULL DEFAULT false,
    "chronicDiseaseDescription" TEXT,
    "medicationUse" BOOLEAN NOT NULL DEFAULT false,
    "medicationDescription" TEXT,
    "surgeryHistory" BOOLEAN NOT NULL DEFAULT false,
    "surgeryDescription" TEXT,
    "fractureHistory" BOOLEAN NOT NULL DEFAULT false,
    "fractureDescription" TEXT,
    "regularDoctor" BOOLEAN NOT NULL DEFAULT false,
    "regularDoctorDescription" TEXT,
    "regularExams" BOOLEAN NOT NULL DEFAULT false,
    "regularExamsDescription" TEXT,
    "familyCardioHistory" BOOLEAN NOT NULL DEFAULT false,
    "lastMedicalAppointment" TIMESTAMP(3),
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "HealthHistoryVersion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Lifestyle" (
    "id" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "activityLevel" TEXT,
    "currentActivities" TEXT,
    "trainingFrequencyDuration" TEXT,
    "practicesSport" BOOLEAN NOT NULL DEFAULT false,
    "sportDescription" TEXT,
    "smoking" BOOLEAN NOT NULL DEFAULT false,
    "sleepQuality" TEXT,
    "sleepHours" DECIMAL(4,2),
    "alcoholUse" BOOLEAN NOT NULL DEFAULT false,
    "alcoholFrequency" TEXT,
    "stressLevel" TEXT,
    "timeManagementDifficulty" BOOLEAN NOT NULL DEFAULT false,
    "trainingPreference" TEXT,
    "preferredTrainingTime" TEXT,
    "environmentPreference" TEXT,
    "effortTolerance" TEXT,
    "equipmentPreference" TEXT,
    "enjoyableTraining" TEXT,
    "preferredIntensity" TEXT,
    "preferredExercises" TEXT,
    "dislikedExercises" TEXT,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Lifestyle_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BodyCompositionProtocol" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "requiredSkinfolds" TEXT[],
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BodyCompositionProtocol_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BodyAssessment" (
    "id" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "protocolId" TEXT NOT NULL,
    "assessmentDate" TIMESTAMP(3) NOT NULL,
    "weightKg" DECIMAL(6,2) NOT NULL,
    "ageAtAssessment" INTEGER NOT NULL,
    "sexAtAssessment" "Sex" NOT NULL,
    "heightCmAtAssessment" DECIMAL(6,2) NOT NULL,
    "chestSkinfold" DECIMAL(6,2),
    "axillarySkinfold" DECIMAL(6,2),
    "tricepsSkinfold" DECIMAL(6,2),
    "subscapularSkinfold" DECIMAL(6,2),
    "abdominalSkinfold" DECIMAL(6,2),
    "suprailiacSkinfold" DECIMAL(6,2),
    "thighSkinfold" DECIMAL(6,2),
    "bicepsSkinfold" DECIMAL(6,2),
    "supraespinalSkinfold" DECIMAL(6,2),
    "chestCircumference" DECIMAL(6,2),
    "waistCircumference" DECIMAL(6,2),
    "hipCircumference" DECIMAL(6,2),
    "abdomenCircumference" DECIMAL(6,2),
    "thighCircumference" DECIMAL(6,2),
    "armCircumference" DECIMAL(6,2),
    "skinfoldSum" DECIMAL(8,2),
    "bodyDensity" DECIMAL(8,5),
    "bodyFatPercentage" DECIMAL(6,2),
    "fatMassKg" DECIMAL(6,2),
    "leanMassKg" DECIMAL(6,2),
    "basalMetabolicRate" DECIMAL(8,2),
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BodyAssessment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Exercise" (
    "id" TEXT NOT NULL,
    "trainerId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "primaryMuscleGroup" TEXT NOT NULL,
    "secondaryMuscleGroups" TEXT[],
    "equipment" TEXT,
    "type" "ExerciseType" NOT NULL,
    "videoUrl" TEXT,
    "notes" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Exercise_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ExerciseAlias" (
    "id" TEXT NOT NULL,
    "exerciseId" TEXT NOT NULL,
    "alias" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ExerciseAlias_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Periodization" (
    "id" TEXT NOT NULL,
    "trainerId" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "objective" TEXT NOT NULL,
    "startDate" TIMESTAMP(3) NOT NULL,
    "totalWeeks" INTEGER NOT NULL DEFAULT 12,
    "endDate" TIMESTAMP(3) NOT NULL,
    "status" "PeriodizationStatus" NOT NULL DEFAULT 'PLANNING',
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Periodization_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TrainingWeek" (
    "id" TEXT NOT NULL,
    "periodizationId" TEXT NOT NULL,
    "weekNumber" INTEGER NOT NULL,
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TrainingWeek_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TrainingDay" (
    "id" TEXT NOT NULL,
    "trainingWeekId" TEXT NOT NULL,
    "dayOfWeek" "DayOfWeek" NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "isRestDay" BOOLEAN NOT NULL DEFAULT false,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TrainingDay_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PlannedExercise" (
    "id" TEXT NOT NULL,
    "trainingDayId" TEXT NOT NULL,
    "exerciseId" TEXT,
    "customExerciseName" TEXT,
    "order" INTEGER NOT NULL,
    "sets" INTEGER NOT NULL,
    "reps" INTEGER NOT NULL,
    "loadKg" DECIMAL(7,2) NOT NULL,
    "registeredOneRmKg" DECIMAL(7,2),
    "estimatedOneRmKg" DECIMAL(7,2),
    "volume" DECIMAL(10,2) NOT NULL,
    "intensityPercentage" DECIMAL(6,2),
    "restSeconds" INTEGER NOT NULL,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PlannedExercise_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WorkoutSession" (
    "id" TEXT NOT NULL,
    "trainingDayId" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "trainerId" TEXT NOT NULL,
    "performedDate" TIMESTAMP(3) NOT NULL,
    "status" "WorkoutStatus" NOT NULL,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "WorkoutSession_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PerformedExercise" (
    "id" TEXT NOT NULL,
    "workoutSessionId" TEXT NOT NULL,
    "plannedExerciseId" TEXT,
    "exerciseId" TEXT,
    "customExerciseName" TEXT,
    "order" INTEGER NOT NULL,
    "sets" INTEGER NOT NULL,
    "reps" INTEGER NOT NULL,
    "loadKg" DECIMAL(7,2) NOT NULL,
    "registeredOneRmKg" DECIMAL(7,2),
    "estimatedOneRmKg" DECIMAL(7,2),
    "volume" DECIMAL(10,2) NOT NULL,
    "intensityPercentage" DECIMAL(6,2),
    "restSeconds" INTEGER NOT NULL,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PerformedExercise_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AuditLog" (
    "id" TEXT NOT NULL,
    "trainerId" TEXT NOT NULL,
    "entityType" TEXT NOT NULL,
    "entityId" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "oldValue" JSONB,
    "newValue" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AuditLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE INDEX "Student_trainerId_status_idx" ON "Student"("trainerId", "status");

-- CreateIndex
CREATE INDEX "HealthHistoryVersion_studentId_versionDate_idx" ON "HealthHistoryVersion"("studentId", "versionDate");

-- CreateIndex
CREATE UNIQUE INDEX "Lifestyle_studentId_key" ON "Lifestyle"("studentId");

-- CreateIndex
CREATE UNIQUE INDEX "BodyCompositionProtocol_name_key" ON "BodyCompositionProtocol"("name");

-- CreateIndex
CREATE INDEX "BodyAssessment_studentId_assessmentDate_idx" ON "BodyAssessment"("studentId", "assessmentDate");

-- CreateIndex
CREATE INDEX "Exercise_trainerId_active_idx" ON "Exercise"("trainerId", "active");

-- CreateIndex
CREATE UNIQUE INDEX "Exercise_trainerId_name_key" ON "Exercise"("trainerId", "name");

-- CreateIndex
CREATE UNIQUE INDEX "ExerciseAlias_exerciseId_alias_key" ON "ExerciseAlias"("exerciseId", "alias");

-- CreateIndex
CREATE INDEX "Periodization_trainerId_studentId_idx" ON "Periodization"("trainerId", "studentId");

-- CreateIndex
CREATE UNIQUE INDEX "TrainingWeek_periodizationId_weekNumber_key" ON "TrainingWeek"("periodizationId", "weekNumber");

-- CreateIndex
CREATE UNIQUE INDEX "TrainingDay_trainingWeekId_dayOfWeek_key" ON "TrainingDay"("trainingWeekId", "dayOfWeek");

-- CreateIndex
CREATE INDEX "PlannedExercise_trainingDayId_order_idx" ON "PlannedExercise"("trainingDayId", "order");

-- CreateIndex
CREATE INDEX "WorkoutSession_trainerId_studentId_performedDate_idx" ON "WorkoutSession"("trainerId", "studentId", "performedDate");

-- CreateIndex
CREATE INDEX "PerformedExercise_workoutSessionId_order_idx" ON "PerformedExercise"("workoutSessionId", "order");

-- CreateIndex
CREATE INDEX "AuditLog_trainerId_entityType_entityId_idx" ON "AuditLog"("trainerId", "entityType", "entityId");

-- AddForeignKey
ALTER TABLE "Student" ADD CONSTRAINT "Student_trainerId_fkey" FOREIGN KEY ("trainerId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HealthHistoryVersion" ADD CONSTRAINT "HealthHistoryVersion_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "Student"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Lifestyle" ADD CONSTRAINT "Lifestyle_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "Student"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BodyAssessment" ADD CONSTRAINT "BodyAssessment_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "Student"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BodyAssessment" ADD CONSTRAINT "BodyAssessment_protocolId_fkey" FOREIGN KEY ("protocolId") REFERENCES "BodyCompositionProtocol"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Exercise" ADD CONSTRAINT "Exercise_trainerId_fkey" FOREIGN KEY ("trainerId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ExerciseAlias" ADD CONSTRAINT "ExerciseAlias_exerciseId_fkey" FOREIGN KEY ("exerciseId") REFERENCES "Exercise"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Periodization" ADD CONSTRAINT "Periodization_trainerId_fkey" FOREIGN KEY ("trainerId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Periodization" ADD CONSTRAINT "Periodization_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "Student"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TrainingWeek" ADD CONSTRAINT "TrainingWeek_periodizationId_fkey" FOREIGN KEY ("periodizationId") REFERENCES "Periodization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TrainingDay" ADD CONSTRAINT "TrainingDay_trainingWeekId_fkey" FOREIGN KEY ("trainingWeekId") REFERENCES "TrainingWeek"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PlannedExercise" ADD CONSTRAINT "PlannedExercise_trainingDayId_fkey" FOREIGN KEY ("trainingDayId") REFERENCES "TrainingDay"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PlannedExercise" ADD CONSTRAINT "PlannedExercise_exerciseId_fkey" FOREIGN KEY ("exerciseId") REFERENCES "Exercise"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WorkoutSession" ADD CONSTRAINT "WorkoutSession_trainingDayId_fkey" FOREIGN KEY ("trainingDayId") REFERENCES "TrainingDay"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WorkoutSession" ADD CONSTRAINT "WorkoutSession_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "Student"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WorkoutSession" ADD CONSTRAINT "WorkoutSession_trainerId_fkey" FOREIGN KEY ("trainerId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PerformedExercise" ADD CONSTRAINT "PerformedExercise_workoutSessionId_fkey" FOREIGN KEY ("workoutSessionId") REFERENCES "WorkoutSession"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PerformedExercise" ADD CONSTRAINT "PerformedExercise_plannedExerciseId_fkey" FOREIGN KEY ("plannedExerciseId") REFERENCES "PlannedExercise"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PerformedExercise" ADD CONSTRAINT "PerformedExercise_exerciseId_fkey" FOREIGN KEY ("exerciseId") REFERENCES "Exercise"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AuditLog" ADD CONSTRAINT "AuditLog_trainerId_fkey" FOREIGN KEY ("trainerId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

