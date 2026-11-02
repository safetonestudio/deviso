"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { Sun, Moon } from "lucide-react";

const THEME_KEY = "deviso_theme";
type Theme = "dark" | "light";

interface ThemeCtx {
  theme: Theme;
  toggle: () => void;
}

const ThemeContext = createContext<ThemeCtx>({ theme: "light", toggle: () => {} });

function applyTheme(t: Theme) {
  if (t === "light") {
    document.documentElement.classList.add("light");
  } else {
    document.documentElement.classList.remove("light");
  }
}

/**
 * Applique le theme avant le premier affichage. Sans ce script, la page
 * s'affichait d'abord dans le theme par defaut du serveur puis basculait au
 * montage (flash). Clair par defaut : seul un choix explicite "dark" garde
 * le theme sombre. Autorise par la CSP ('unsafe-inline' sur script-src).
 */
const SCRIPT_THEME = `try{if(localStorage.getItem("${THEME_KEY}")!=="dark")document.documentElement.classList.add("light")}catch(e){document.documentElement.classList.add("light")}`;

/** Enveloppe de l'app (tableau de bord et cabinet). Pose `.ds-app`, qui active
 *  la palette Deviso (voir globals.css), et les polices de l'app.
 *  Le cleanup du useEffect retire `.light` au demontage : les landing pages ne
 *  sont jamais affectees par le mode clair. */
export function DashboardThemeProvider({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  const [theme, setTheme] = useState<Theme>("light");

  useEffect(() => {
    let saved: Theme = "light";
    try {
      saved = localStorage.getItem(THEME_KEY) === "dark" ? "dark" : "light";
    } catch {}
    setTheme(saved);
    applyTheme(saved);
    return () => document.documentElement.classList.remove("light");
  }, []);

  function toggle() {
    const next: Theme = theme === "dark" ? "light" : "dark";
    setTheme(next);
    try {
      localStorage.setItem(THEME_KEY, next);
    } catch {}
    applyTheme(next);
  }

  return (
    <ThemeContext.Provider value={{ theme, toggle }}>
      <script dangerouslySetInnerHTML={{ __html: SCRIPT_THEME }} />
      <div className={`ds-app ${className}`.trim()}>{children}</div>
    </ThemeContext.Provider>
  );
}

/** Bouton de theme en carre encadre, icone seule, place a cote du logo Deviso
 *  (barre laterale, barre mobile, en-tete cabinet) : toujours au meme endroit. */
export function ThemeToggleIcone() {
  const { theme, toggle } = useContext(ThemeContext);
  const clair = theme === "light";
  const libelle = clair ? "Passer en mode sombre" : "Passer en mode clair";
  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={libelle}
      title={libelle}
      className="w-9 h-9 shrink-0 grid place-items-center rounded-xl border border-gray-500/60 bg-ds-elevated text-ink shadow-ds-sm hover:border-indigo-500 hover:text-indigo-400 transition-colors"
    >
      {clair ? <Moon size={17} /> : <Sun size={17} />}
    </button>
  );
}

/** Bouton toggle mode clair/sombre, à placer dans la sidebar footer. */
export function ThemeToggle({ compact = false }: { compact?: boolean }) {
  const { theme, toggle } = useContext(ThemeContext);
  const isLight = theme === "light";

  // Compact : bouton encadre pour une barre horizontale (en-tete cabinet).
  // Par defaut : pleine largeur, pour la colonne laterale du tableau de bord.
  const classe = compact
    ? "inline-flex items-center gap-2 rounded-lg border border-ds-border bg-ds-elevated px-3 py-2 text-sm font-medium text-gray-400 hover:text-ink hover:bg-ds-surface transition-colors whitespace-nowrap"
    : "flex items-center gap-3 w-full px-3 py-2.5 rounded-xl text-sm font-medium text-gray-400 hover:text-ink hover:bg-ds-elevated transition-all mb-2";

  return (
    <button onClick={toggle} className={classe}>
      {isLight
        ? <Moon size={16} className="shrink-0" />
        : <Sun size={16} className="shrink-0" />
      }
      <span>{isLight ? "Mode sombre" : "Mode clair"}</span>
    </button>
  );
}
