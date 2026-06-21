/**
 * 將當日摘要轉成語音 mp3，上傳至 Supabase Storage，並清除 180 天前的舊檔
 * 執行：npx tsx scripts/audio.ts
 */

try { process.loadEnvFile?.(".env.local"); } catch {}
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_KEY!
);

const BUCKET = "audio";
const RETAIN_DAYS = 180;
const TTS_CHAR_LIMIT = 4096; // OpenAI TTS 單次請求的 input 字元上限
const CHUNK_SIZE = 3800; // 切段目標長度，保留餘裕在段落／句子邊界斷句

async function textToSpeech(text: string): Promise<Buffer> {
  const MAX_RETRIES = 3;
  let lastError: Error | undefined;

  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    try {
      const res = await fetch("https://api.openai.com/v1/audio/speech", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${process.env.OPENAI_API_KEY!}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "tts-1",
          voice: "nova",
          input: text.slice(0, TTS_CHAR_LIMIT),
          response_format: "mp3",
        }),
      });

      if (!res.ok) {
        throw new Error(`OpenAI TTS error: ${res.status} ${await res.text()}`);
      }

      return Buffer.from(await res.arrayBuffer());
    } catch (err) {
      lastError = err as Error;
      if (attempt < MAX_RETRIES) {
        const delay = attempt * 10000;
        console.warn(`TTS attempt ${attempt} failed: ${lastError.message}. Retrying in ${delay / 1000}s...`);
        await new Promise((r) => setTimeout(r, delay));
      }
    }
  }

  throw lastError!;
}

// 依段落／句子切成多段，避開 OpenAI TTS 單次 4096 字元上限
function splitIntoChunks(text: string): string[] {
  const chunks: string[] = [];
  let current = "";

  const flush = () => {
    if (current.trim()) chunks.push(current.trim());
    current = "";
  };

  for (const paragraph of text.split("\n")) {
    if (current.length + paragraph.length + 1 <= CHUNK_SIZE) {
      current += (current ? "\n" : "") + paragraph;
      continue;
    }
    flush();
    if (paragraph.length <= CHUNK_SIZE) {
      current = paragraph;
      continue;
    }
    for (const sentence of paragraph.split(/(?<=[。！？.!?])/)) {
      if (current.length + sentence.length > CHUNK_SIZE) flush();
      current += sentence;
    }
  }
  flush();
  return chunks;
}

async function deleteOldFiles() {
  const { data: files, error } = await supabase.storage.from(BUCKET).list();
  if (error || !files) return;

  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - RETAIN_DAYS);

  const toDelete = files
    .filter((f) => {
      const match = f.name.match(/^digest-(\d{4}-\d{2}-\d{2})\.mp3$/);
      return match ? new Date(match[1]) < cutoff : false;
    })
    .map((f) => f.name);

  if (toDelete.length > 0) {
    await supabase.storage.from(BUCKET).remove(toDelete);
    console.log(`Deleted ${toDelete.length} old file(s): ${toDelete.join(", ")}`);
  }
}

async function main() {
  const targetDate =
    process.env.DIGEST_DATE ?? new Date().toISOString().split("T")[0];
  console.log(`Generating audio for ${targetDate}...`);

  const { data: digest, error } = await supabase
    .from("daily_digests")
    .select("content_zh, audio_url")
    .eq("date", targetDate)
    .single();

  if (error || !digest) {
    console.log("No digest found for", targetDate, "— skipping audio.");
    return;
  }

  if (digest.audio_url) {
    console.log("Audio already exists, skipping.");
    return;
  }

  if (!digest.content_zh) {
    console.log("Digest content is empty (no articles today) — skipping audio.");
    return;
  }

  const chunks = splitIntoChunks(digest.content_zh);
  console.log(
    `Digest is ${digest.content_zh.length} chars → ${chunks.length} TTS chunk(s).`
  );

  let mp3: Buffer;
  try {
    const parts: Buffer[] = [];
    for (let i = 0; i < chunks.length; i++) {
      console.log(
        `  TTS chunk ${i + 1}/${chunks.length} (${chunks[i].length} chars)...`
      );
      parts.push(await textToSpeech(chunks[i]));
    }
    mp3 = Buffer.concat(parts);
  } catch (err) {
    console.error("TTS failed after all retries:", (err as Error).message);
    process.exit(1);
  }

  const filename = `digest-${targetDate}.mp3`;
  const { error: uploadError } = await supabase.storage
    .from(BUCKET)
    .upload(filename, mp3, { contentType: "audio/mpeg", upsert: true });

  if (uploadError) {
    console.error("Upload error:", uploadError);
    process.exit(1);
  }

  const { data: { publicUrl } } = supabase.storage
    .from(BUCKET)
    .getPublicUrl(filename);

  // 加上版本參數，讓每次重新生成都是全新網址，避免瀏覽器／CDN 沿用舊快取
  const versionedUrl = `${publicUrl}?v=${Date.now()}`;

  await supabase
    .from("daily_digests")
    .update({ audio_url: versionedUrl })
    .eq("date", targetDate);

  console.log(`Audio saved: ${versionedUrl}`);

  await deleteOldFiles();
}

main();
