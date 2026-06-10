import Link from "next/link";
import { getAllPosts } from "@/lib/posts";

export default async function ArticlesPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const posts = getAllPosts();

  return (
    <div className="max-w-4xl mx-auto px-4 py-12 space-y-8">
      <section>
        <h1 className="text-2xl font-bold text-zinc-900 mb-3">專欄</h1>
        <p className="text-zinc-500 leading-relaxed max-w-2xl">
          公民科技案例研究與觀察，每篇都附上可查證的資料來源。
        </p>
      </section>

      {posts.length > 0 ? (
        <section className="space-y-3">
          {posts.map((post) => (
            <Link
              key={post.slug}
              href={`/${locale}/articles/${post.slug}`}
              className="block bg-white border border-zinc-200 rounded-xl p-6 hover:border-indigo-200 transition-colors"
            >
              <div className="text-xs text-zinc-400 tech-mono mb-2">{post.date}</div>
              <h2 className="text-lg font-semibold text-zinc-900 mb-2 leading-snug">
                {post.title}
              </h2>
              {post.excerpt && (
                <p className="text-sm text-zinc-600 leading-relaxed">{post.excerpt}</p>
              )}
            </Link>
          ))}
        </section>
      ) : (
        <div className="bg-white border border-dashed border-zinc-200 rounded-xl p-10 text-center text-zinc-400 text-sm">
          尚無文章
        </div>
      )}
    </div>
  );
}
