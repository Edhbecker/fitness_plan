import { type NextRequest, NextResponse } from "next/server";
import { requireTrainerId } from "@/lib/auth/require-trainer";
import { getProtectedVisualProgressImage } from "@/lib/storage/visual-progress-storage";
import { getVisualProgressPhotoForTrainer } from "@/services/visual-progress";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ studentId: string; sessionId: string; photoId: string }> },
) {
  const { studentId, sessionId, photoId } = await params;
  const variant = request.nextUrl.searchParams.get("variant") === "thumbnail" ? "thumbnail" : "full";

  let trainerId: string;
  try {
    trainerId = await requireTrainerId();
  } catch {
    return new NextResponse("Não autorizado.", { status: 403 });
  }

  const photo = await getVisualProgressPhotoForTrainer(trainerId, {
    studentId,
    sessionId,
    photoId,
    variant,
  });
  if (!photo) return new NextResponse("Imagem não encontrada.", { status: 404 });

  let file: Buffer;
  try {
    file = await getProtectedVisualProgressImage(photo.storagePath);
  } catch {
    return new NextResponse("Arquivo da imagem não encontrado no storage.", { status: 404 });
  }

  return new NextResponse(new Uint8Array(file), {
    status: 200,
    headers: {
      "Content-Type": "image/webp",
      "Content-Length": String(photo.fileSize),
      "Content-Disposition": `inline; filename="${encodeURIComponent(photo.fileName)}"`,
      "Cache-Control": "private, max-age=300",
      "X-Content-Type-Options": "nosniff",
    },
  });
}
