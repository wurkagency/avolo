import { NextResponse } from "next/server";
import { fetchHotellookPhotos, fetchPlacesPhotos, fetchUnsplashPhotos } from "@/lib/server/photos";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const hotelId = searchParams.get("hotelId");
  const name = searchParams.get("name");

  if (hotelId) {
    const photos = await fetchHotellookPhotos(hotelId);
    if (photos.length > 0) return NextResponse.json({ photos });
  }

  if (name) {
    const placesPhotos = await fetchPlacesPhotos(name, 4);
    if (placesPhotos.length > 0) return NextResponse.json({ photos: placesPhotos });

    // Unsplash fallback: stub hotels or when Places can't find the specific hotel
    const unsplashPhotos = await fetchUnsplashPhotos(`${name} hotel`, 4);
    if (unsplashPhotos.length > 0) return NextResponse.json({ photos: unsplashPhotos });
  }

  return NextResponse.json({ photos: [] });
}
