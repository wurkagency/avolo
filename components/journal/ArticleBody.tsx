"use client";

import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

interface Props {
  body: string;
}

export function ArticleBody({ body }: Props) {
  return (
    <div className="
      text-sm leading-relaxed text-ink max-w-none
      [&_h1]:hidden
      [&_h2]:text-xl [&_h2]:font-semibold [&_h2]:text-ink [&_h2]:mt-8 [&_h2]:mb-3 [&_h2]:leading-snug
      [&_h3]:text-base [&_h3]:font-semibold [&_h3]:text-ink [&_h3]:mt-6 [&_h3]:mb-2
      [&_p]:text-ink [&_p]:leading-relaxed [&_p]:mb-4
      [&_ul]:mb-4 [&_ul]:pl-5 [&_ul]:list-disc [&_ul]:space-y-1
      [&_ol]:mb-4 [&_ol]:pl-5 [&_ol]:list-decimal [&_ol]:space-y-1
      [&_li]:text-ink [&_li]:leading-relaxed
      [&_strong]:font-semibold [&_strong]:text-ink
      [&_em]:italic
      [&_a]:text-primary [&_a]:no-underline hover:[&_a]:underline
      [&_blockquote]:border-l-4 [&_blockquote]:border-primary/30 [&_blockquote]:pl-4 [&_blockquote]:italic [&_blockquote]:text-steel [&_blockquote]:my-4
      [&_hr]:border-hairline [&_hr]:my-6
      [&_code]:text-primary [&_code]:bg-surface [&_code]:px-1 [&_code]:py-0.5 [&_code]:rounded [&_code]:text-xs
      [&_pre]:bg-surface [&_pre]:rounded-xl [&_pre]:p-4 [&_pre]:overflow-x-auto [&_pre]:my-4
      [&_table]:w-full [&_table]:border-collapse [&_table]:my-4
      [&_th]:border [&_th]:border-hairline [&_th]:px-3 [&_th]:py-2 [&_th]:text-left [&_th]:font-semibold [&_th]:bg-surface
      [&_td]:border [&_td]:border-hairline [&_td]:px-3 [&_td]:py-2
    ">
      <ReactMarkdown remarkPlugins={[remarkGfm]}>{body}</ReactMarkdown>
    </div>
  );
}
