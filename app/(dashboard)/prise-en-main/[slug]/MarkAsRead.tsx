"use client";

import { useEffect } from "react";

const STORAGE_KEY = "deviso_guides_read";

export function MarkAsRead({ slug }: { slug: string }) {
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      const slugs: string[] = stored ? JSON.parse(stored) : [];
      if (!slugs.includes(slug)) {
        localStorage.setItem(STORAGE_KEY, JSON.stringify([...slugs, slug]));
      }
    } catch {}
  }, [slug]);

  return null;
}
