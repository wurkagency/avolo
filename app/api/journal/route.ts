// GET /api/journal — returns all published journal articles (summary list)

import { NextResponse } from "next/server";
import { listArticles } from "@/server/services/journalService";

export async function GET(): Promise<NextResponse> {
  const articles = await listArticles();

  const summary = articles.map((a) => ({
    slug: a.slug,
    destination: a.destination,
    iataCode: a.iataCode,
    title: a.title,
    generatedAt: a.generatedAt,
    publishedAt: a.publishedAt,
  }));

  return NextResponse.json(summary);
}
