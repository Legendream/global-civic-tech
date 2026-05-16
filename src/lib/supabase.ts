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
  created_at: string;
  processed: boolean;
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

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "https://placeholder.supabase.co";
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "placeholder";

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
