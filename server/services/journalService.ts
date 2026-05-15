import { db } from "@/lib/server/db";
import { callAIText } from "@/lib/ai/aiClient";
import type { JournalArticle } from "@prisma/client";

export function toSlug(iataCode: string, destination: string): string {
  const dest = destination
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
  return `${iataCode.toLowerCase()}-${dest}`;
}

function buildJournalPrompt(destination: string, iataCode: string): string {
  return `Write a comprehensive travel guide for ${destination} (airport: ${iataCode}) in clean Markdown.

The guide helps travelers plan a real trip. Use exactly these section headings and nothing else:

## Overview
A vivid 2-3 paragraph introduction — culture, atmosphere, what makes it genuinely special.

## Getting Around
Transport from the airport to the city, local transit options, rideshare availability, walking areas.

## Car Rental Tips
Driving rules, parking costs, toll roads, age/license requirements, regional road quirks.

## Where to Stay
Neighborhood breakdown — which areas suit different travel styles (budget, central, beach, etc.).

## Top Experiences
5-7 bullet points spanning culture, food, nature, and adventure — be specific, not generic.

## Hidden Fees & Gotchas
Tourist taxes, resort fees, airport surcharges, seasonal pricing, tipping expectations.

## Local Tips
3-5 insider observations that most travel guides miss. Practical and specific.

## Best Time to Visit
Month-by-month summary of weather, crowd levels, and price ranges.

Rules: friendly but authoritative tone, never write "a wonderful destination", start directly with ## Overview, no title heading, no code fences, no preamble.`;
}

export async function listArticles(): Promise<JournalArticle[]> {
  return db.journalArticle.findMany({
    where: { publishedAt: { not: null } },
    orderBy: { generatedAt: "desc" },
  });
}

export async function getArticleBySlug(slug: string): Promise<JournalArticle | null> {
  return db.journalArticle.findUnique({ where: { slug } });
}

export async function getOrGenerateArticle(
  iataCode: string,
  destination: string,
): Promise<JournalArticle> {
  const slug = toSlug(iataCode, destination);

  const existing = await db.journalArticle.findUnique({ where: { slug } });
  if (existing) return existing;

  const prompt = buildJournalPrompt(destination, iataCode);
  const raw = await callAIText(prompt);

  // Strip accidental code fences some models wrap around markdown
  const body = raw
    .replace(/^```(?:markdown)?\s*/i, "")
    .replace(/\s*```$/, "")
    .trim();

  const title = `${destination} Travel Guide`;

  try {
    return await db.journalArticle.create({
      data: {
        slug,
        destination,
        iataCode: iataCode.toUpperCase(),
        title,
        body,
        aiModel: "sequential-failover",
        publishedAt: new Date(),
      },
    });
  } catch (err) {
    // Race condition — another request generated the same article concurrently
    const code = (err as { code?: string })?.code;
    if (code === "P2002") {
      const refetched = await db.journalArticle.findUnique({ where: { slug } });
      if (refetched) return refetched;
    }
    throw err;
  }
}
