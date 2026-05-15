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

async function textToSpeech(text: string): Promise<Buffer> {
  const res = await fetch("https://api.openai.com/v1/audio/speech", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.OPENAI_API_KEY!}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "tts-1",
      voice: "nova",
      input: text.slice(0, 4000),
      response_format: "mp3",
    }),
  });

  if (!res.ok) {
    throw new Error(`OpenAI TTS error: ${res.status} ${await res.text()}`);
  }

  return Buffer.from(await res.arrayBuffer());
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

  let mp3: Buffer;
  try {
    mp3 = await textToSpeech(digest.content_zh);
  } catch (err) {
    console.warn("TTS failed, skipping audio:", (err as Error).message);
    return;
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

  await supabase
    .from("daily_digests")
    .update({ audio_url: publicUrl })
    .eq("date", targetDate);

  console.log(`Audio saved: ${publicUrl}`);

  await deleteOldFiles();
}

main();
