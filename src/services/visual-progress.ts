import { randomUUID } from "node:crypto";
import { type Prisma, type VisualPerception } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import {
  dateInputValue,
  type VisualPhotoAngleValue,
  visualPhotoAngles,
} from "@/lib/visual-progress";
import {
  visualProgressComparisonSchema,
  visualProgressSessionSchema,
} from "@/lib/validations/visual-progress";
import {
  getVisualProgressImageUrl,
  uploadVisualProgressImage,
  type StoredVisualProgressPhoto,
} from "@/lib/storage/visual-progress-storage";
import { writeAuditLog } from "./audit";

export type BodyAssessmentLinkMode = "SELECT" | "NEAREST" | "NONE";

export type VisualProgressSessionInput = {
  sessionDate: Date;
  bodyAssessmentMode: BodyAssessmentLinkMode;
  bodyAssessmentId?: string | null;
  weightKg?: number | null;
  notes?: string | null;
};

export type VisualProgressPhotoUpload = {
  angle: VisualPhotoAngleValue;
  file: File;
};

export type VisualProgressComparisonInput = {
  initialSessionId: string;
  finalSessionId: string;
  visualPerception?: VisualPerception | null;
  professionalComment?: string | null;
};

const assessmentSelect = {
  id: true,
  assessmentDate: true,
  weightKg: true,
  bodyFatPercentage: true,
  fatMassKg: true,
  leanMassKg: true,
  waistCircumference: true,
  armCircumference: true,
  thighCircumference: true,
  abdomenCircumference: true,
} satisfies Prisma.BodyAssessmentSelect;

const photoWhere = { deletedAt: null } satisfies Prisma.VisualProgressPhotoWhereInput;

const sessionInclude = {
  bodyAssessment: { select: assessmentSelect },
  photos: {
    where: photoWhere,
    orderBy: { angle: "asc" as const },
  },
};

function emptyVisualProgressSummary() {
  return {
    totalSessions: 0,
    firstSessionDate: null,
    latestSessionDate: null,
    latestComparison: null,
  };
}

function isMissingVisualProgressSchemaError(error: unknown) {
  const candidate = error as { code?: string; message?: string; meta?: { table?: string; column?: string } } | null;
  const code = candidate?.code;
  if (code === "P2021" || code === "P2022") return true;

  const details = [
    candidate?.message,
    candidate?.meta?.table,
    candidate?.meta?.column,
  ].filter(Boolean).join(" ");

  return /VisualProgress|visual_progress|visualprogress/i.test(details)
    && /does not exist|doesn't exist|nao existe|não existe|missing/i.test(details);
}

function toNullableText(value?: string | null) {
  const clean = value?.trim();
  return clean ? clean : null;
}

function findNearestAssessment(
  assessments: Array<{ id: string; assessmentDate: Date }>,
  sessionDate: Date,
) {
  return assessments
    .map((assessment) => ({
      assessment,
      distance: Math.abs(assessment.assessmentDate.getTime() - sessionDate.getTime()),
    }))
    .sort((a, b) => a.distance - b.distance)[0]?.assessment ?? null;
}

async function resolveBodyAssessmentId(
  transaction: Prisma.TransactionClient,
  input: {
    trainerId: string;
    studentId: string;
    sessionDate: Date;
    mode: BodyAssessmentLinkMode;
    bodyAssessmentId?: string | null;
  },
) {
  if (input.mode === "NONE") return null;

  if (input.mode === "SELECT") {
    if (!input.bodyAssessmentId) return null;
    const assessment = await transaction.bodyAssessment.findFirstOrThrow({
      where: {
        id: input.bodyAssessmentId,
        student: { id: input.studentId, trainerId: input.trainerId },
      },
      select: { id: true },
    });
    return assessment.id;
  }

  const assessments = await transaction.bodyAssessment.findMany({
    where: { student: { id: input.studentId, trainerId: input.trainerId } },
    select: { id: true, assessmentDate: true },
  });
  return findNearestAssessment(assessments, input.sessionDate)?.id ?? null;
}

