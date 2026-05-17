// POST /api/profile/avatar  — upload, resize to 256×256, convert to WebP, save to public/avatars/
// DELETE /api/profile/avatar — remove avatar, clear user.image

import { NextResponse, type NextRequest } from "next/server";
import { writeFile, unlink, mkdir } from "fs/promises";
import path from "path";
import sharp from "sharp";
import { auth } from "@/lib/server/auth";
import { db } from "@/lib/server/db";

const MAX_BYTES = 5 * 1024 * 1024; // 5 MB
const ALLOWED_TYPES = new Set(["image/jpeg", "image/png", "image/webp", "image/gif"]);
const AVATAR_DIR = path.join(process.cwd(), "public", "avatars");

function avatarPath(userId: string): string {
  // path.basename strips any directory traversal from the id
  const safe = path.basename(userId).replace(/[^a-zA-Z0-9_-]/g, "");
  return path.join(AVATAR_DIR, `${safe}.webp`);
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const formData = await request.formData().catch(() => null);
  if (!formData) return NextResponse.json({ error: "Invalid form data" }, { status: 400 });

  const file = formData.get("file");
  if (!(file instanceof File)) return NextResponse.json({ error: "file field required" }, { status: 400 });

  if (!ALLOWED_TYPES.has(file.type)) {
    return NextResponse.json({ error: "Only JPEG, PNG, WebP or GIF images are accepted" }, { status: 415 });
  }

  if (file.size > MAX_BYTES) {
    return NextResponse.json({ error: "Image must be 5 MB or smaller" }, { status: 413 });
  }

  const buffer = Buffer.from(await file.arrayBuffer());

  let webp: Buffer;
  try {
    webp = await sharp(buffer)
      .resize(256, 256, { fit: "cover", position: "centre" })
      .webp({ quality: 80 })
      .toBuffer();
  } catch {
    return NextResponse.json({ error: "Could not process image — make sure it is a valid image file" }, { status: 422 });
  }

  await mkdir(AVATAR_DIR, { recursive: true });
  await writeFile(avatarPath(session.user.id), webp);

  const imageUrl = `/avatars/${session.user.id}.webp?v=${Date.now()}`;

  await db.user.update({
    where: { id: session.user.id },
    data: { image: imageUrl },
  });

  return NextResponse.json({ image: imageUrl });
}

export async function DELETE(): Promise<NextResponse> {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  await unlink(avatarPath(session.user.id)).catch(() => null);

  await db.user.update({
    where: { id: session.user.id },
    data: { image: null },
  });

  return NextResponse.json({ success: true });
}
