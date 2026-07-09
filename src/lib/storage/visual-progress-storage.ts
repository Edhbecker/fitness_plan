import "server-only";

import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";
import {
  visualProgressAllowedMimeTypes,
  visualProgressMaxFileSize,
  type VisualPhotoAngleValue,
} from "@/lib/visual-progress";

const allowedExtensions = new Set([".jpg", ".jpeg", ".png", ".webp"]);

type ImageVariant = {
  buffer: Buffer;
  width: number;
  height: number;
  fileSize: number;
};

type StoragePutInput = {
  storagePath: string;
  buffer: Buffer;
};

type StorageGetInput = {
  storagePath: string;
};

interface VisualProgressStorageProvider {
  put(input: StoragePutInput): Promise<void>;
  get(input: StorageGetInput): Promise<Buffer>;
}

class LocalVisualProgressStorageProvider implements VisualProgressStorageProvider {
  private root = path.join(process.cwd(), ".localappdata");

  private resolve(storagePath: string) {
    const absolutePath = path.resolve(this.root, storagePath);
    if (absolutePath !== this.root && !absolutePath.startsWith(`${this.root}${path.sep}`)) {
      throw new Error("Caminho de imagem inválido.");
    }
    return absolutePath;
  }

  async put(input: StoragePutInput) {
    const absolutePath = this.resolve(input.storagePath);
    await mkdir(path.dirname(absolutePath), { recursive: true });
    await writeFile(absolutePath, input.buffer);
  }

  async get(input: StorageGetInput) {
    return readFile(this.resolve(input.storagePath));
  }
}

class R2VisualProgressStorageProvider implements VisualProgressStorageProvider {
  async put(): Promise<void> {
    throw new Error("Storage R2 ainda não configurado. Use STORAGE_PROVIDER=local neste ambiente.");
  }

  async get(): Promise<Buffer> {
    throw new Error("Storage R2 ainda não configurado. Use STORAGE_PROVIDER=local neste ambiente.");
  }
}

function provider(): VisualProgressStorageProvider {
  const selected = process.env.STORAGE_PROVIDER ?? "local";
  if (selected === "r2") return new R2VisualProgressStorageProvider();
  return new LocalVisualProgressStorageProvider();
}

function sanitizeFileName(name: string) {
  return name.normalize("NFD").replace(/\p{Diacritic}/gu, "").replace(/[^a-zA-Z0-9._-]+/g, "-").slice(0, 120) || "foto";
}

function safeAngleName(angle: VisualPhotoAngleValue) {
  return angle.toLowerCase().replaceAll("_", "-");
}

function assertImageFile(file: File) {
  if (file.size <= 0) throw new Error("Arquivo vazio.");
  if (file.size > visualProgressMaxFileSize) throw new Error("Arquivo acima de 5 MB.");
  if (!allowedExtensions.has(path.extname(file.name).toLowerCase())) {
    throw new Error("Extensão inválida. Use JPG, JPEG, PNG ou WEBP.");
  }
  if (!visualProgressAllowedMimeTypes.includes(file.type as (typeof visualProgressAllowedMimeTypes)[number])) {
    throw new Error("Formato inválido. Use JPG, PNG ou WEBP.");
  }
}

async function toWebpVariant(source: Buffer, maxSide: number, quality: number): Promise<ImageVariant> {
  const output = await sharp(source)
    .rotate()
    .resize({ width: maxSide, height: maxSide, fit: "inside", withoutEnlargement: true })
    .webp({ quality })
    .toBuffer({ resolveWithObject: true });

  return {
    buffer: output.data,
    width: output.info.width,
    height: output.info.height,
    fileSize: output.info.size,
  };
}

export type StoredVisualProgressPhoto = {
  angle: VisualPhotoAngleValue;
  originalFileName: string;
  fileName: string;
  storagePath: string;
  thumbnailStoragePath: string;
  mimeType: "image/webp";
  fileSize: number;
  thumbnailFileSize: number;
  width: number;
  height: number;
  thumbnailWidth: number;
  thumbnailHeight: number;
};

export async function uploadVisualProgressImage(input: {
  trainerId: string;
  studentId: string;
  sessionId: string;
  angle: VisualPhotoAngleValue;
  file: File;
}): Promise<StoredVisualProgressPhoto> {
  assertImageFile(input.file);

  const source = Buffer.from(await input.file.arrayBuffer());
  const [main, thumbnail] = await Promise.all([
    toWebpVariant(source, 1600, 80),
    toWebpVariant(source, 400, 70),
  ]);

  const angleName = safeAngleName(input.angle);
  const directory = path.posix.join(
    "visual-progress",
    `trainer_${input.trainerId}`,
    `student_${input.studentId}`,
    `session_${input.sessionId}`,
  );
  const fileName = `${angleName}.webp`;
  const thumbnailFileName = `${angleName}-thumb.webp`;
  const storagePath = path.posix.join(directory, fileName);
  const thumbnailStoragePath = path.posix.join(directory, thumbnailFileName);
  const storage = provider();

  await Promise.all([
    storage.put({ storagePath, buffer: main.buffer }),
    storage.put({ storagePath: thumbnailStoragePath, buffer: thumbnail.buffer }),
  ]);

  return {
    angle: input.angle,
    originalFileName: sanitizeFileName(input.file.name),
    fileName,
    storagePath,
    thumbnailStoragePath,
    mimeType: "image/webp",
    fileSize: main.fileSize,
    thumbnailFileSize: thumbnail.fileSize,
    width: main.width,
    height: main.height,
    thumbnailWidth: thumbnail.width,
    thumbnailHeight: thumbnail.height,
  };
}

export async function getProtectedVisualProgressImage(storagePath: string) {
  return provider().get({ storagePath });
}

export function getVisualProgressImageUrl(input: {
  studentId: string;
  sessionId: string;
  photoId: string;
  variant?: "full" | "thumbnail";
}) {
  const params = new URLSearchParams();
  if (input.variant === "thumbnail") params.set("variant", "thumbnail");
  const suffix = params.toString() ? `?${params.toString()}` : "";
  return `/api/students/${input.studentId}/visual-progress/sessions/${input.sessionId}/photos/${input.photoId}${suffix}`;
}

export async function getSignedVisualProgressImageUrl(input: {
  studentId: string;
  sessionId: string;
  photoId: string;
  variant?: "full" | "thumbnail";
}) {
  return getVisualProgressImageUrl(input);
}

export async function deleteVisualProgressImage() {
  // Remoção física fica intencionalmente desativada no MVP.
  // A aplicação usa exclusão lógica para preservar histórico e auditoria.
}

export function validateVisualProgressStorageAccess() {
  return true;
}