function assertNoDuplicateAngles(photos: VisualProgressPhotoUpload[]) {
  const used = new Set<string>();
  for (const photo of photos) {
    if (!visualPhotoAngles.includes(photo.angle)) throw new Error("Ângulo de foto inválido.");
    if (used.has(photo.angle)) throw new Error("Envie apenas uma foto por ângulo.");
    used.add(photo.angle);
  }
}

type VisualPhotoWithUrls<T extends { id: string; studentId: string; sessionId: string }> = T & {
  fileUrl: string;
  thumbnailUrl: string;
};

function withPhotoUrls<T extends { id: string; studentId: string; sessionId: string }>(photo: T): VisualPhotoWithUrls<T> {
  return {
    ...photo,
    fileUrl: getVisualProgressImageUrl({
      studentId: photo.studentId,
      sessionId: photo.sessionId,
      photoId: photo.id,
      variant: "full",
    }),
    thumbnailUrl: getVisualProgressImageUrl({
      studentId: photo.studentId,
      sessionId: photo.sessionId,
      photoId: photo.id,
      variant: "thumbnail",
    }),
  };
}

function withSessionPhotoUrls<T extends { photos: Array<{ id: string; studentId: string; sessionId: string }> }>(
  session: T,
): Omit<T, "photos"> & { photos: Array<VisualPhotoWithUrls<T["photos"][number]>> } {
  const { photos, ...rest } = session;
  return { ...rest, photos: photos.map(withPhotoUrls) };
}

async function storePhotos(input: {
  trainerId: string;
  studentId: string;
  sessionId: string;
  photos: VisualProgressPhotoUpload[];
}) {
  assertNoDuplicateAngles(input.photos);
  const stored: Array<StoredVisualProgressPhoto & { id: string }> = [];
  for (const photo of input.photos) {
    const id = randomUUID();
    const uploaded = await uploadVisualProgressImage({
      trainerId: input.trainerId,
      studentId: input.studentId,
      sessionId: input.sessionId,
      angle: photo.angle,
      file: photo.file,
    });
    stored.push({ ...uploaded, id });
  }
  return stored;
}

function photoCreateData(input: {
  photo: StoredVisualProgressPhoto & { id: string };
  studentId: string;
  trainerId: string;
}) {
  return {
    id: input.photo.id,
    studentId: input.studentId,
    trainerId: input.trainerId,
    angle: input.photo.angle,
    originalFileName: input.photo.originalFileName,
    fileName: input.photo.fileName,
    storagePath: input.photo.storagePath,
    thumbnailStoragePath: input.photo.thumbnailStoragePath,
    mimeType: input.photo.mimeType,
    fileSize: input.photo.fileSize,
    thumbnailFileSize: input.photo.thumbnailFileSize,
    width: input.photo.width,
    height: input.photo.height,
    thumbnailWidth: input.photo.thumbnailWidth,
    thumbnailHeight: input.photo.thumbnailHeight,
  };
}

export async function getVisualProgressSummaryForTrainer(trainerId: string, studentId: string) {
  try {
    const [sessions, latestComparison] = await Promise.all([
      prisma.visualProgressSession.findMany({
        where: { trainerId, studentId, deletedAt: null },
        orderBy: { sessionDate: "asc" },
        select: { id: true, sessionDate: true },
      }),
      prisma.visualProgressComparison.findFirst({
        where: { trainerId, studentId },
        orderBy: { createdAt: "desc" },
        include: {
          initialSession: { include: { bodyAssessment: { select: assessmentSelect } } },
          finalSession: { include: { bodyAssessment: { select: assessmentSelect } } },
        },
      }),
    ]);

    const first = sessions[0] ?? null;
    const latest = sessions.at(-1) ?? null;
    return {
      totalSessions: sessions.length,
      firstSessionDate: first?.sessionDate ?? null,
      latestSessionDate: latest?.sessionDate ?? null,
      latestComparison,
    };
  } catch (error) {
    if (isMissingVisualProgressSchemaError(error)) return emptyVisualProgressSummary();
    throw error;
  }
}

