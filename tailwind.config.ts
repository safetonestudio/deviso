import type { Config } from "tailwindcss";
import twColors from "tailwindcss/colors";

/**
 * Palettes de l'app, pilotees par le theme.
 *
 * Pourquoi. Le mode clair tenait avec une liste blanche de 112 surcharges
 * `!important` dans globals.css, une par classe exacte (`text-amber-200`,
 * `text-amber-200/80`...). Une variante oubliee restait pastel et devenait
 * illisible en clair sans que rien ne le signale. On supprime la classe de bug
 * a la racine : chaque nuance Tailwind pointe vers une variable CSS
 * semantique (neutre, accent, alerte, danger, info) que le theme redefinit.
 *
 * Hors de l'app (site public, blog), aucune de ces variables n'est definie :
 * la valeur de repli est la couleur Tailwind d'origine, donc rien ne change.
 * Dans l'app (`.ds-app`, pose par DashboardThemeProvider), les variables
 * prennent la palette Deviso, en sombre comme en clair.
 */
const ETAPES = [50, 100, 200, 300, 400, 500, 600, 700, 800, 900, 950] as const;

function rgb(hex: string): string {
  const h = hex.replace("#", "");
  return [0, 2, 4].map((i) => parseInt(h.slice(i, i + 2), 16)).join(" ");
}

type Nuancier = Record<(typeof ETAPES)[number], string>;

/** Relie une palette Tailwind a une famille semantique, avec repli d'origine. */
function relier(origine: Nuancier, famille: string, replis: Partial<Nuancier> = {}) {
  return Object.fromEntries(
    ETAPES.map((e) => [e, `rgb(var(--${famille}-${e}, ${rgb(replis[e] ?? origine[e])}) / <alpha-value>)`])
  );
}

// Sur le site public, gray-500/600 passent sous le seuil AA sur fond sombre :
// ils etaient forces sur gray-400 par une regle !important. Meme rendu, sans regle.
const grisPublic = { 500: twColors.gray[400], 600: twColors.gray[400] };

const config: Config = {
  darkMode: "class",
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        // Neutres
        gray: relier(twColors.gray, "n", grisPublic),
        slate: relier(twColors.slate, "n"),
        zinc: relier(twColors.zinc, "n"),
        neutral: relier(twColors.neutral, "n"),
        stone: relier(twColors.stone, "n"),
        // Accent unique : le vert Deviso
        indigo: relier(twColors.indigo, "acc"),
        violet: relier(twColors.violet, "acc"),
        purple: relier(twColors.purple, "acc"),
        fuchsia: relier(twColors.fuchsia, "acc"),
        emerald: relier(twColors.emerald, "acc"),
        green: relier(twColors.green, "acc"),
        teal: relier(twColors.teal, "acc"),
        lime: relier(twColors.lime, "acc"),
        brand: relier(twColors.indigo, "acc"),
        // Alerte, danger, information
        amber: relier(twColors.amber, "warn"),
        yellow: relier(twColors.yellow, "warn"),
        orange: relier(twColors.orange, "warn"),
        red: relier(twColors.red, "dng"),
        rose: relier(twColors.rose, "dng"),
        pink: relier(twColors.pink, "dng"),
        blue: relier(twColors.blue, "inf"),
        sky: relier(twColors.sky, "inf"),
        cyan: relier(twColors.cyan, "inf"),
        // Texte principal et texte pose sur un aplat de couleur.
        // Repli blanc : hors app, `text-ink` rend exactement comme `text-white`.
        ink: "rgb(var(--ink, 255 255 255) / <alpha-value>)",
        "on-accent": "rgb(var(--on-accent, 255 255 255) / <alpha-value>)",
        ds: {
          bg:       "var(--ds-bg)",
          surface:  "var(--ds-surface)",
          elevated: "var(--ds-elevated)",
          border:   "var(--ds-border)",
        },
      },
      fontFamily: {
        sans: ["var(--font-app, var(--font-inter))", "Inter", "system-ui", "sans-serif"],
        display: ["var(--font-display, var(--font-app, var(--font-inter)))", "system-ui", "sans-serif"],
      },
      boxShadow: {
        "ds-sm":   "var(--ds-shadow-sm)",
        "ds-card": "var(--ds-shadow-card)",
      },
      animation: {
        "fade-in": "fadeIn 0.5s ease-in-out",
        "slide-up": "slideUp 0.6s ease-out",
        gradient: "gradient 8s ease infinite",
      },
      keyframes: {
        fadeIn: {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
        slideUp: {
          "0%": { opacity: "0", transform: "translateY(20px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        gradient: {
          "0%, 100%": { backgroundPosition: "0% 50%" },
          "50%": { backgroundPosition: "100% 50%" },
        },
      },
    },
  },
  plugins: [],
};

export default config;
