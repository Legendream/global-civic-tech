"use client";

import { useRef, useState, useEffect } from "react";

export default function AudioPlayer({
  src,
  title,
  hint,
}: {
  src: string;
  title: string;
  hint: string;
}) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [playing, setPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);

  useEffect(() => {
    const el = audioRef.current;
    if (!el) return;

    const onTime = () => {
      setCurrentTime(el.currentTime);
      setProgress(el.duration ? (el.currentTime / el.duration) * 100 : 0);
    };
    const onMeta = () => setDuration(el.duration);
    const onEnded = () => setPlaying(false);

    // OpenAI TTS 的 mp3（多段串接後尤其明顯）在瀏覽器中 duration 會回報為
    // Infinity，使進度條與秒數卡住。強制 seek 到極遠處讓瀏覽器算出真實長度，
    // durationchange 觸發後再跳回開頭。
    const fixInfiniteDuration = () => {
      if (el.duration !== Infinity && !Number.isNaN(el.duration)) return;
      const snapBack = () => {
        el.removeEventListener("timeupdate", snapBack);
        el.currentTime = 0;
      };
      el.addEventListener("timeupdate", snapBack);
      el.currentTime = 1e101;
    };

    el.addEventListener("timeupdate", onTime);
    el.addEventListener("loadedmetadata", onMeta);
    el.addEventListener("loadedmetadata", fixInfiniteDuration);
    el.addEventListener("durationchange", onMeta);
    el.addEventListener("ended", onEnded);
    if (el.readyState >= 1) {
      onMeta();
      fixInfiniteDuration();
    }
    return () => {
      el.removeEventListener("timeupdate", onTime);
      el.removeEventListener("loadedmetadata", onMeta);
      el.removeEventListener("loadedmetadata", fixInfiniteDuration);
      el.removeEventListener("durationchange", onMeta);
      el.removeEventListener("ended", onEnded);
    };
  }, []);

  const toggle = () => {
    const el = audioRef.current;
    if (!el) return;
    if (playing) {
      el.pause();
      setPlaying(false);
    } else {
      el.play();
      setPlaying(true);
    }
  };

  const seek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const el = audioRef.current;
    if (!el || !el.duration) return;
    const t = (parseFloat(e.target.value) / 100) * el.duration;
    el.currentTime = t;
    setProgress(parseFloat(e.target.value));
  };

  const fmt = (s: number) => {
    if (!s || isNaN(s)) return "0:00";
    const m = Math.floor(s / 60);
    const sec = Math.floor(s % 60);
    return `${m}:${sec.toString().padStart(2, "0")}`;
  };

  return (
    <div className="px-6 pt-5 pb-4 border-b border-zinc-100 bg-indigo-50">
      <audio ref={audioRef} src={src} preload="metadata" />

      <div className="flex items-center gap-3">
        {/* Play / Pause button */}
        <button
          onClick={toggle}
          aria-label={playing ? "暫停" : "播放"}
          className="w-10 h-10 rounded-full bg-indigo-600 hover:bg-indigo-700 active:scale-95 flex items-center justify-center shrink-0 transition-all cursor-pointer shadow-sm"
        >
          {playing ? (
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="white" className="w-4 h-4">
              <path d="M5.75 3a.75.75 0 00-.75.75v12.5c0 .414.336.75.75.75h1.5a.75.75 0 00.75-.75V3.75A.75.75 0 007.25 3h-1.5zM12.75 3a.75.75 0 00-.75.75v12.5c0 .414.336.75.75.75h1.5a.75.75 0 00.75-.75V3.75a.75.75 0 00-.75-.75h-1.5z" />
            </svg>
          ) : (
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="white" className="w-4 h-4 ml-0.5">
              <path d="M6.3 2.841A1.5 1.5 0 004 4.11V15.89a1.5 1.5 0 002.3 1.269l9.344-5.89a1.5 1.5 0 000-2.538L6.3 2.84z" />
            </svg>
          )}
        </button>

        {/* Info + progress */}
        <div className="flex-1 min-w-0">
          <div className="flex items-baseline justify-between mb-1.5">
            <p className="text-sm font-semibold text-indigo-900 truncate">{title}</p>
            <span className="text-xs text-indigo-400 shrink-0 ml-2 tabular-nums">
              {fmt(currentTime)} / {fmt(duration)}
            </span>
          </div>
          <input
            type="range"
            min={0}
            max={100}
            value={progress}
            onChange={seek}
            className="w-full h-1.5 rounded-full accent-indigo-600 cursor-pointer"
          />
          <p className="text-xs text-indigo-500 mt-1">{hint}</p>
        </div>
      </div>
    </div>
  );
}