export async function getVisualProgressPageForTrainer(trainerId: string, studentId: string) {
  const student = await prisma.student.findFirst({
    where: { id: studentId, trainerId },
    include: {
      assessments: {
        orderBy: { assessmentDate: "desc" },
        select: assessmentSelect,
      },
      visualProgressSessions: {
        where: { deletedAt: null },
        orderBy: { sessionDate: "desc" },
        include: sessionInclude,
      },
      visualProgressComparisons: {
        orderBy: { createdAt: "desc" },
        take: 1,
        include: {
          initialSession: { include: { bodyAssessment: { select: assessmentSelect } } },
          finalSession: { include: { bodyAssessment: { select: assessmentSelect } } },
        },
      },
    },
  });
  if (!student) return null;
  return {
    ...student,
    visualProgressSessions: student.visualProgressSessions.map(withSessionPhotoUrls),
  };
}

export async function createVisualProgressSessionForTrainer(
  trainerId: string,
  studentId: string,
  input: VisualProgressSessionInput,
  photos: VisualProgressPhotoUpload[],
) {
  const validated = visualProgressSessionSchema.parse(input);
  if (photos.length < 1) throw new Error("Envie pelo menos uma foto.");
  const sessionId = randomUUID();
  const storedPhotos = await storePhotos({ trainerId, studentId, sessionId, photos });

  return prisma.$transaction(async (transaction) => {
    const student = await transaction.student.findFirstOrThrow({
      where: { id: studentId, trainerId },
      select: { id: true },
    });
    const bodyAssessmentId = await resolveBodyAssessmentId(transaction, {
      trainerId,
      studentId: student.id,
      sessionDate: validated.sessionDate,
      mode: validated.bodyAssessmentMode,
      bodyAssessmentId: validated.bodyAssessmentId,
    });

    const session = await transaction.visualProgressSession.create({
      data: {
        id: sessionId,
        trainerId,
        studentId: student.id,
        bodyAssessmentId,
        sessionDate: validated.sessionDate,
        weightKg: validated.weightKg ?? null,
        notes: toNullableText(validated.notes),
        photos: {
          create: storedPhotos.map((photo) => ({
            ...photoCreateData({ photo, studentId: student.id, trainerId }),
          })),
        },
      },
    });

    await writeAuditLog(transaction, {
      trainerId,
      entityType: "VisualProgressSession",
      entityId: session.id,
      action: "VISUAL_PROGRESS_SESSION_CREATED",
      newValue: {
        studentId: student.id,
        sessionDate: session.sessionDate.toISOString(),
        bodyAssessmentId,
        photoCount: storedPhotos.length,
      },
    });
    for (const photo of storedPhotos) {
      await writeAuditLog(transaction, {
        trainerId,
        entityType: "VisualProgressPhoto",
        entityId: photo.id,
        action: "VISUAL_PROGRESS_PHOTO_UPLOADED",
        newValue: { studentId: student.id, sessionId: session.id, angle: photo.angle },
      });
    }
    return session;
  });
}

