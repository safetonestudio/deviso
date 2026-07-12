"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { Sun, Moon } from "lucide-react";

const THEME_KEY = "deviso_theme";
type Theme = "dark" | "light";

interface ThemeCtx {
  theme: Theme;
  toggle: () => void;
}

const ThemeContext = createContext<ThemeCtx>({ theme: "dark", toggle: () => {} });

function applyTheme(t: Theme) {
  if (t === "light") {
    document.documentElement.classList.add("light");
  } else {
    document.documentElement.classList.remove("light");
  }
}

/** Wraps the dashboard layout. Lit le thème sauvegardé et l'applique sur <html>.
 *  Le cleanup du useEffect retire la classe au démontage → les landing pages
 *  ne sont jamais affectées par le mode clair. */
export function DashboardThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setTheme] = useState<Theme>("dark");

  useEffect(() => {
    const saved = (localStorage.getItem(THEME_KEY) as Theme) || "dark";
    setTheme(saved);
    applyTheme(saved);
    // Nettoyage au démontage : les landing pages ne voient jamais la classe .light
    return () => document.documentElement.classList.remove("light");
  }, []);

  function toggle() {
    const next: Theme = theme === "dark" ? "light" : "dark";
    setTheme(next);
    localStorage.setItem(THEME_KEY, next);
    applyTheme(next);
  }

  return (
    <ThemeContext.Provider value={{ theme, toggle }}>
      {children}
    </ThemeContext.Provider>
  );
}

/** Bouton toggle mode clair/sombre, à placer dans la sidebar footer. */
export function ThemeToggle() {
  const { theme, toggle } = useContext(ThemeContext);
  const isLight = theme === "light";

  return (
    <button
      onClick={toggle}
      className="flex items-center gap-3 w-full px-3 py-2.5 rounded-xl text-sm font-medium text-gray-400 hover:text-white hover:bg-ds-elevated transition-all mb-2"
    >
      {isLight
        ? <Moon size={16} className="shrink-0" />
        : <Sun size={16} className="shrink-0" />
      }
      <span>{isLight ? "Mode sombre" : "Mode clair"}</span>
    </button>
  );
}
