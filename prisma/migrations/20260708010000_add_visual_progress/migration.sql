-- CreateEnum
CREATE TYPE "VisualPhotoAngle" AS ENUM ('FRONT', 'BACK', 'RIGHT_SIDE', 'LEFT_SIDE', 'OPTIONAL_1', 'OPTIONAL_2');

-- CreateEnum
CREATE TYPE "VisualPerception" AS ENUM ('NO_PERCEPTIBLE_CHANGE', 'SLIGHT_EVOLUTION', 'MODERATE_EVOLUTION', 'EVIDENT_EVOLUTION');

-- CreateTable
CREATE TABLE "VisualProgressSession" (
    "id" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "trainerId" TEXT NOT NULL,
    "bodyAssessmentId" TEXT,
    "sessionDate" TIMESTAMP(3) NOT NULL,
    "weightKg" DECIMAL(6,2),
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "VisualProgressSession_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "VisualProgressPhoto" (
    "id" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "trainerId" TEXT NOT NULL,
    "angle" "VisualPhotoAngle" NOT NULL,
    "originalFileName" TEXT NOT NULL,
    "fileName" TEXT NOT NULL,
    "storagePath" TEXT NOT NULL,
    "thumbnailStoragePath" TEXT NOT NULL,
    "mimeType" TEXT NOT NULL,
    "fileSize" INTEGER NOT NULL,
    "thumbnailFileSize" INTEGER NOT NULL,
    "width" INTEGER NOT NULL,
    "height" INTEGER NOT NULL,
    "thumbnailWidth" INTEGER NOT NULL,
    "thumbnailHeight" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "VisualProgressPhoto_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "VisualProgressComparison" (
    "id" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "trainerId" TEXT NOT NULL,
    "initialSessionId" TEXT NOT NULL,
    "finalSessionId" TEXT NOT NULL,
    "visualPerception" "VisualPerception",
    "professionalComment" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "VisualProgressComparison_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "VisualProgressSession_trainerId_studentId_sessionDate_idx" ON "VisualProgressSession"("trainerId", "studentId", "sessionDate");

-- CreateIndex
CREATE INDEX "VisualProgressSession_bodyAssessmentId_idx" ON "VisualProgressSession"("bodyAssessmentId");

-- CreateIndex
CREATE INDEX "VisualProgressPhoto_trainerId_studentId_idx" ON "VisualProgressPhoto"("trainerId", "studentId");

-- CreateIndex
CREATE INDEX "VisualProgressPhoto_sessionId_angle_idx" ON "VisualProgressPhoto"("sessionId", "angle");

-- CreateIndex
CREATE INDEX "VisualProgressComparison_trainerId_studentId_createdAt_idx" ON "VisualProgressComparison"("trainerId", "studentId", "createdAt");

-- CreateIndex
CREATE INDEX "VisualProgressComparison_initialSessionId_idx" ON "VisualProgressComparison"("initialSessionId");

-- CreateIndex
CREATE INDEX "VisualProgressComparison_finalSessionId_idx" ON "VisualProgressComparison"("finalSessionId");

-- AddForeignKey
ALTER TABLE "VisualProgressSession" ADD CONSTRAINT "VisualProgressSession_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "Student"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VisualProgressSession" ADD CONSTRAINT "VisualProgressSession_trainerId_fkey" FOREIGN KEY ("trainerId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VisualProgressSession" ADD CONSTRAINT "VisualProgressSession_bodyAssessmentId_fkey" FOREIGN KEY ("bodyAssessmentId") REFERENCES "BodyAssessment"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VisualProgressPhoto" ADD CONSTRAINT "VisualProgressPhoto_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "VisualProgressSession"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VisualProgressPhoto" ADD CONSTRAINT "VisualProgressPhoto_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "Student"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VisualProgressPhoto" ADD CONSTRAINT "VisualProgressPhoto_trainerId_fkey" FOREIGN KEY ("trainerId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VisualProgressComparison" ADD CONSTRAINT "VisualProgressComparison_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "Student"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VisualProgressComparison" ADD CONSTRAINT "VisualProgressComparison_trainerId_fkey" FOREIGN KEY ("trainerId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VisualProgressComparison" ADD CONSTRAINT "VisualProgressComparison_initialSessionId_fkey" FOREIGN KEY ("initialSessionId") REFERENCES "VisualProgressSession"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VisualProgressComparison" ADD CONSTRAINT "VisualProgressComparison_finalSessionId_fkey" FOREIGN KEY ("finalSessionId") REFERENCES "VisualProgressSession"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Security
ALTER TABLE "VisualProgressSession" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "VisualProgressPhoto" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "VisualProgressComparison" ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON "VisualProgressSession" FROM anon;
REVOKE ALL ON "VisualProgressSession" FROM authenticated;
REVOKE ALL ON "VisualProgressPhoto" FROM anon;
REVOKE ALL ON "VisualProgressPhoto" FROM authenticated;
REVOKE ALL ON "VisualProgressComparison" FROM anon;
REVOKE ALL ON "VisualProgressComparison" FROM authenticated;
