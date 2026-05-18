import { Suspense } from "react";
import { notFound } from "next/navigation";
import Link from "next/link";
import { db } from "@/lib/server/db";
import { getOrGenerateArticle } from "@/server/services/journalService";
import { ArticleBody } from "@/components/journal/ArticleBody";
import { fetchUnsplashPhoto } from "@/lib/server/photos";

export const dynamic = "force-dynamic";

interface Props {
  params: { slug: string };
  searchParams: { destination?: string; iata?: string };
}

async function ArticleHeroImage({ slug, destination }: {
  slug: string;
  destination: string | undefined;
}) {
  let dest = destination;
  if (!dest) {
    const article = await db.journalArticle.findUnique({ where: { slug }, select: { destination: true } });
    dest = article?.destination ?? undefined;
  }
  if (!dest) return null;

  const imageUrl = await fetchUnsplashPhoto(`${dest} travel destination landscape`);
  if (!imageUrl) return null;

  return (
    <div className="w-full overflow-hidden rounded-lg mb-8" style={{ height: 480 }}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={imageUrl}
        alt={dest}
        className="w-full h-full object-cover"
      />
    </div>
  );
}

async function ArticleContent({ slug, destination, iataCode }: {
  slug: string;
  destination: string | undefined;
  iataCode: string | undefined;
}) {
  if (destination && iataCode) {
    const article = await getOrGenerateArticle(iataCode, destination);
    return <ArticleBody body={article.body} />;
  }

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
      <div className="mb-6">
        <div className="flex items-center gap-2 mb-3">
          <span className="inline-flex items-center rounded-full bg-primary/10 px-3 py-0.5 text-xs font-medium text-primary">
            {iataCode.toUpperCase()}
          </span>
        </div>
        <h1
          className="text-3xl font-bold text-ink"
          style={{ fontFamily: "var(--font-editorial)" }}
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
    <div className="mb-6">
      <div className="flex items-center gap-2 mb-3">
        <span className="inline-flex items-center rounded-full bg-primary/10 px-3 py-0.5 text-xs font-medium text-primary">
          {article.iataCode}
        </span>
        <span className="text-xs text-steel">
          {new Intl.DateTimeFormat("en", { dateStyle: "medium" }).format(
            new Date(article.generatedAt),
          )}
        </span>
      </div>
      <h1
        className="text-3xl font-bold text-ink"
        style={{ fontFamily: "var(--font-editorial)" }}
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
    <main className="mx-auto max-w-[840px] px-4 sm:px-6 py-6 sm:py-10">
      <Link
        href="/journal"
        className="inline-flex items-center gap-1 text-sm text-steel hover:text-ink mb-8 transition-colors"
      >
        <span className="material-symbols-outlined text-base">arrow_back</span>
        Travel Journal
      </Link>

      <Suspense
        fallback={
          <div className="h-10 w-64 rounded-xl bg-surface animate-pulse mb-6" />
        }
      >
        <ArticleMeta slug={slug} destination={destination} iataCode={iataCode} />
      </Suspense>

      {/* Hero image — full width × 480px, between heading and body */}
      <Suspense
        fallback={
          <div className="w-full rounded-lg bg-surface animate-pulse mb-8" style={{ height: 480 }} />
        }
      >
        <ArticleHeroImage slug={slug} destination={destination} />
      </Suspense>

      <Suspense
        fallback={
          <div className="flex flex-col gap-4">
            <div className="flex items-center gap-3 py-4 text-steel">
              <span className="inline-block h-5 w-5 animate-spin rounded-full border-2 border-primary border-t-transparent" />
              <span>Generating travel guide…</span>
            </div>
            {[...Array(6)].map((_, i) => (
              <div key={i} className="h-4 rounded bg-surface animate-pulse" style={{ width: `${75 + (i % 3) * 10}%` }} />
            ))}
          </div>
        }
      >
        <ArticleContent slug={slug} destination={destination} iataCode={iataCode} />
      </Suspense>
    </main>
  );
}
