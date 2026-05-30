import { createClient } from "@supabase/supabase-js";

export type Article = {
  id: string;
  title_original: string;
  title_zh: string | null;
  title_en: string | null;
  summary_zh: string | null;
  summary_en: string | null;
  url: string;
  source: string;
  country: string | null;
  country_code: string | null;
  tags: string[];
  language_original: string;
  published_at: string | null;
  content_snippet: string | null;
  content_snippet_zh: string | null;
  created_at: string;
  processed: boolean;
  // 公民科技相關性：2=明確相關 1=邊緣（政府IT等） 0=無關（雜訊）。
  // 舊資料為 null（視為照常顯示）。前端只濾掉 0。
  relevance: number | null;
};

export type DailyDigest = {
  id: string;
  date: string;
  content_zh: string;
  content_en: string;
  article_count: number;
  audio_url: string | null;
  created_at: string;
};

// 只排除明確雜訊（relevance=0）；NULL/undefined（舊資料或欄位尚未建立）與 1、2 皆保留。
// 在 JS 端過濾，避免前端查詢硬依賴 relevance 欄位（遷移未跑時也不會壞）。
export function isRelevant(a: { relevance?: number | null }): boolean {
  return a.relevance == null || a.relevance >= 1;
}

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "https://placeholder.supabase.co";
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "placeholder";

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
