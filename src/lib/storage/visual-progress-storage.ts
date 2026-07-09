import "server-only";

import { GetObjectCommand, PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { Readable } from "node:stream";
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

function requiredEnv(name: string) {
  const value = process.env[name]?.trim();
  if (!value) throw new Error(`${name} nao esta configurada para o armazenamento R2.`);
  return value;
}

function r2Endpoint() {
  const explicitEndpoint = process.env.R2_ENDPOINT?.trim();
  if (explicitEndpoint) return explicitEndpoint;
  return `https://${requiredEnv("R2_ACCOUNT_ID")}.r2.cloudflarestorage.com`;
}

function storageObjectKey(storagePath: string) {
  const key = storagePath.replaceAll("\\", "/").replace(/^\/+/, "");
  if (!key || key.split("/").includes("..")) throw new Error("Caminho de imagem invalido.");
  return key;
}

async function responseBodyToBuffer(body: unknown) {
  if (!body) throw new Error("Resposta vazia do armazenamento R2.");

  if (body instanceof Uint8Array) return Buffer.from(body);

  const transformable = body as { transformToByteArray?: () => Promise<Uint8Array> };
  if (typeof transformable.transformToByteArray === "function") {
    return Buffer.from(await transformable.transformToByteArray());
  }

  const blobLike = body as { arrayBuffer?: () => Promise<ArrayBuffer> };
  if (typeof blobLike.arrayBuffer === "function") {
    return Buffer.from(await blobLike.arrayBuffer());
  }

  if (body instanceof Readable) {
    const chunks: Buffer[] = [];
    for await (const chunk of body) {
      chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
    }
    return Buffer.concat(chunks);
  }

  throw new Error("Formato de resposta do armazenamento R2 nao suportado.");
}

class R2VisualProgressStorageProvider implements VisualProgressStorageProvider {
  private bucket = requiredEnv("R2_BUCKET");

  private client = new S3Client({
    region: process.env.R2_REGION?.trim() || "auto",
    endpoint: r2Endpoint(),
    credentials: {
      accessKeyId: requiredEnv("R2_ACCESS_KEY_ID"),
      secretAccessKey: requiredEnv("R2_SECRET_ACCESS_KEY"),
    },
  });

  async put(input: StoragePutInput): Promise<void> {
    await this.client.send(new PutObjectCommand({
      Bucket: this.bucket,
      Key: storageObjectKey(input.storagePath),
      Body: input.buffer,
      ContentType: "image/webp",
      CacheControl: "private, max-age=31536000, immutable",
    }));
  }

  async get(input: StorageGetInput): Promise<Buffer> {
    const response = await this.client.send(new GetObjectCommand({
      Bucket: this.bucket,
      Key: storageObjectKey(input.storagePath),
    }));
    return responseBodyToBuffer(response.Body);
  }
}

function provider(): VisualProgressStorageProvider {
  const selected = (process.env.STORAGE_PROVIDER ?? "local").trim().toLowerCase();
  if (selected === "r2") return new R2VisualProgressStorageProvider();
  if (selected !== "local") throw new Error("STORAGE_PROVIDER deve ser local ou r2.");
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
  const selected = (process.env.STORAGE_PROVIDER ?? "local").trim().toLowerCase();
  if (selected === "r2") {
    requiredEnv("R2_BUCKET");
    requiredEnv("R2_ACCESS_KEY_ID");
    requiredEnv("R2_SECRET_ACCESS_KEY");
    r2Endpoint();
  }
  return true;
}
