-- 遷移：為 articles 加上「公民科技相關性」評分欄位
-- 在 Supabase Dashboard > SQL Editor 執行一次即可
--
-- relevance：2=明確公民科技 1=邊緣（政府IT/採購/人事） 0=無關（純國防、個人理財、政治八卦）
-- NULL = 尚未評分（現有 588 篇歷史文章維持 NULL，前端照常顯示）
-- 未來新文章由 process.ts 自動打分，前端只會濾掉 0 分的雜訊。

ALTER TABLE articles
  ADD COLUMN IF NOT EXISTS relevance SMALLINT;

-- 既有 anon / service_role 的表層級 GRANT 已涵蓋新欄位，無需額外授權。
