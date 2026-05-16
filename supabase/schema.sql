-- Global Civic Tech Watch — Supabase Schema
-- 在 Supabase Dashboard > SQL Editor 執行此檔案

CREATE TABLE IF NOT EXISTS articles (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title_original TEXT NOT NULL,
  title_zh TEXT,
  title_en TEXT,
  summary_zh TEXT,
  summary_en TEXT,
  url TEXT UNIQUE NOT NULL,
  source TEXT NOT NULL,
  country TEXT,
  country_code CHAR(2),
  tags TEXT[] DEFAULT '{}',
  language_original TEXT DEFAULT 'en',
  published_at TIMESTAMPTZ,
  content_snippet TEXT,
  content_snippet_zh TEXT,
  processed BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS daily_digests (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  date DATE UNIQUE NOT NULL,
  content_zh TEXT NOT NULL,
  content_en TEXT NOT NULL,
  article_count INTEGER DEFAULT 0,
  audio_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_articles_processed ON articles (processed);
CREATE INDEX IF NOT EXISTS idx_articles_published_at ON articles (published_at DESC);
CREATE INDEX IF NOT EXISTS idx_articles_country_code ON articles (country_code);
CREATE INDEX IF NOT EXISTS idx_daily_digests_date ON daily_digests (date DESC);

-- Row Level Security
ALTER TABLE articles ENABLE ROW LEVEL SECURITY;
ALTER TABLE daily_digests ENABLE ROW LEVEL SECURITY;

-- 公眾可讀，只有 service role 可寫
CREATE POLICY "Public read articles"
  ON articles FOR SELECT USING (true);

CREATE POLICY "Public read digests"
  ON daily_digests FOR SELECT USING (true);

-- Explicit grants (required for Data API access after Supabase 2026 change)
GRANT SELECT ON articles TO anon;
GRANT SELECT ON daily_digests TO anon;

GRANT SELECT, INSERT, UPDATE, DELETE ON articles TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON daily_digests TO service_role;
