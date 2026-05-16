import { NextResponse } from "next/server";
import { fetchHotellookPhotos } from "@/lib/server/photos";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const hotelId = searchParams.get("hotelId");
  if (!hotelId) return NextResponse.json({ photos: [] });
  const photos = await fetchHotellookPhotos(hotelId);
  return NextResponse.json({ photos });
}
