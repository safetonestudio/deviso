"use client";

import { useState, useEffect, useCallback } from "react";

const STORAGE_KEY = "deviso_guided_tour";

export function useGuidedTour() {
  const [enabled, setEnabled] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    setEnabled(localStorage.getItem(STORAGE_KEY) === "1");
  }, []);

  const toggle = useCallback((value: boolean) => {
    setEnabled(value);
    if (value) {
      localStorage.setItem(STORAGE_KEY, "1");
    } else {
      localStorage.removeItem(STORAGE_KEY);
    }
  }, []);

  return { enabled: mounted && enabled, toggle, mounted };
}
