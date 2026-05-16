import Link from "next/link";
import type { JournalArticle } from "@prisma/client";
import { fetchUnsplashPhoto } from "@/lib/server/photos";

interface Props {
  article: Pick<JournalArticle, "slug" | "destination" | "iataCode" | "title" | "generatedAt">;
}

export async function ArticleCard({ article }: Props) {
  const imageUrl = await fetchUnsplashPhoto(`${article.destination} travel`);

  return (
    <Link
      href={`/journal/${article.slug}`}
      className="group flex flex-col rounded-2xl border border-outline-variant bg-surface overflow-hidden hover:border-primary/40 hover:shadow-sm transition-all"
    >
      {/* Hero image */}
      <div className="h-40 bg-surface-container overflow-hidden">
        {imageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={imageUrl}
            alt={article.destination}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <span className="material-symbols-outlined text-4xl text-on-surface-variant/30">travel_explore</span>
          </div>
        )}
      </div>

      <div className="flex flex-col gap-3 p-5">
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center rounded-full bg-primary/10 px-3 py-0.5 text-xs font-medium text-primary">
            {article.iataCode}
          </span>
        </div>

        <div>
          <h2
            className="text-base font-semibold text-on-surface group-hover:text-primary transition-colors line-clamp-2"
            style={{ fontFamily: "var(--font-manrope)" }}
          >
            {article.title}
          </h2>
          <p className="text-sm text-on-surface-variant mt-1">{article.destination}</p>
        </div>

        <div className="mt-auto flex items-center justify-between">
          <span className="text-xs text-on-surface-variant">
            {new Intl.DateTimeFormat("en", { month: "short", year: "numeric" }).format(new Date(article.generatedAt))}
          </span>
          <span className="text-xs font-medium text-primary opacity-0 group-hover:opacity-100 transition-opacity">
            Read guide →
          </span>
        </div>
      </div>
    </Link>
  );
}
