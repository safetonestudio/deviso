const path = require("path");

module.exports = {
  plugins: {
    "@tailwindcss/postcss": {},
    // Doit rester APRES Tailwind : retablit space-*, divide-* et l'interligne
    // des tailles de texte de la v3 (voir le fichier). Chemin absolu : Turbopack
    // evalue cette config depuis .next/build, un "./" n'y serait pas resolu.
    [path.join(process.cwd(), "postcss-compat-tw3.js")]: {},
  },
};
