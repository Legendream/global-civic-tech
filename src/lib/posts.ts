import fs from "fs";
import path from "path";
import matter from "gray-matter";
import { marked } from "marked";

const POSTS_DIR = path.join(process.cwd(), "content/posts");

export type PostMeta = {
  slug: string;
  title: string;
  date: string;
  excerpt: string;
  author: string;
  coedit: string;
};

export type Post = PostMeta & { html: string };

function readPostFile(slug: string) {
  const file = path.join(POSTS_DIR, `${slug}.md`);
  if (!fs.existsSync(file)) return null;
  return matter(fs.readFileSync(file, "utf8"));
}

// gray-matter 會把未加引號的 YAML 日期解析成 Date 物件，統一格式化為 YYYY-MM-DD
function fmtDate(d: unknown): string {
  if (!d) return "";
  if (d instanceof Date) return d.toISOString().slice(0, 10);
  return String(d);
}

export function getPostSlugs(): string[] {
  if (!fs.existsSync(POSTS_DIR)) return [];
  return fs
    .readdirSync(POSTS_DIR)
    .filter((f) => f.endsWith(".md"))
    .map((f) => f.replace(/\.md$/, ""));
}

export function getAllPosts(): PostMeta[] {
  return getPostSlugs()
    .map((slug) => {
      const parsed = readPostFile(slug);
      const data = parsed?.data ?? {};
      return {
        slug,
        title: data.title ?? slug,
        date: fmtDate(data.date),
        excerpt: data.excerpt ?? "",
        author: data.author ?? "",
        coedit: data.coedit ?? "",
      };
    })
    // 依日期新到舊排序
    .sort((a, b) => (a.date < b.date ? 1 : -1));
}

export function getPost(slug: string): Post | null {
  const parsed = readPostFile(slug);
  if (!parsed) return null;
  const { data, content } = parsed;
  const html = marked.parse(content, { async: false }) as string;
  return {
    slug,
    title: data.title ?? slug,
    date: fmtDate(data.date),
    excerpt: data.excerpt ?? "",
    author: data.author ?? "",
    coedit: data.coedit ?? "",
    html,
  };
}
