import { Suspense } from "react";
import { listArticles } from "@/server/services/journalService";
import { ArticleCard } from "@/components/journal/ArticleCard";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Travel Journal — Avolo",
  description: "AI-generated destination guides to help you plan smarter trips.",
};

async function ArticleGrid() {
  const articles = await listArticles();

  if (articles.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center">
        <span className="material-symbols-outlined text-5xl text-steel mb-4">
          article
        </span>
        <h2 className="text-lg font-semibold text-ink mb-2">No articles yet</h2>
        <p className="text-sm text-steel max-w-xs">
          Travel guides are generated automatically when you explore a destination.
        </p>
      </div>
    );
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {articles.map((article) => (
        <ArticleCard key={article.slug} article={article} />
      ))}
    </div>
  );
}

export default function JournalPage() {
  return (
    <main className="mx-auto max-w-5xl px-4 py-10 sm:px-6">
      <div className="mb-8">
        <h1
          className="text-3xl font-bold text-ink"
          style={{ fontFamily: "var(--font-editorial)" }}
        >
          Travel Journal
        </h1>
        <p className="text-sm text-steel mt-1">
          AI-generated destination guides crafted for real travellers.
        </p>
      </div>

      <Suspense
        fallback={
          <div className="flex items-center gap-3 py-12 text-steel">
            <span className="inline-block h-5 w-5 animate-spin rounded-full border-2 border-primary border-t-transparent" />
            <span>Loading guides…</span>
          </div>
        }
      >
        <ArticleGrid />
      </Suspense>
    </main>
  );
}
