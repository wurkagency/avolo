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

// In standalone mode process.cwd() is the standalone dir. APP_ROOT lets the
// server override this explicitly so uploads land in the right place.
const APP_ROOT = process.env.APP_ROOT ?? process.cwd();
const AVATAR_DIR = path.join(APP_ROOT, "public", "avatars");

function safeUserId(userId: string): string {
  return path.basename(userId).replace(/[^a-zA-Z0-9_-]/g, "");
}

function avatarFilePath(userId: string): string {
  return path.join(AVATAR_DIR, `${safeUserId(userId)}.webp`);
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

  const safeId  = safeUserId(session.user.id);
  const imageUrl = `/avatars/${safeId}.webp?v=${Date.now()}`;

  try {
    await mkdir(AVATAR_DIR, { recursive: true });
    await writeFile(avatarFilePath(session.user.id), webp);
  } catch (err) {
    console.error("[avatar] write failed:", err);
    return NextResponse.json({ error: "Failed to save image — check server write permissions" }, { status: 500 });
  }

  try {
    await db.user.update({
      where: { id: session.user.id },
      data: { image: imageUrl },
    });
  } catch (err) {
    console.error("[avatar] db update failed:", err);
    return NextResponse.json({ error: "Failed to update profile" }, { status: 500 });
  }

  return NextResponse.json({ image: imageUrl });
}

export async function DELETE(): Promise<NextResponse> {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  await unlink(avatarFilePath(session.user.id)).catch(() => null);

  await db.user.update({
    where: { id: session.user.id },
    data: { image: null },
  });

  return NextResponse.json({ success: true });
}
