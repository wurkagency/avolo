import { NextResponse } from "next/server";
import { fetchUnsplashPhotos } from "@/lib/server/photos";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const query = searchParams.get("query")?.trim();
  const count = Math.min(10, parseInt(searchParams.get("count") ?? "5", 10));
  if (!query) return NextResponse.json({ photos: [] });

  const photos = await fetchUnsplashPhotos(query, count);
  return NextResponse.json({ photos });
}
