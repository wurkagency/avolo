import { NextResponse } from "next/server";
import { fetchHotellookPhotos, fetchPlacesPhotos } from "@/lib/server/photos";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const hotelId = searchParams.get("hotelId");
  const name = searchParams.get("name");

  if (hotelId) {
    const photos = await fetchHotellookPhotos(hotelId);
    if (photos.length > 0) return NextResponse.json({ photos });
  }

  // Fallback: Google Places by hotel name (also handles stubs)
  if (name) {
    const photos = await fetchPlacesPhotos(name, 4);
    return NextResponse.json({ photos });
  }

  return NextResponse.json({ photos: [] });
}
