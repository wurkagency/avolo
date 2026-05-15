import { Suspense } from "react";
import { notFound } from "next/navigation";
import Link from "next/link";
import { db } from "@/lib/server/db";
import { getOrGenerateArticle } from "@/server/services/journalService";
import { ArticleBody } from "@/components/journal/ArticleBody";

export const dynamic = "force-dynamic";

interface Props {
  params: { slug: string };
  searchParams: { destination?: string; iata?: string };
}

async function ArticleContent({ slug, destination, iataCode }: {
  slug: string;
  destination: string | undefined;
  iataCode: string | undefined;
}) {
  // If destination + iata are provided (link from results), generate on demand
  if (destination && iataCode) {
    const article = await getOrGenerateArticle(iataCode, destination);
    return <ArticleBody body={article.body} />;
  }

  // Otherwise look up by slug only (direct URL or journal listing link)
  const article = await db.journalArticle.findUnique({ where: { slug } });
  if (!article) notFound();
  return <ArticleBody body={article.body} />;
}

async function ArticleMeta({ slug, destination, iataCode }: {
  slug: string;
  destination: string | undefined;
  iataCode: string | undefined;
}) {
  if (destination && iataCode) {
    return (
      <div className="mb-8">
        <div className="flex items-center gap-2 mb-3">
          <span className="inline-flex items-center rounded-full bg-primary/10 px-3 py-0.5 text-xs font-medium text-primary">
            {iataCode.toUpperCase()}
          </span>
        </div>
        <h1
          className="text-3xl font-bold text-on-surface"
          style={{ fontFamily: "var(--font-manrope)" }}
        >
          {destination} Travel Guide
        </h1>
      </div>
    );
  }

  const article = await db.journalArticle.findUnique({
    where: { slug },
    select: { title: true, iataCode: true, generatedAt: true },
  });
  if (!article) return null;

  return (
    <div className="mb-8">
      <div className="flex items-center gap-2 mb-3">
        <span className="inline-flex items-center rounded-full bg-primary/10 px-3 py-0.5 text-xs font-medium text-primary">
          {article.iataCode}
        </span>
        <span className="text-xs text-on-surface-variant">
          {new Intl.DateTimeFormat("en", { dateStyle: "medium" }).format(
            new Date(article.generatedAt),
          )}
        </span>
      </div>
      <h1
        className="text-3xl font-bold text-on-surface"
        style={{ fontFamily: "var(--font-manrope)" }}
      >
        {article.title}
      </h1>
    </div>
  );
}

export default function JournalArticlePage({ params, searchParams }: Props) {
  const { slug } = params;
  const destination = searchParams.destination;
  const iataCode = searchParams.iata;

  return (
    <main className="mx-auto max-w-3xl px-4 py-10 sm:px-6">
      <Link
        href="/journal"
        className="inline-flex items-center gap-1 text-sm text-on-surface-variant hover:text-on-surface mb-8 transition-colors"
      >
        <span className="material-symbols-outlined text-base">arrow_back</span>
        Travel Journal
      </Link>

      <Suspense
        fallback={
          <div className="h-10 w-64 rounded-xl bg-surface-container animate-pulse mb-8" />
        }
      >
        <ArticleMeta slug={slug} destination={destination} iataCode={iataCode} />
      </Suspense>

      <Suspense
        fallback={
          <div className="flex flex-col gap-4">
            <div className="flex items-center gap-3 py-4 text-on-surface-variant">
              <span className="inline-block h-5 w-5 animate-spin rounded-full border-2 border-primary border-t-transparent" />
              <span>Generating travel guide…</span>
            </div>
            {[...Array(6)].map((_, i) => (
              <div key={i} className="h-4 rounded bg-surface-container animate-pulse" style={{ width: `${75 + (i % 3) * 10}%` }} />
            ))}
          </div>
        }
      >
        <ArticleContent slug={slug} destination={destination} iataCode={iataCode} />
      </Suspense>
    </main>
  );
}
