// GET /api/journal/[slug] — returns a single article (generates on demand if missing)

import { NextResponse, type NextRequest } from "next/server";
import { getArticleBySlug } from "@/server/services/journalService";

export async function GET(
  _request: NextRequest,
  { params }: { params: { slug: string } },
): Promise<NextResponse> {
  const article = await getArticleBySlug(params.slug);
  if (!article) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(article);
}
