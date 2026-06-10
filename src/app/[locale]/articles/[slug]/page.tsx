import Link from "next/link";
import { notFound } from "next/navigation";
import { getPost, getPostSlugs } from "@/lib/posts";

export function generateStaticParams() {
  return getPostSlugs().map((slug) => ({ slug }));
}

export default async function ArticlePage({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}) {
  const { locale, slug } = await params;
  const post = getPost(slug);
  if (!post) notFound();

  return (
    <div className="max-w-3xl mx-auto px-4 py-12">
      <Link
        href={`/${locale}/articles`}
        className="text-sm text-indigo-600 hover:text-indigo-800 transition-colors"
      >
        ← 專欄
      </Link>

      <article className="mt-6">
        <header className="mb-8 pb-6 border-b border-zinc-100">
          <div className="text-xs text-zinc-400 tech-mono mb-3">{post.date}</div>
          <h1 className="text-3xl font-bold text-zinc-900 leading-tight">{post.title}</h1>
          {post.author && (
            <div className="mt-4 flex items-center flex-wrap gap-x-2 gap-y-1 text-sm">
              <span className="font-medium text-zinc-700">{post.author}</span>
              {post.coedit && (
                <span className="text-zinc-400">・{post.coedit}</span>
              )}
            </div>
          )}
        </header>

        <div
          className="article-prose"
          dangerouslySetInnerHTML={{ __html: post.html }}
        />
      </article>
    </div>
  );
}
