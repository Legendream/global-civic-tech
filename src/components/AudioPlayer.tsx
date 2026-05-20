"use client";

import { useEffect, useRef } from "react";

export default function AudioPlayer({ src }: { src: string }) {
  const ref = useRef<HTMLAudioElement>(null);

  useEffect(() => {
    const audio = ref.current;
    if (!audio) return;

    // OpenAI TTS 的 mp3 在瀏覽器中 duration 會是 Infinity，使原生控制列的
    // 秒數與進度卡住。強制 seek 到結尾讓瀏覽器算出真實長度，再跳回開頭。
    function fixDuration() {
      if (audio!.duration !== Infinity && !Number.isNaN(audio!.duration)) return;
      const snapBack = () => {
        audio!.removeEventListener("timeupdate", snapBack);
        audio!.currentTime = 0;
      };
      audio!.addEventListener("timeupdate", snapBack);
      audio!.currentTime = 1e101;
    }

    if (audio.readyState >= 1) fixDuration();
    audio.addEventListener("loadedmetadata", fixDuration);
    return () => audio.removeEventListener("loadedmetadata", fixDuration);
  }, [src]);

  return <audio ref={ref} controls className="w-full h-9" src={src} />;
}
