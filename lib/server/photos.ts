const UNSPLASH_KEY = process.env.UNSPLASH_ACCESS_KEY ?? "";
const MAPS_KEY = process.env.GOOGLE_MAPS_API_KEY ?? "";

export async function fetchHotellookPhotos(hotelId: string, count = 6): Promise<string[]> {
  try {
    const url = `https://yasen.hotellook.com/photos/hotel_photos?id=${encodeURIComponent(hotelId)}`;
    const res = await fetch(url, { signal: AbortSignal.timeout(5_000) });
    if (!res.ok) return [];
    const body = await res.json() as Record<string, unknown[]>;
    const firstKey = Object.keys(body)[0] as string | undefined;
    if (!firstKey) return [];
    const refs = body[firstKey];
    if (!Array.isArray(refs) || refs.length === 0) return [];
    return refs.slice(0, count).flatMap((ref) => {
      const id = typeof ref === "string" || typeof ref === "number"
        ? String(ref)
        : (ref as { id?: string | number }).id !== undefined
          ? String((ref as { id: string | number }).id)
          : null;
      return id ? [`https://photo.hotellook.com/image_v2/limit/${id}/800/520.jpg`] : [];
    });
  } catch {
    return [];
  }
}

export async function fetchUnsplashPhoto(query: string): Promise<string | null> {
  if (!UNSPLASH_KEY) return null;
  try {
    const url = `https://api.unsplash.com/search/photos?query=${encodeURIComponent(query)}&per_page=1&client_id=${UNSPLASH_KEY}`;
    const res = await fetch(url, { signal: AbortSignal.timeout(5_000) });
    if (!res.ok) return null;
    const body = await res.json() as { results: Array<{ urls: { regular: string } }> };
    return body.results[0]?.urls?.regular ?? null;
  } catch {
    return null;
  }
}

export async function fetchUnsplashPhotos(query: string, count = 5): Promise<string[]> {
  if (!UNSPLASH_KEY) return [];
  try {
    const url = `https://api.unsplash.com/search/photos?query=${encodeURIComponent(query)}&per_page=${count}&client_id=${UNSPLASH_KEY}`;
    const res = await fetch(url, { signal: AbortSignal.timeout(5_000) });
    if (!res.ok) return [];
    const body = await res.json() as { results: Array<{ urls: { regular: string } }> };
    return body.results.map((r) => r.urls.regular);
  } catch {
    return [];
  }
}

export async function fetchPlacesPhoto(query: string): Promise<string | null> {
  if (!MAPS_KEY) return null;
  try {
    const searchUrl = `https://maps.googleapis.com/maps/api/place/textsearch/json?query=${encodeURIComponent(query)}&key=${MAPS_KEY}`;
    const searchRes = await fetch(searchUrl, { signal: AbortSignal.timeout(5_000) });
    if (!searchRes.ok) return null;
    const searchBody = await searchRes.json() as { results: Array<{ place_id: string }> };
    const placeId = searchBody.results[0]?.place_id;
    if (!placeId) return null;

    const detailUrl = `https://maps.googleapis.com/maps/api/place/details/json?place_id=${placeId}&fields=photos&key=${MAPS_KEY}`;
    const detailRes = await fetch(detailUrl, { signal: AbortSignal.timeout(5_000) });
    if (!detailRes.ok) return null;
    const detailBody = await detailRes.json() as { result: { photos?: Array<{ photo_reference: string }> } };
    const ref = detailBody.result?.photos?.[0]?.photo_reference;
    if (!ref) return null;

    return `https://maps.googleapis.com/maps/api/place/photo?maxwidth=800&photoreference=${ref}&key=${MAPS_KEY}`;
  } catch {
    return null;
  }
}

export async function fetchPlacesPhotos(query: string, count = 5): Promise<string[]> {
  if (!MAPS_KEY) return [];
  try {
    const searchUrl = `https://maps.googleapis.com/maps/api/place/textsearch/json?query=${encodeURIComponent(query)}&key=${MAPS_KEY}`;
    const searchRes = await fetch(searchUrl, { signal: AbortSignal.timeout(5_000) });
    if (!searchRes.ok) return [];
    const searchBody = await searchRes.json() as { results: Array<{ place_id: string }> };
    const placeId = searchBody.results[0]?.place_id;
    if (!placeId) return [];

    const detailUrl = `https://maps.googleapis.com/maps/api/place/details/json?place_id=${placeId}&fields=photos&key=${MAPS_KEY}`;
    const detailRes = await fetch(detailUrl, { signal: AbortSignal.timeout(5_000) });
    if (!detailRes.ok) return [];
    const detailBody = await detailRes.json() as { result: { photos?: Array<{ photo_reference: string }> } };
    const refs = (detailBody.result?.photos ?? []).slice(0, count);
    return refs.map((p) => `https://maps.googleapis.com/maps/api/place/photo?maxwidth=800&photoreference=${p.photo_reference}&key=${MAPS_KEY}`);
  } catch {
    return [];
  }
}
