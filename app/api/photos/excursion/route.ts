import { NextResponse } from "next/server";
import { fetchPlacesPhotos, fetchUnsplashPhotos } from "@/lib/server/photos";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const title = searchParams.get("title")?.trim() ?? "";
  const location = searchParams.get("location")?.trim() ?? "";
  if (!title && !location) return NextResponse.json({ photos: [] });

  const query = [title, location].filter(Boolean).join(" ");

  let photos = await fetchPlacesPhotos(query, 5);

  if (photos.length === 0) {
    photos = await fetchUnsplashPhotos(query, 5);
  }

  return NextResponse.json({ photos });
}