export async function updateVisualProgressSessionForTrainer(
  trainerId: string,
  studentId: string,
  sessionId: string,
  input: VisualProgressSessionInput,
  photos: VisualProgressPhotoUpload[],
  removePhotoIds: string[],
) {
  const validated = visualProgressSessionSchema.parse(input);
  return prisma.$transaction(async (transaction) => {
    const current = await transaction.visualProgressSession.findFirstOrThrow({
      where: { id: sessionId, studentId, trainerId, deletedAt: null },
      include: { photos: { where: { deletedAt: null } } },
    });
    const bodyAssessmentId = await resolveBodyAssessmentId(transaction, {
      trainerId,
      studentId,
      sessionDate: validated.sessionDate,
      mode: validated.bodyAssessmentMode,
      bodyAssessmentId: validated.bodyAssessmentId,
    });

    const removable = new Set(
      current.photos
        .filter((photo) => removePhotoIds.includes(photo.id))
        .map((photo) => photo.id),
    );
    const newAngles = new Set(photos.map((photo) => photo.angle));
    const activeAfterRemoval = current.photos.filter(
      (photo) => !removable.has(photo.id) && !newAngles.has(photo.angle as VisualPhotoAngleValue),
    );
    if (activeAfterRemoval.length + photos.length < 1) throw new Error("A sessão precisa ter pelo menos uma foto.");

    const storedPhotos = await storePhotos({ trainerId, studentId, sessionId, photos });
    const now = new Date();
    const idsToRemove = [
      ...removable,
      ...current.photos
        .filter((photo) => newAngles.has(photo.angle as VisualPhotoAngleValue))
        .map((photo) => photo.id),
    ];

    await transaction.visualProgressPhoto.updateMany({
      where: { id: { in: idsToRemove }, sessionId, trainerId, studentId },
      data: { deletedAt: now },
    });

    const session = await transaction.visualProgressSession.update({
      where: { id: current.id },
      data: {
        bodyAssessmentId,
        sessionDate: validated.sessionDate,
        weightKg: validated.weightKg ?? null,
        notes: toNullableText(validated.notes),
        photos: {
          create: storedPhotos.map((photo) => ({
            ...photoCreateData({ photo, studentId, trainerId }),
          })),
        },
      },
    });

    await writeAuditLog(transaction, {
      trainerId,
      entityType: "VisualProgressSession",
      entityId: session.id,
      action: "VISUAL_PROGRESS_SESSION_UPDATED",
      oldValue: {
        sessionDate: current.sessionDate.toISOString(),
        bodyAssessmentId: current.bodyAssessmentId,
      },
      newValue: {
        sessionDate: session.sessionDate.toISOString(),
        bodyAssessmentId,
        removedPhotos: idsToRemove.length,
        uploadedPhotos: storedPhotos.length,
      },
    });
    for (const photoId of idsToRemove) {
      await writeAuditLog(transaction, {
        trainerId,
        entityType: "VisualProgressPhoto",
        entityId: photoId,
        action: "VISUAL_PROGRESS_PHOTO_REMOVED",
        newValue: { studentId, sessionId },
      });
    }
    for (const photo of storedPhotos) {
      await writeAuditLog(transaction, {
        trainerId,
        entityType: "VisualProgressPhoto",
        entityId: photo.id,
        action: "VISUAL_PROGRESS_PHOTO_UPLOADED",
        newValue: { studentId, sessionId, angle: photo.angle },
      });
    }
    return session;
  });
}

export async function deleteVisualProgressSessionForTrainer(
  trainerId: string,
  studentId: string,
  sessionId: string,
) {
  return prisma.$transaction(async (transaction) => {
    const current = await transaction.visualProgressSession.findFirstOrThrow({
      where: { id: sessionId, studentId, trainerId, deletedAt: null },
      select: { id: true, sessionDate: true },
    });
    const now = new Date();
    await transaction.visualProgressPhoto.updateMany({
      where: { sessionId: current.id, studentId, trainerId, deletedAt: null },
      data: { deletedAt: now },
    });
    const session = await transaction.visualProgressSession.update({
      where: { id: current.id },
      data: { deletedAt: now },
    });
    await writeAuditLog(transaction, {
      trainerId,
      entityType: "VisualProgressSession",
      entityId: session.id,
      action: "VISUAL_PROGRESS_SESSION_DELETED",
      oldValue: { sessionDate: current.sessionDate.toISOString() },
      newValue: { deletedAt: now.toISOString() },
    });
    return session;
  });
}

export async function getVisualProgressPhotoForTrainer(
  trainerId: string,
  input: {
    studentId: string;
    sessionId: string;
    photoId: string;
    variant?: "full" | "thumbnail";
  },
) {
  const photo = await prisma.visualProgressPhoto.findFirst({
    where: {
      id: input.photoId,
      studentId: input.studentId,
      sessionId: input.sessionId,
      trainerId,
      deletedAt: null,
      session: {
        id: input.sessionId,
        studentId: input.studentId,
        trainerId,
        deletedAt: null,
        student: { id: input.studentId, trainerId },
      },
    },
    select: {
      id: true,
      storagePath: true,
      thumbnailStoragePath: true,
      mimeType: true,
      fileName: true,
      fileSize: true,
      thumbnailFileSize: true,
    },
  });
  if (!photo) return null;
  const thumbnail = input.variant === "thumbnail";
  return {
    id: photo.id,
    storagePath: thumbnail ? photo.thumbnailStoragePath : photo.storagePath,
    mimeType: photo.mimeType,
    fileName: photo.fileName,
    fileSize: thumbnail ? photo.thumbnailFileSize : photo.fileSize,
  };
}

