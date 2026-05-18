// POST /api/profile/avatar  — upload, resize to 256×256, convert to WebP, save to public/avatars/
// DELETE /api/profile/avatar — remove avatar, clear user.image

import { NextResponse, type NextRequest } from "next/server";
import { writeFile, unlink, mkdir, access } from "fs/promises";
import path from "path";
import sharp from "sharp";
import { auth } from "@/lib/server/auth";
import { db } from "@/lib/server/db";

const MAX_BYTES = 5 * 1024 * 1024; // 5 MB
const ALLOWED_TYPES = new Set(["image/jpeg", "image/png", "image/webp", "image/gif"]);

// Resolve the directory where Next.js standalone serves static public files.
// In production PM2 starts from APP_DIR, so process.cwd() = APP_DIR, not the
// standalone dir. standalone/public/ is what the server actually serves from.
// Detection order:
//   1. APP_ROOT env var (explicit override, e.g. .next/standalone)
//   2. process.cwd()/server.js exists → we're already inside standalone dir
//   3. process.cwd()/.next/standalone exists → use that
//   4. Fallback to process.cwd() (local dev, works fine)
async function resolveAppRoot(): Promise<string> {
  if (process.env.APP_ROOT) return process.env.APP_ROOT;
  const cwd = process.cwd();
  try {
    await access(path.join(cwd, "server.js"));
    return cwd; // already in standalone dir
  } catch { /* not standalone dir */ }
  try {
    await access(path.join(cwd, ".next", "standalone"));
    return path.join(cwd, ".next", "standalone");
  } catch { /* no standalone dir */ }
  return cwd; // local dev
}

// Resolved once at first request; cached for the process lifetime.
let avatarDirPromise: Promise<string> | null = null;
function getAvatarDir(): Promise<string> {
  if (!avatarDirPromise) {
    avatarDirPromise = resolveAppRoot().then((root) => path.join(root, "public", "avatars"));
  }
  return avatarDirPromise;
}

function safeUserId(userId: string): string {
  return path.basename(userId).replace(/[^a-zA-Z0-9_-]/g, "");
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

  let buffer: Buffer;
  try {
    buffer = Buffer.from(await file.arrayBuffer());
  } catch {
    return NextResponse.json({ error: "Failed to read uploaded file" }, { status: 400 });
  }

  let webp: Buffer;
  try {
    webp = await sharp(buffer)
      .resize(256, 256, { fit: "cover", position: "centre" })
      .webp({ quality: 80 })
      .toBuffer();
  } catch {
    return NextResponse.json({ error: "Could not process image — make sure it is a valid image file" }, { status: 422 });
  }

  const avatarDir = await getAvatarDir();
  const safeId = safeUserId(session.user.id);
  const filePath = path.join(avatarDir, `${safeId}.webp`);
  const imageUrl = `/avatars/${safeId}.webp?v=${Date.now()}`;

  try {
    await mkdir(avatarDir, { recursive: true });
    await writeFile(filePath, webp);
  } catch (err) {
    console.error("[avatar] write failed:", err, "dir:", avatarDir);
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

  const avatarDir = await getAvatarDir();
  const filePath = path.join(avatarDir, `${safeUserId(session.user.id)}.webp`);
  await unlink(filePath).catch(() => null);

  await db.user.update({
    where: { id: session.user.id },
    data: { image: null },
  });

  return NextResponse.json({ success: true });
}
