// 主題標籤的單一來源（前端顯示 + 後端 process / retag 共用）
// 顯示用對照表：含 civic-tech 以便正確顯示舊資料
export const TAG_ZH: Record<string, string> = {
  "open-data": "開放資料",
  "transparency": "政府透明",
  "e-participation": "數位參與",
  "ai-governance": "AI 治理",
  "election": "選舉科技",
  "environment": "環境永續",
  "anti-corruption": "反腐倡廉",
  "accessibility": "數位平權",
  "open-source": "開放原始碼",
  "digital-rights": "數位人權",
  "public-service": "公共服務",
  "cybersecurity": "資訊安全",
  "procurement": "政府採購",
  "smart-city": "智慧城市",
  "digital-health": "數位健康",
  // 舊資料殘留，僅供顯示，不再指派
  "civic-tech": "公民科技",
};

// 可指派給文章的標籤清單（不含過於籠統的 civic-tech）
export const ALLOWED_TAGS = [
  "open-data",
  "transparency",
  "e-participation",
  "ai-governance",
  "election",
  "environment",
  "anti-corruption",
  "accessibility",
  "open-source",
  "digital-rights",
  "public-service",
  "cybersecurity",
  "procurement",
  "smart-city",
  "digital-health",
];

export function tagZh(tag: string): string {
  return TAG_ZH[tag] ?? tag;
}
