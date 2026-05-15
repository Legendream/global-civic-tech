"use client";

import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { type Article } from "./supabase";

type BookmarkContextType = {
  bookmarks: Article[];
  isBookmarked: (id: string) => boolean;
  toggleBookmark: (article: Article) => void;
  count: number;
};

const BookmarkContext = createContext<BookmarkContextType>({
  bookmarks: [],
  isBookmarked: () => false,
  toggleBookmark: () => {},
  count: 0,
});

export function BookmarkProvider({ children }: { children: ReactNode }) {
  const [bookmarks, setBookmarks] = useState<Article[]>([]);

  useEffect(() => {
    try {
      const raw = localStorage.getItem("civic-bookmarks");
      if (raw) setBookmarks(JSON.parse(raw));
    } catch {}
  }, []);

  const toggleBookmark = (article: Article) => {
    setBookmarks((prev) => {
      const exists = prev.some((b) => b.id === article.id);
      const next = exists
        ? prev.filter((b) => b.id !== article.id)
        : [article, ...prev];
      try { localStorage.setItem("civic-bookmarks", JSON.stringify(next)); } catch {}
      return next;
    });
  };

  const isBookmarked = (id: string) => bookmarks.some((b) => b.id === id);

  return (
    <BookmarkContext.Provider value={{ bookmarks, isBookmarked, toggleBookmark, count: bookmarks.length }}>
      {children}
    </BookmarkContext.Provider>
  );
}

export const useBookmarks = () => useContext(BookmarkContext);
