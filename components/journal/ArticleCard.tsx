import Link from "next/link";
import type { JournalArticle } from "@prisma/client";

interface Props {
  article: Pick<JournalArticle, "slug" | "destination" | "iataCode" | "title" | "generatedAt">;
}

export function ArticleCard({ article }: Props) {
  return (
    <Link
      href={`/journal/${article.slug}`}
      className="group flex flex-col gap-3 rounded-2xl border border-outline-variant bg-surface p-6 hover:border-primary/40 hover:shadow-sm transition-all"
    >
      <div className="flex items-center gap-2">
        <span className="inline-flex items-center rounded-full bg-primary/10 px-3 py-0.5 text-xs font-medium text-primary">
          {article.iataCode}
        </span>
      </div>

      <div>
        <h2
          className="text-lg font-semibold text-on-surface group-hover:text-primary transition-colors line-clamp-2"
          style={{ fontFamily: "var(--font-manrope)" }}
        >
          {article.title}
        </h2>
        <p className="text-sm text-on-surface-variant mt-1">{article.destination}</p>
      </div>

      <div className="mt-auto pt-2 flex items-center justify-between">
        <span className="text-xs text-on-surface-variant">
          {new Intl.DateTimeFormat("en", { month: "short", year: "numeric" }).format(
            new Date(article.generatedAt),
          )}
        </span>
        <span className="text-xs font-medium text-primary opacity-0 group-hover:opacity-100 transition-opacity">
          Read guide →
        </span>
      </div>
    </Link>
  );
}
