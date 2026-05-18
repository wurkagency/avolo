import { NextResponse, type NextRequest } from "next/server";
import { readFile, access } from "fs/promises";
import path from "path";
import { getAvatarDir } from "@/lib/server/avatarDir";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
): Promise<Response> {
  const { id } = await params;
  const safeId = id.replace(/[^a-zA-Z0-9_-]/g, "");
  if (!safeId) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const filePath = path.join(getAvatarDir(), `${safeId}.webp`);

  try {
    await access(filePath);
    const buffer = await readFile(filePath);
    return new Response(buffer, {
      headers: {
        "Content-Type": "image/webp",
        "Cache-Control": "public, max-age=31536000, immutable",
      },
    });
  } catch {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
}