export async function getVisualProgressComparisonPageForTrainer(
  trainerId: string,
  studentId: string,
  initialSessionId?: string,
  finalSessionId?: string,
) {
  const student = await prisma.student.findFirst({
    where: { id: studentId, trainerId },
    include: {
      visualProgressSessions: {
        where: { deletedAt: null },
        orderBy: { sessionDate: "desc" },
        include: sessionInclude,
      },
    },
  });
  if (!student) return null;

  const sessions = student.visualProgressSessions.map(withSessionPhotoUrls);
  const initialSession =
    sessions.find((session) => session.id === initialSessionId) ??
    sessions.at(-1) ??
    null;
  const finalSession =
    sessions.find((session) => session.id === finalSessionId) ??
    sessions[0] ??
    null;
  const existingComparison = initialSession && finalSession
    ? await prisma.visualProgressComparison.findFirst({
        where: {
          trainerId,
          studentId,
          initialSessionId: initialSession.id,
          finalSessionId: finalSession.id,
        },
        orderBy: { updatedAt: "desc" },
      })
    : null;

  return { student, sessions, initialSession, finalSession, existingComparison };
}

export async function saveVisualProgressComparisonForTrainer(
  trainerId: string,
  studentId: string,
  input: VisualProgressComparisonInput,
) {
  const validated = visualProgressComparisonSchema.parse(input);
  return prisma.$transaction(async (transaction) => {
    const sessions = await transaction.visualProgressSession.findMany({
      where: {
        id: { in: [validated.initialSessionId, validated.finalSessionId] },
        studentId,
        trainerId,
        deletedAt: null,
      },
      select: { id: true },
    });
    if (sessions.length !== 2) throw new Error("Sessões inválidas para comparação.");
    const existing = await transaction.visualProgressComparison.findFirst({
      where: {
        trainerId,
        studentId,
        initialSessionId: validated.initialSessionId,
        finalSessionId: validated.finalSessionId,
      },
      orderBy: { updatedAt: "desc" },
    });
    const data = {
      visualPerception: validated.visualPerception ?? null,
      professionalComment: toNullableText(validated.professionalComment),
    };
    const comparison = existing
      ? await transaction.visualProgressComparison.update({ where: { id: existing.id }, data })
      : await transaction.visualProgressComparison.create({
          data: {
            trainerId,
            studentId,
            initialSessionId: validated.initialSessionId,
            finalSessionId: validated.finalSessionId,
            ...data,
          },
        });

    await writeAuditLog(transaction, {
      trainerId,
      entityType: "VisualProgressComparison",
      entityId: comparison.id,
      action: existing ? "VISUAL_PROGRESS_COMPARISON_UPDATED" : "VISUAL_PROGRESS_COMPARISON_CREATED",
      newValue: {
        studentId,
        initialSessionId: comparison.initialSessionId,
        finalSessionId: comparison.finalSessionId,
        visualPerception: comparison.visualPerception,
      },
    });
    return comparison;
  });
}

export function toAssessmentOption(assessment: {
  id: string;
  assessmentDate: Date;
  weightKg: unknown;
  bodyFatPercentage: unknown | null;
}) {
  const fat = assessment.bodyFatPercentage === null ? "gordura sem dados" : `${Number(assessment.bodyFatPercentage)}% gordura`;
  return {
    id: assessment.id,
    date: dateInputValue(assessment.assessmentDate),
    label: `${assessment.assessmentDate.toLocaleDateString("pt-BR")} · ${Number(assessment.weightKg)} kg · ${fat}`,
  };
}
