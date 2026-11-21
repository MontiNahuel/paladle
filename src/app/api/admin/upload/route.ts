import { put } from "@vercel/blob";
import { NextResponse } from "next/server";
import { requireAdminApi } from "@/lib/admin-route-guard";

const ALLOWED_MIME_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
]);
const MAX_FILE_BYTES = 4 * 1024 * 1024; // 4 MB

export async function POST(request: Request) {
  const denied = await requireAdminApi();
  if (denied) return denied;

  if (!process.env.BLOB_READ_WRITE_TOKEN) {
    return NextResponse.json(
      {
        error:
          "BLOB_READ_WRITE_TOKEN no está configurado. Creá el Blob Store en Vercel y agregá el token en tus variables de entorno.",
      },
      { status: 500 }
    );
  }

  const formData = await request.formData().catch(() => null);
  const file = formData?.get("file");
  const folderRaw = String(formData?.get("folder") ?? "avatars");
  const folder = ["avatars", "themes", "logos"].includes(folderRaw)
    ? folderRaw
    : "avatars";

  if (!(file instanceof File)) {
    return NextResponse.json(
      { error: "Adjuntá un archivo de imagen válido." },
      { status: 400 }
    );
  }

  if (!ALLOWED_MIME_TYPES.has(file.type)) {
    return NextResponse.json(
      { error: "Formato no soportado. Usá PNG, JPG, WEBP o GIF." },
      { status: 400 }
    );
  }

  if (file.size > MAX_FILE_BYTES) {
    return NextResponse.json(
      { error: "La imagen supera el máximo de 4 MB." },
      { status: 400 }
    );
  }

  const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "-");
  const blob = await put(`paladle/${folder}/${safeName}`, file, {
    access: "public",
    addRandomSuffix: true,
  });

  return NextResponse.json({ url: blob.url });
}
